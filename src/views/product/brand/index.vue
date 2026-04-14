<template>
  <div class="product-brand-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedBrandIds.length"
      @refresh="refreshData"
    >
      <template #pageActions>
        <ElButton type="primary" @click="showDialog('add')" v-ripple>新增品牌</ElButton>
      </template>

      <template #search>
        <BrandSearch v-model="searchForm" @search="handleSearch" />
      </template>

      <template #selectionText="{ count }">已选{{ count }}个品牌</template>

      <template #selectionActions>
        <ElButton @click="handleBatchShowStatus(1)" v-ripple>显示</ElButton>
        <ElButton @click="handleBatchShowStatus(0)" v-ripple>隐藏</ElButton>
      </template>

      <template #table>
        <ArtTable
          ref="tableRef"
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>

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
    fetchBrandPage,
    updateShowStatus,
    type BrandFlag01,
    type BrandListItem
  } from '@/api/brand'
  import { useTable } from '@/hooks/core/useTable'
  import type { DialogType } from '@/types'
  import { formatDateTime } from '@/utils/date'
  import BrandSearch, { type BrandSearchForm } from './modules/brand-search.vue'
  import BrandDialog from './modules/brand-dialog.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { ElImage, ElSwitch } from 'element-plus'

  defineOptions({ name: 'ProductBrandPage' })

  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('add')
  const currentBrandData = ref<BrandListItem | undefined>(undefined)
  const selectedBrandIds = ref<number[]>([])
  const switchingShowStatusIds = ref<number[]>([])
  const searchForm = ref<BrandSearchForm>({
    keyword: undefined,
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

  const renderFactoryText = (row: BrandListItem) =>
    h(
      'span',
      {
        class:
          Number(row.factoryStatus ?? 0) === 1
            ? 'text-[12px] font-medium text-g-700'
            : 'text-[12px] text-g-500'
      },
      Number(row.factoryStatus ?? 0) === 1 ? '是' : '否'
    )

  const renderShowStatus = (row: BrandListItem) => {
    const checked = Number(row.showStatus ?? 0) === 1

    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        loading: isShowStatusSwitching(row.id),
        disabled: isShowStatusSwitching(row.id),
        inlinePrompt: false,
        beforeChange: () => handleToggleShowStatus(row)
      }),
      h('span', checked ? '显示' : '隐藏')
    ])
  }

  const renderBrandStats = (row: BrandListItem) =>
    h('div', { class: 'flex flex-col text-xs leading-5 text-g-600' }, [
      h('div', `商品数：${row.spuCount ?? 0}`),
      h('div', `评价数：${row.spuCommentCount ?? 0}`)
    ])

  const renderBrandOperation = (row: BrandListItem) =>
    h('div', [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => showDialog('edit', row)
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
          formatter: (row) => renderFactoryText(row)
        },
        {
          prop: 'showStatus',
          label: '显示状态',
          width: 132,
          formatter: (row) => renderShowStatus(row)
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
          width: 72,
          fixed: 'right',
          formatter: (row) => renderBrandOperation(row)
        }
      ]
    }
  })

  const handleSearch = (params: BrandSearchForm) => {
    selectedBrandIds.value = []
    replaceSearchParams(params)
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

  const isShowStatusSwitching = (id: number) => switchingShowStatusIds.value.includes(id)

  const setShowStatusSwitching = (id: number, loading: boolean) => {
    if (loading) {
      if (!switchingShowStatusIds.value.includes(id)) {
        switchingShowStatusIds.value.push(id)
      }
      return
    }

    switchingShowStatusIds.value = switchingShowStatusIds.value.filter((item) => item !== id)
  }

  const handleToggleShowStatus = async (row: BrandListItem) => {
    const nextStatus: BrandFlag01 = Number(row.showStatus ?? 0) === 1 ? 0 : 1

    setShowStatusSwitching(row.id, true)

    try {
      await updateShowStatus(row.id, nextStatus)
      await refreshData()
      return true
    } finally {
      setShowStatusSwitching(row.id, false)
    }
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
