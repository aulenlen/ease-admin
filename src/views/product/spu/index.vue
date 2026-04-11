<template>
  <div class="art-full-height">
    <SpuSearch
      v-show="showSearchBar"
      v-model="searchForm"
      :brand-options="brandOptions"
      :category-options="categoryTree"
      @search="handleSearch"
      @reset="handleResetSearch"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshAll"
      >
        <template #left>
          <div class="spu-page__toolbar flex flex-col">
            <SpuStatusTabs v-model="activeTab" :items="tabItems" />

            <ElSpace wrap>
              <ElButton @click="router.push('/product/spu/create')" v-ripple>新增商品</ElButton>
              <ElButton :disabled="!selectedIds.length" @click="handleBatchPublish(1)" v-ripple>
                批量上架
              </ElButton>
              <ElButton :disabled="!selectedIds.length" @click="handleBatchPublish(0)" v-ripple>
                批量下架
              </ElButton>
            </ElSpace>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import {
    deleteSpu,
    fetchSpuPage,
    fetchSpuStats,
    publishSpu,
    type SpuFlag01,
    type SpuListItem,
    type SpuQueryParams
  } from '@/api/spu'
  import { fetchBrandPage, type BrandListItem } from '@/api/brand'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import SpuSearch, { type SpuSearchForm } from './modules/spu-search.vue'
  import { getSpuDisplayStatus, getSpuPublishAction } from './modules/spu-publish-action'
  import SpuStatusTabs, { type SpuStatusTabKey } from './modules/spu-status-tabs.vue'
  import { consumeSpuListDirtyFlag } from './modules/spu-list-cache'
  import { ElImage, ElMessageBox, ElTag } from 'element-plus'

  defineOptions({ name: 'ProductSpuPage' })

  const router = useRouter()
  const showSearchBar = ref(true)
  const selectedIds = ref<number[]>([])
  const brandOptions = ref<BrandListItem[]>([])
  const categoryTree = ref<CategoryTreeItem[]>([])
  const activeTab = ref<SpuStatusTabKey>('all')
  const stats = ref({
    all: 0,
    publish: 0,
    unpublish: 0,
    verify: 0,
    staged: 0
  })

  const searchForm = ref<SpuSearchForm>({
    keyword: undefined,
    brandId: undefined,
    categoryId: undefined
  })

  const tabItems = computed(() => [
    { key: 'all' as const, label: '全部商品', count: stats.value.all },
    { key: 'publish' as const, label: '已上架', count: stats.value.publish },
    { key: 'unpublish' as const, label: '未上架', count: stats.value.unpublish },
    { key: 'verify' as const, label: '待审核', count: stats.value.verify },
    { key: 'staged' as const, label: '已修改未发布', count: stats.value.staged }
  ])

  const buildTabQuery = (): Partial<SpuQueryParams> => {
    switch (activeTab.value) {
      case 'publish':
        return { publishStatus: 1 }
      case 'unpublish':
        return { publishStatus: 0 }
      case 'verify':
        return { verifyStatus: 0 }
      case 'staged':
        return { hasStagedChanges: 1 }
      default:
        return {}
    }
  }

  const buildSearchQuery = () => ({
    keyword: searchForm.value.keyword,
    brandId: searchForm.value.brandId,
    categoryId: searchForm.value.categoryId?.length
      ? searchForm.value.categoryId[searchForm.value.categoryId.length - 1]
      : undefined,
    ...buildTabQuery()
  })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchSpuPage,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          type: 'selection',
          width: 56
        },
        {
          type: 'index',
          width: 68,
          label: '序号'
        },
        {
          prop: 'pic',
          label: '商品图片',
          width: 110,
          formatter: (row) =>
            row.pic
              ? h(ElImage, {
                  src: row.pic,
                  fit: 'cover',
                  class: 'size-12 rounded-lg',
                  previewSrcList: [row.pic],
                  previewTeleported: true
                })
              : h('div', { class: 'text-xs text-g-500' }, '暂无图片')
        },
        {
          prop: 'name',
          label: '商品信息',
          minWidth: 280,
          formatter: (row) =>
            h('div', { class: 'flex flex-col gap-1' }, [
              h(
                'button',
                {
                  class: 'cursor-pointer text-left font-medium text-g-900',
                  onClick: () => router.push(`/product/spu/detail/${row.id}`)
                },
                row.name
              ),
              h(
                'div',
                { class: 'text-xs text-g-500' },
                `品牌：${row.brandName || '-'} ｜ 编码：${row.spuCode || '-'}`
              )
            ])
        },
        {
          prop: 'price',
          label: '售价区间',
          width: 140,
          formatter: (row) => {
            const min = Number(row.minPrice ?? 0)
            const max = Number(row.maxPrice ?? 0)
            return min === max ? `￥${min.toFixed(2)}` : `￥${min.toFixed(2)} - ￥${max.toFixed(2)}`
          }
        },
        {
          prop: 'sale',
          label: '销量',
          width: 90
        },
        {
          prop: 'publishStatus',
          label: '状态',
          width: 160,
          formatter: (row) => {
            const displayStatus = getSpuDisplayStatus(row)

            return h('div', { class: 'spu-page__status-cell' }, [
              h(
                ElTag,
                {
                  type: displayStatus.type
                },
                () => displayStatus.text
              ),
              Number(row.recommendStatus ?? 0) === 1
                ? h(ElTag, { type: 'danger' }, () => '推荐')
                : null
            ])
          }
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 150,
          fixed: 'right',
          formatter: (row) => {
            const publishAction = getSpuPublishAction(row)
            const moreActions: ButtonMoreItem[] = [
              {
                key: 'toggle-publish',
                label: publishAction.disabled
                  ? '待审核不可上架'
                  : publishAction.label === '发布更新'
                    ? '发布最新修改'
                    : `${publishAction.label}商品`,
                icon:
                  publishAction.label === '下架'
                    ? 'ri:download-line'
                    : publishAction.label === '发布更新'
                      ? 'ri:upload-cloud-2-line'
                      : 'ri:upload-line',
                color:
                  publishAction.label === '下架'
                    ? '#f59e0b'
                    : publishAction.label === '发布更新'
                      ? '#6366f1'
                      : '#10b981',
                disabled: publishAction.disabled
              },
              {
                key: 'delete',
                label: '删除商品',
                icon: 'ri:delete-bin-5-line',
                color: '#ef4444'
              }
            ]

            return h('div', { class: 'spu-page__actions flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                onClick: () => router.push(`/product/spu/detail/${row.id}`)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => router.push(`/product/spu/edit/${row.id}`)
              }),
              h(ArtButtonMore, {
                list: moreActions,
                onClick: (item: ButtonMoreItem) => handleMoreAction(item, row)
              })
            ])
          }
        }
      ]
    }
  })

  const loadBaseOptions = async () => {
    const [brandPage, categories] = await Promise.all([
      fetchBrandPage({ current: 1, size: 200 }),
      fetchCategoryTree()
    ])

    brandOptions.value = brandPage.records || []
    categoryTree.value = categories || []
  }

  const loadStats = async () => {
    stats.value = await fetchSpuStats({
      current: 1,
      size: 20,
      keyword: searchForm.value.keyword,
      brandId: searchForm.value.brandId,
      categoryId: searchForm.value.categoryId?.length
        ? searchForm.value.categoryId[searchForm.value.categoryId.length - 1]
        : undefined
    })
  }

  const refreshAll = async () => {
    await Promise.all([refreshData(), loadStats()])
  }

  const handleSearch = async () => {
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  }

  const handleResetSearch = async () => {
    resetSearchParams()
    searchForm.value = {
      keyword: undefined,
      brandId: undefined,
      categoryId: undefined
    }
    activeTab.value = 'all'
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  }

  const handleSelectionChange = (selection: SpuListItem[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  const handleDelete = async (row: SpuListItem) => {
    await ElMessageBox.confirm(`确定删除商品“${row.name}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteSpu(row.id)
    await refreshAll()
  }

  const handleMoreAction = async (item: ButtonMoreItem, row: SpuListItem) => {
    if (item.key === 'toggle-publish') {
      await handleSinglePublish(row)
      return
    }

    if (item.key === 'delete') {
      await handleDelete(row)
    }
  }

  const handleBatchPublish = async (publishStatus: SpuFlag01) => {
    const invalidRows = data.value.filter(
      (item) => selectedIds.value.includes(item.id) && getSpuPublishAction(item).disabled
    )

    if (invalidRows.length) {
      ElMessageBox.alert(
        '当前选中商品中包含待审核数据，待审核商品不允许执行上架操作。',
        '批量操作提示',
        {
          confirmButtonText: '知道了',
          type: 'warning'
        }
      )
      return
    }

    const actionText = publishStatus === 1 ? '上架' : '下架'
    await ElMessageBox.confirm(
      `确定${actionText}已选中的 ${selectedIds.value.length} 个商品吗？`,
      `批量${actionText}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await publishSpu(selectedIds.value, publishStatus)
    await refreshAll()
  }

  const handleSinglePublish = async (row: SpuListItem) => {
    const action = getSpuPublishAction(row)

    if (action.disabled) {
      await ElMessageBox.alert('待审核商品不能上架，请先完成审核。', '操作提示', {
        confirmButtonText: '知道了',
        type: 'warning'
      })
      return
    }

    await ElMessageBox.confirm(
      `${action.confirmTitle.replace('该商品', `商品“${row.name}”`)}`,
      action.label === '发布更新' ? '发布更新确认' : `${action.label}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await publishSpu([row.id], action.nextStatus)
    await refreshAll()
  }

  watch(activeTab, async () => {
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  })

  onMounted(async () => {
    await loadBaseOptions()
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  })

  onActivated(async () => {
    if (consumeSpuListDirtyFlag()) {
      await refreshAll()
      return
    }
    await refreshAll()
  })
</script>

<style scoped lang="scss">
  .spu-page__toolbar {
    gap: 12px;
  }

  .spu-page__status-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
    align-items: center;
  }

  .spu-page__status-cell :deep(.el-tag) {
    padding: 0 8px;
    margin-right: 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 999px;
  }

  .spu-page__status-cell :deep(.el-tag:last-child) {
    margin-right: 0;
  }

  .spu-page__actions {
    gap: 8px;
  }

  .spu-page__actions :deep(.inline-flex) {
    margin-right: 0;
  }

  @media (width <= 768px) {
    .spu-page__actions {
      gap: 6px;
    }
  }
</style>
