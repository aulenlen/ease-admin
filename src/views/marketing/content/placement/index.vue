<template>
  <div class="marketing-placement-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedIds.length"
      @refresh="refreshData"
    >
      <template #search>
        <PlacementSearch v-model="searchForm" @search="handleSearch" />
      </template>

      <template #selectionText="{ count }">已选{{ count }}个内容位</template>

      <template #selectionActions>
        <ElButton @click="handleBatchStatus(SLOT_STATUS.ENABLED)" v-ripple>启用</ElButton>
        <ElButton @click="handleBatchStatus(SLOT_STATUS.DISABLED)" v-ripple>禁用</ElButton>
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
          @row-click="handleRowClick"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchSlotPage,
    updateSlotStatus,
    getSlotRenderTypeLabel,
    SLOT_STATUS,
    type SlotListItem
  } from '@/api/slot'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import PlacementSearch, { type PlacementSearchForm } from './modules/placement-search.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { ElMessageBox, ElSwitch } from 'element-plus'

  defineOptions({ name: 'MarketingPlacementPage' })

  const router = useRouter()

  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const selectedIds = ref<number[]>([])
  const switchingStatusIds = ref<number[]>([])
  const searchForm = ref<PlacementSearchForm>({
    keyword: '',
    pageCode: '',
    renderType: '',
    status: undefined
  })

  const renderPlacementInfo = (row: SlotListItem) =>
    h('div', { class: 'flex flex-col gap-1' }, [
      h('div', { class: 'font-medium text-g-900 truncate' }, row.name || '未命名内容位'),
      h('div', { class: 'text-xs text-g-500' }, row.code || '—')
    ])

  const renderScene = (row: SlotListItem) =>
    h('div', { class: 'flex flex-col gap-1 text-xs text-g-700' }, [
      h('div', row.pageCode || '未设置页面'),
      h('div', { class: 'text-g-500' }, getSlotRenderTypeLabel(row.renderType) || '未设置渲染')
    ])

  const isStatusSwitching = (id: number) => switchingStatusIds.value.includes(id)

  const renderStatus = (row: SlotListItem) => {
    const checked = Number(row.status ?? 0) === SLOT_STATUS.ENABLED
    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        loading: isStatusSwitching(row.id),
        disabled: isStatusSwitching(row.id),
        inlinePrompt: false,
        beforeChange: () => handleToggleStatus(row)
      }),
      h('span', checked ? '启用' : '禁用')
    ])
  }

  const renderOperation = (row: SlotListItem) =>
    h('div', { class: 'flex items-center gap-1' }, [
      h(ArtButtonTable, {
        icon: 'ri:settings-3-line',
        iconClass: 'ease-table-action ease-table-action--edit',
        title: '配置',
        onClick: () => handleEdit(row)
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
      apiFn: fetchSlotPage,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection', width: 56 },
        {
          prop: 'name',
          label: '内容位',
          minWidth: 220,
          formatter: (row) => renderPlacementInfo(row)
        },
        {
          prop: 'pageCode',
          label: '投放场景',
          minWidth: 180,
          formatter: (row) => renderScene(row)
        },
        {
          prop: 'note',
          label: '业务说明',
          minWidth: 220,
          formatter: (row) => row.note || '—'
        },
        {
          prop: 'status',
          label: '状态',
          width: 120,
          formatter: (row) => renderStatus(row)
        },
        {
          prop: 'updateTime',
          label: '更新时间',
          width: 180,
          formatter: (row) => formatDateTime(row.updateTime) || '-'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row) => renderOperation(row)
        }
      ]
    }
  })

  const handleSearch = (params: PlacementSearchForm) => {
    selectedIds.value = []
    replaceSearchParams(params)
    getData()
  }

  const handleSelectionChange = (selection: SlotListItem[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  const handleEdit = (row: SlotListItem) => {
    router.push({ name: 'MarketingPlacementEdit', params: { id: row.id } })
  }

  const shouldIgnoreRowClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    return !!target?.closest(
      '.el-checkbox, .el-switch, .el-button, .ease-table-action, .art-button-table'
    )
  }

  const getRowClassName = () => 'marketing-placement-page__table-row'

  const handleRowClick = (row: SlotListItem, _column: unknown, event: MouseEvent) => {
    if (shouldIgnoreRowClick(event)) return
    handleEdit(row)
  }

  const handleToggleStatus = async (row: SlotListItem) => {
    const nextStatus =
      Number(row.status ?? SLOT_STATUS.DISABLED) === SLOT_STATUS.ENABLED
        ? SLOT_STATUS.DISABLED
        : SLOT_STATUS.ENABLED

    switchingStatusIds.value.push(row.id)
    try {
      await updateSlotStatus([row.id], nextStatus)
      await refreshData()
      return true
    } finally {
      switchingStatusIds.value = switchingStatusIds.value.filter((id) => id !== row.id)
    }
  }

  const handleBatchStatus = async (status: number) => {
    if (!selectedIds.value.length) return

    const label = status === SLOT_STATUS.ENABLED ? '启用' : '禁用'
    try {
      await ElMessageBox.confirm(
        `确定要${label}选中的 ${selectedIds.value.length} 个内容位吗？`,
        '提示',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
      )
      await updateSlotStatus(selectedIds.value, status)
      selectedIds.value = []
      refreshData()
    } catch {
      // ignore
    }
  }
</script>

<style scoped lang="scss">
  :deep(.marketing-placement-page__table-row) {
    cursor: pointer;
  }
</style>
