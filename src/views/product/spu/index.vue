<template>
  <EaseTablePage
    class="product-spu-page"
    v-model:columns="columnChecks"
    v-model:showSearchBar="showSearchBar"
    :loading="loading"
    :selection-count="selectedIds.length"
    @refresh="refreshAll"
  >
    <template #pageActions>
      <ElButton type="primary" @click="router.push('/product/spu/create')" v-ripple>
        创建商品
      </ElButton>
    </template>

    <template #toolbarTop>
      <EaseSegmentTabs v-model="activeTab" :items="tabItems" />
    </template>

    <template #search>
      <SpuSearch
        v-model="searchForm"
        class="product-spu-page__search"
        :brand-options="brandOptions"
        :category-options="categoryTree"
        @search="handleSearch"
      />
    </template>

    <template #selectionText="{ count }">已选{{ count }}个商品</template>

    <template #selectionActions>
      <ElButton v-if="selectionPublishAction" @click="handleSelectionPublish" v-ripple>
        {{ selectionPublishAction.label }}
      </ElButton>
    </template>

    <template #table>
      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
        :row-class-name="getRowClassName"
        :show-table-header="false"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </template>
  </EaseTablePage>
</template>

<script setup lang="ts">
  import {
    fetchSpuPage,
    fetchSpuStats,
    publishSpu,
    type SpuListItem,
    type SpuQueryParams
  } from '@/api/spu'
  import { fetchBrandPage, type BrandListItem } from '@/api/brand'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import SpuSearch, { type SpuSearchForm } from './modules/spu-search.vue'
  import { getSpuPublishAction, type SpuPublishAction } from './modules/spu-publish-action'
  import type { SpuStatusTabKey } from './modules/spu-status-tabs'
  import { ElImage, ElMessageBox, ElSwitch } from 'element-plus'

  defineOptions({ name: 'ProductSpuPage' })

  const router = useRouter()
  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const selectedIds = ref<number[]>([])
  const switchingIds = ref<number[]>([])
  const brandOptions = ref<BrandListItem[]>([])
  const categoryTree = ref<CategoryTreeItem[]>([])
  const activeTab = ref<SpuStatusTabKey>('all')
  const selectedRows = computed(() =>
    data.value.filter((item) => selectedIds.value.includes(item.id))
  )
  const selectionPublishAction = computed<SpuPublishAction | null>(() => {
    if (!selectedRows.value.length) return null

    const actions = selectedRows.value.map((item) => getSpuPublishAction(item))
    const [firstAction] = actions

    if (!firstAction || firstAction.disabled) return null

    const isSameAction = actions.every(
      (item) =>
        !item.disabled &&
        item.label === firstAction.label &&
        item.nextStatus === firstAction.nextStatus &&
        item.confirmTitle === firstAction.confirmTitle
    )

    return isSameAction ? firstAction : null
  })
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
    { value: 'all' as const, label: '全部商品', count: stats.value.all },
    { value: 'publish' as const, label: '已上架', count: stats.value.publish },
    { value: 'unpublish' as const, label: '未上架', count: stats.value.unpublish },
    { value: 'verify' as const, label: '待审核', count: stats.value.verify },
    { value: 'staged' as const, label: '已修改未发布', count: stats.value.staged }
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
          prop: 'name',
          label: '商品信息',
          minWidth: 320,
          formatter: (row) =>
            h('div', { class: 'flex items-center gap-3 min-w-0' }, [
              row.pic
                ? h(ElImage, {
                    src: row.pic,
                    fit: 'cover',
                    class: 'size-10 rounded-lg shrink-0',
                    previewSrcList: [row.pic],
                    previewTeleported: true
                  })
                : h(
                    'div',
                    {
                      class:
                        'size-10 shrink-0 rounded-lg bg-[var(--el-fill-color-light)] text-xs text-g-500 flex items-center justify-center'
                    },
                    '暂无图片'
                  ),
              h(
                'button',
                {
                  class: 'min-w-0 flex-1 cursor-pointer text-left font-medium text-g-900 truncate',
                  onClick: () => router.push(`/product/spu/detail/${row.id}`)
                },
                row.name
              )
            ])
        },
        {
          prop: 'brandName',
          label: '品牌',
          minWidth: 140,
          formatter: (row) => row.brandName || '-'
        },
        {
          prop: 'spuCode',
          label: 'SPU 编码',
          minWidth: 180,
          formatter: (row) => row.spuCode || '-'
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
          width: 132,
          formatter: (row) => {
            const publishAction = getSpuPublishAction(row)
            const checked = Number(row.publishStatus ?? 0) === 1
            const text = publishAction.disabled ? '待审核' : publishAction.label

            return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
              h(ElSwitch, {
                modelValue: checked,
                loading: isSwitching(row.id),
                disabled: publishAction.disabled || isSwitching(row.id),
                inlinePrompt: false,
                beforeChange: () => handleSinglePublish(row)
              }),
              h('span', text)
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
          width: 112,
          fixed: 'right',
          formatter: (row) =>
            h('div', { class: 'flex items-center gap-2 max-md:gap-1.5' }, [
              h(ArtButtonTable, {
                type: 'view',
                iconClass: 'ease-table-action ease-table-action--view',
                onClick: () => router.push(`/product/spu/detail/${row.id}`)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                iconClass: 'ease-table-action ease-table-action--edit',
                onClick: () => router.push(`/product/spu/edit/${row.id}`)
              })
            ])
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
    selectedIds.value = []
    await Promise.all([refreshData(), loadStats()])
  }

  const handleSearch = async () => {
    selectedIds.value = []
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  }

  const handleSelectionChange = (selection: SpuListItem[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  const isSwitching = (id: number) => switchingIds.value.includes(id)

  const setSwitching = (id: number, loading: boolean) => {
    if (loading) {
      if (!switchingIds.value.includes(id)) switchingIds.value.push(id)
      return
    }

    switchingIds.value = switchingIds.value.filter((item) => item !== id)
  }

  const getRowClassName = ({ row }: { row: SpuListItem }) => {
    return selectedIds.value.includes(row.id) ? 'product-spu-page__table-row--selected' : ''
  }

  const handleBatchPublish = async (action: SpuPublishAction) => {
    const invalidRows = selectedRows.value.filter((item) => getSpuPublishAction(item).disabled)

    if (invalidRows.length) {
      ElMessageBox.alert('当前选中商品中包含待审核数据，待审核商品不允许执行该操作。', '操作提示', {
        customClass: 'product-spu-page__message-box',
        confirmButtonText: '知道了',
        type: 'warning'
      })
      return
    }

    await ElMessageBox.confirm(
      `确定${action.label}已选中的 ${selectedIds.value.length} 个商品吗？`,
      `${action.label}确认`,
      {
        customClass: 'product-spu-page__message-box',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await publishSpu(selectedIds.value, action.nextStatus)
    await refreshAll()
  }

  const handleSelectionPublish = async () => {
    if (!selectionPublishAction.value) return
    await handleBatchPublish(selectionPublishAction.value)
  }

  const handleSinglePublish = async (row: SpuListItem) => {
    const action = getSpuPublishAction(row)

    try {
      await ElMessageBox.confirm(
        `${action.confirmTitle.replace('该商品', `商品“${row.name}”`)}`,
        action.label === '发布更新' ? '发布更新确认' : `${action.label}确认`,
        {
          customClass: 'product-spu-page__message-box',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return false
    }

    setSwitching(row.id, true)

    try {
      await publishSpu([row.id], action.nextStatus)
      await refreshAll()
      return true
    } finally {
      setSwitching(row.id, false)
    }
  }

  watch(activeTab, async () => {
    selectedIds.value = []
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  })

  onMounted(async () => {
    await loadBaseOptions()
    replaceSearchParams(buildSearchQuery())
    await Promise.all([getData(), loadStats()])
  })

  onActivated(refreshAll)
</script>
