<template>
  <div class="marketing-flash-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedSessionIds.length"
      @refresh="refreshData"
    >
      <template #pageActions>
        <ElButton type="primary" @click="openSessionDialog()" v-ripple>新建场次</ElButton>
      </template>

      <template #search>
        <FlashSessionSearch v-model="searchForm" @search="handleSearch" />
      </template>

      <template #selectionText="{ count }">已选{{ count }}个场次</template>

      <template #selectionActions>
        <ElButton :disabled="batchLoading" @click="handleBatchStatus(1)" v-ripple>启用</ElButton>
        <ElButton :disabled="batchLoading" @click="handleBatchStatus(0)" v-ripple>禁用</ElButton>
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
          row-key="id"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>

    <FlashSessionDialog
      v-model="sessionDialogVisible"
      :session="currentSession"
      :submitting="sessionSubmitting"
      @submit="handleSessionSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import {
    createFlashSession,
    deleteFlashSession,
    fetchFlashSessionPage,
    updateFlashSession,
    updateFlashSessionStatusBatch,
    type FlashSessionItem,
    type FlashSessionQueryParams,
    type FlashSessionSavePayload,
    type FlashSessionStatus
  } from '@/api/flash'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import FlashSessionDialog from './modules/flash-session-dialog.vue'
  import FlashSessionSearch, {
    type FlashSessionSearchForm
  } from './modules/flash-session-search.vue'
  import {
    formatFlashSessionRange,
    getFlashRuntimeTagType,
    getFlashSessionRuntimeText
  } from './modules/flash-utils'

  defineOptions({ name: 'MarketingFlashPage' })

  const router = useRouter()
  const tableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const selectedSessionIds = ref<number[]>([])
  const switchingSessionIds = ref<number[]>([])
  const batchLoading = ref(false)

  const sessionDialogVisible = ref(false)
  const currentSession = ref<FlashSessionItem | null>(null)
  const sessionSubmitting = ref(false)

  const searchForm = ref<FlashSessionSearchForm>({
    name: undefined,
    sessionStatus: undefined,
    timeRange: []
  })

  const createFilters = (form: FlashSessionSearchForm = searchForm.value) => {
    const [startTimeFrom, startTimeTo] = form.timeRange || []

    return {
      name: String(form.name || '').trim() || undefined,
      sessionStatus: form.sessionStatus ?? undefined,
      startTimeFrom: startTimeFrom || undefined,
      startTimeTo: startTimeTo || undefined
    } satisfies Partial<FlashSessionQueryParams>
  }

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
    refreshData,
    refreshCreate,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchFlashSessionPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: (): ColumnOption<FlashSessionItem>[] => [
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
          label: '场次信息',
          minWidth: 220,
          formatter: (row) => renderSessionInfo(row)
        },
        {
          prop: 'timeRange',
          label: '场次时间',
          minWidth: 280,
          formatter: (row) => formatFlashSessionRange(row)
        },
        {
          prop: 'runtime',
          label: '运行状态',
          width: 110,
          formatter: (row) => renderSessionRuntime(row)
        },
        {
          prop: 'sessionStatus',
          label: '启用状态',
          width: 132,
          formatter: (row) => renderSessionStatus(row)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 136,
          fixed: 'right',
          formatter: (row) => renderSessionOperation(row)
        }
      ]
    }
  })

  const clearSelection = () => {
    selectedSessionIds.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
  }

  const isSwitching = (id: number) => switchingSessionIds.value.includes(id)

  const toggleSwitching = (id: number, loadingValue: boolean) => {
    if (loadingValue) {
      if (!switchingSessionIds.value.includes(id)) {
        switchingSessionIds.value = [...switchingSessionIds.value, id]
      }
      return
    }

    switchingSessionIds.value = switchingSessionIds.value.filter((item) => item !== id)
  }

  function renderSessionInfo(row: FlashSessionItem) {
    return h('div', { class: 'flex flex-col gap-1' }, [
      h('div', { class: 'font-medium text-g-900 truncate' }, row.name || `场次 #${row.id}`),
      h('div', { class: 'text-xs text-g-500' }, `ID：${row.id}`)
    ])
  }

  function renderSessionRuntime(row: FlashSessionItem) {
    const text = getFlashSessionRuntimeText(row)

    return h(
      ElTag,
      {
        type: getFlashRuntimeTagType(text),
        effect: 'light',
        round: true
      },
      () => text
    )
  }

  function renderSessionStatus(row: FlashSessionItem) {
    const checked = Number(row.sessionStatus ?? 0) === 1

    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        loading: isSwitching(row.id),
        disabled: isSwitching(row.id),
        inlinePrompt: false,
        beforeChange: () => handleToggleSessionStatus(row)
      }),
      h('span', checked ? '启用' : '禁用')
    ])
  }

  function renderSessionOperation(row: FlashSessionItem) {
    return h('div', { class: 'flex items-center' }, [
      h(ArtButtonTable, {
        type: 'view',
        iconClass: 'ease-table-action ease-table-action--view',
        onClick: () => openSessionConfig(row)
      }),
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => openSessionDialog(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDeleteSession(row)
      })
    ])
  }

  function shouldIgnoreRowClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null

    return !!target?.closest(
      '.el-checkbox, .el-switch, .el-button, .ease-table-action, .art-button-table'
    )
  }

  function getRowClassName() {
    return 'marketing-flash-page__table-row'
  }

  function openSessionConfig(row: FlashSessionItem) {
    router.push({
      name: 'MarketingFlashEdit',
      params: { id: row.id },
      query: {
        name: row.name || '',
        startTime: row.startTime || '',
        endTime: row.endTime || '',
        sessionStatus: String(row.sessionStatus ?? 0)
      }
    })
  }

  const handleSelectionChange = (selection: FlashSessionItem[]) => {
    selectedSessionIds.value = selection.map((item) => item.id)
  }

  const handleSearch = async (params: FlashSessionSearchForm) => {
    searchForm.value = {
      name: params.name ?? undefined,
      sessionStatus: params.sessionStatus ?? undefined,
      timeRange: params.timeRange?.length ? [...params.timeRange] : []
    }

    clearSelection()
    replaceSearchParams(createFilters(searchForm.value))
    await getData()
  }

  const handleRowClick = (row: FlashSessionItem, _column: unknown, event: MouseEvent) => {
    if (shouldIgnoreRowClick(event)) return
    openSessionConfig(row)
  }

  const handleToggleSessionStatus = async (row: FlashSessionItem) => {
    const nextStatus: FlashSessionStatus = Number(row.sessionStatus ?? 0) === 1 ? 0 : 1

    toggleSwitching(row.id, true)

    try {
      await updateFlashSessionStatusBatch([row.id], nextStatus)
      await refreshData()
      return true
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '更新场次状态失败')
      return false
    } finally {
      toggleSwitching(row.id, false)
    }
  }

  const handleBatchStatus = async (status: FlashSessionStatus) => {
    if (!selectedSessionIds.value.length || batchLoading.value) return

    batchLoading.value = true

    try {
      await updateFlashSessionStatusBatch(selectedSessionIds.value, status)
      clearSelection()
      await refreshData()
    } finally {
      batchLoading.value = false
    }
  }

  const openSessionDialog = (session?: FlashSessionItem | null) => {
    currentSession.value = session || null
    sessionDialogVisible.value = true
  }

  const handleSessionSubmit = async (payload: FlashSessionSavePayload) => {
    sessionSubmitting.value = true

    try {
      if (payload.id) {
        await updateFlashSession(payload)
        sessionDialogVisible.value = false
        await refreshUpdate()
      } else {
        await createFlashSession(payload)
        sessionDialogVisible.value = false
        await refreshCreate()
      }
    } finally {
      sessionSubmitting.value = false
    }
  }

  const handleDeleteSession = async (row: FlashSessionItem) => {
    await ElMessageBox.confirm(`确认删除场次“${row.name}”吗？`, '删除场次', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await deleteFlashSession(row.id)
    clearSelection()
    await refreshRemove()
  }

  watch(sessionDialogVisible, (visible) => {
    if (!visible) {
      currentSession.value = null
    }
  })

  onMounted(async () => {
    replaceSearchParams(createFilters())
    await getData()
  })

  onActivated(() => {
    void refreshData()
  })
</script>

<style scoped lang="scss">
  :deep(.marketing-flash-page__table-row) {
    cursor: pointer;
  }
</style>
