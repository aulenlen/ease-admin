<template>
  <div class="art-full-height">
    <BrandSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="handleResetSearch"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增品牌</ElButton>
            <ElButton
              :disabled="!selectedBrandIds.length"
              @click="handleBatchShowStatus(1)"
              v-ripple
            >
              批量显示
            </ElButton>
            <ElButton
              :disabled="!selectedBrandIds.length"
              @click="handleBatchShowStatus(0)"
              v-ripple
            >
              批量隐藏
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <BrandDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :brand-data="currentBrandData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    deleteBrand,
    fetchBrandPage,
    updateFactoryStatus,
    updateShowStatus,
    type BrandFlag01,
    type BrandListItem,
    type BrandQueryParams
  } from '@/api/brand'
  import { useTable } from '@/hooks/core/useTable'
  import type { DialogType } from '@/types'
  import { formatDateTime } from '@/utils/date'
  import BrandSearch from './modules/brand-search.vue'
  import BrandDialog from './modules/brand-dialog.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { ElImage, ElMessageBox, ElTag } from 'element-plus'

  defineOptions({ name: 'ProductBrandPage' })

  type BrandSearchForm = Partial<
    Pick<BrandQueryParams, 'keyword' | 'firstLetter' | 'showStatus' | 'factoryStatus'>
  >

  const showSearchBar = ref(true)
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('add')
  const currentBrandData = ref<BrandListItem | undefined>(undefined)
  const selectedBrandIds = ref<number[]>([])
  const searchForm = ref<BrandSearchForm>({
    keyword: undefined,
    firstLetter: undefined,
    showStatus: undefined,
    factoryStatus: undefined
  })

  const renderBrandLogo = (row: BrandListItem) =>
    row.logo
      ? h(ElImage, {
          src: row.logo,
          fit: 'cover',
          class: 'size-10 rounded-lg',
          previewSrcList: [row.logo],
          previewTeleported: true
        })
      : h('div', { class: 'text-xs text-g-500' }, '暂无图片')

  const renderBrandInfo = (row: BrandListItem) =>
    h('div', { class: 'flex flex-col gap-1' }, [
      h('div', { class: 'font-medium text-g-900' }, row.name),
      h('div', { class: 'text-xs text-g-500' }, `首字母：${row.firstLetter || '-'}`)
    ])

  const renderBooleanTag = (
    active: boolean,
    activeText: string,
    inactiveText: string,
    onClick: () => void,
    inactiveType: 'info' | 'warning'
  ) =>
    h(
      ElTag,
      {
        type: active ? 'success' : inactiveType,
        class: 'cursor-pointer',
        onClick
      },
      () => (active ? activeText : inactiveText)
    )

  const renderBrandStats = (row: BrandListItem) =>
    h('div', { class: 'flex flex-col text-xs leading-5 text-g-600' }, [
      h('div', `商品数：${row.spuCount ?? 0}`),
      h('div', `评价数：${row.spuCommentCount ?? 0}`)
    ])

  const renderBrandOperation = (row: BrandListItem) =>
    h('div', [
      h(ArtButtonTable, {
        type: 'edit',
        onClick: () => showDialog('edit', row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        onClick: () => handleDelete(row)
      })
    ])

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
      apiFn: fetchBrandPage,
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
          width: 70,
          label: '序号'
        },
        {
          prop: 'logo',
          label: '品牌 Logo',
          width: 120,
          formatter: (row) => renderBrandLogo(row)
        },
        {
          prop: 'name',
          label: '品牌信息',
          minWidth: 220,
          formatter: (row) => renderBrandInfo(row)
        },
        {
          prop: 'sort',
          label: '排序',
          width: 100,
          sortable: true
        },
        {
          prop: 'factoryStatus',
          label: '制造商',
          width: 110,
          formatter: (row) =>
            renderBooleanTag(
              Number(row.factoryStatus ?? 0) === 1,
              '是',
              '否',
              () => handleToggleFactoryStatus(row),
              'info'
            )
        },
        {
          prop: 'showStatus',
          label: '显示状态',
          width: 110,
          formatter: (row) =>
            renderBooleanTag(
              Number(row.showStatus ?? 0) === 1,
              '显示',
              '隐藏',
              () => handleToggleShowStatus(row),
              'warning'
            )
        },
        {
          prop: 'stats',
          label: '数据统计',
          minWidth: 160,
          formatter: (row) => renderBrandStats(row)
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          sortable: true,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row) => renderBrandOperation(row)
        }
      ]
    }
  })

  const handleSearch = (params: BrandSearchForm) => {
    replaceSearchParams(params)
    getData()
  }

  const handleResetSearch = () => {
    resetSearchParams()
    getData()
  }

  const showDialog = (type: DialogType, row?: BrandListItem) => {
    dialogType.value = type
    currentBrandData.value = row
    dialogVisible.value = true
  }

  const handleSelectionChange = (selection: BrandListItem[]) => {
    selectedBrandIds.value = selection.map((item) => item.id)
  }

  const handleDelete = async (row: BrandListItem) => {
    await ElMessageBox.confirm(`确定删除品牌“${row.name}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteBrand(row.id)
    refreshData()
  }

  const handleToggleShowStatus = async (row: BrandListItem) => {
    const nextStatus: BrandFlag01 = Number(row.showStatus ?? 0) === 1 ? 0 : 1
    await updateShowStatus(row.id, nextStatus)
    refreshData()
  }

  const handleToggleFactoryStatus = async (row: BrandListItem) => {
    const nextStatus: BrandFlag01 = Number(row.factoryStatus ?? 0) === 1 ? 0 : 1
    await updateFactoryStatus(row.id, nextStatus)
    refreshData()
  }

  const handleBatchShowStatus = async (showStatus: BrandFlag01) => {
    if (!selectedBrandIds.value.length) {
      return
    }

    await updateShowStatus(selectedBrandIds.value, showStatus)
    selectedBrandIds.value = []
    refreshData()
  }
</script>
