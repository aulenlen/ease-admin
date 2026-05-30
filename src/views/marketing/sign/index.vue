<template>
  <div class="marketing-sign-page art-full-height">
    <EaseTablePage
      v-model:columns="activeColumnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="activeLoading"
      @refresh="handleRefresh"
    >
      <template #toolbarTop>
        <EaseSegmentTabs v-model="activeTab" :items="tabItems" />
      </template>

      <template #pageActions>
        <ElButton type="primary" @click="openRuleDialog()"> 新增规则 </ElButton>
      </template>

      <template #search>
        <SignRecordSearch v-model="recordSearchForm" @search="handleRecordSearch" />
      </template>

      <template #table>
        <ArtTable
          v-if="activeTab === 'rules'"
          :loading="ruleLoading"
          :data="ruleList"
          :columns="ruleColumns"
          :show-table-header="false"
          row-key="id"
        />
        <ArtTable
          v-else
          :loading="recordLoading"
          :data="recordData"
          :columns="recordColumns"
          :pagination="recordPagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          row-key="id"
          @pagination:size-change="handleRecordSizeChange"
          @pagination:current-change="handleRecordCurrentChange"
        />
      </template>
    </EaseTablePage>

    <SignRuleDialog
      v-model="ruleDialogVisible"
      :rule="currentRule"
      :submitting="ruleSubmitting"
      @submit="handleRuleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import SignRecordSearch, { type SignRecordSearchForm } from './modules/sign-record-search.vue'
  import {
    createSignRule,
    deleteSignRule,
    fetchSignRecordPage,
    fetchSignRuleList,
    updateSignRule,
    type SignEnableStatus,
    type SignRecordItem,
    type SignRecordQueryParams,
    type SignRuleItem,
    type SignRulePayload
  } from '@/api/sign'
  import { ElMessageBox, ElSwitch, ElTag } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { formatDateTime } from '@/utils'
  import { useTable, useTableColumns } from '@/hooks'
  import SignRuleDialog from './modules/sign-rule-dialog.vue'

  defineOptions({ name: 'MarketingSignPage' })

  const activeTab = ref<'rules' | 'records'>('rules')
  const showSearchBar = ref(true)

  const tabItems = [
    { label: '规则配置', value: 'rules' },
    { label: '签到记录', value: 'records' }
  ]

  const ruleList = ref<SignRuleItem[]>([])
  const ruleLoading = ref(false)
  const ruleDialogVisible = ref(false)
  const currentRule = ref<SignRuleItem | null>(null)
  const ruleSubmitting = ref(false)
  const hasLoadedRecords = ref(false)

  async function loadRules() {
    ruleLoading.value = true
    try {
      ruleList.value = await fetchSignRuleList()
    } finally {
      ruleLoading.value = false
    }
  }

  onMounted(() => {
    loadRules()
  })

  const renderEnableStatus = (row: SignRuleItem) => {
    const checked = Number(row.enableStatus ?? 0) === 1

    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        beforeChange: () => handleToggleRuleStatus(row)
      }),
      h('span', checked ? '启用' : '禁用')
    ])
  }

  const renderRuleOperation = (row: SignRuleItem) =>
    h('div', { class: 'flex items-center' }, [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => openRuleDialog(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDeleteRule(row)
      })
    ])

  const { columns: ruleColumns, columnChecks: ruleColumnChecks } = useTableColumns<SignRuleItem>(
    () => [
      { type: 'index', width: 70, label: '序号' },
      { prop: 'continuousDays', label: '连续天数', minWidth: 120 },
      { prop: 'integration', label: '奖励积分', minWidth: 120 },
      { prop: 'growth', label: '成长值', minWidth: 120 },
      { prop: 'enableStatus', label: '启用状态', minWidth: 130, formatter: renderEnableStatus },
      { prop: 'remark', label: '备注', minWidth: 220 },
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
        formatter: renderRuleOperation
      }
    ]
  )

  const recordSearchForm = ref<SignRecordSearchForm>({
    memberId: undefined,
    rewardStatus: undefined,
    dateRange: []
  })

  const rewardStatusMap = {
    0: { text: '待处理', type: 'warning' },
    1: { text: '已处理', type: 'success' },
    2: { text: '处理失败', type: 'danger' }
  } as const

  const {
    columns: recordColumns,
    columnChecks: recordColumnChecks,
    data: recordData,
    loading: recordLoading,
    pagination: recordPagination,
    getData: getRecordData,
    replaceSearchParams: replaceRecordSearchParams,
    handleSizeChange: handleRecordSizeChange,
    handleCurrentChange: handleRecordCurrentChange,
    refreshData: refreshRecordData
  } = useTable({
    core: {
      apiFn: fetchSignRecordPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: () => [
        { type: 'index', width: 70, label: '序号' },
        { prop: 'memberId', label: '会员ID', minWidth: 120 },
        { prop: 'signDate', label: '签到日期', minWidth: 130 },
        { prop: 'continuousDays', label: '连续天数', minWidth: 120 },
        { prop: 'integration', label: '积分', minWidth: 100 },
        { prop: 'growth', label: '成长值', minWidth: 100 },
        { prop: 'rewardStatus', label: '奖励状态', minWidth: 120, formatter: renderRewardStatus },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.createTime)
        }
      ]
    }
  })

  function buildRecordFilters(
    form: SignRecordSearchForm = recordSearchForm.value
  ): Partial<SignRecordQueryParams> {
    const [dateFrom, dateTo] = form.dateRange || []

    return {
      memberId: String(form.memberId || '').trim() || undefined,
      rewardStatus: form.rewardStatus ?? undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    }
  }

  async function loadRecords() {
    replaceRecordSearchParams(buildRecordFilters())
    await getRecordData()
    hasLoadedRecords.value = true
  }

  async function handleRefresh() {
    if (activeTab.value === 'rules') {
      await loadRules()
      return
    }

    if (!hasLoadedRecords.value) {
      await loadRecords()
      return
    }

    await refreshRecordData()
  }

  function openRuleDialog(row?: SignRuleItem) {
    currentRule.value = row || null
    ruleDialogVisible.value = true
  }

  async function handleRuleSubmit(payload: SignRulePayload) {
    ruleSubmitting.value = true

    try {
      if (payload.id) {
        await updateSignRule(payload.id, payload)
      } else {
        await createSignRule(payload)
      }

      ruleDialogVisible.value = false
      await loadRules()
    } finally {
      ruleSubmitting.value = false
    }
  }

  async function handleRecordSearch(params: SignRecordSearchForm) {
    recordSearchForm.value = {
      memberId: params.memberId ?? undefined,
      rewardStatus: params.rewardStatus ?? undefined,
      dateRange: params.dateRange?.length ? [...params.dateRange] : []
    }

    replaceRecordSearchParams(buildRecordFilters(recordSearchForm.value))
    await getRecordData()
    hasLoadedRecords.value = true
  }

  async function handleToggleRuleStatus(row: SignRuleItem) {
    const nextStatus: SignEnableStatus = Number(row.enableStatus ?? 0) === 1 ? 0 : 1

    try {
      await updateSignRule(row.id, {
        continuousDays: row.continuousDays,
        integration: row.integration,
        growth: row.growth,
        remark: row.remark,
        enableStatus: nextStatus
      })
      await loadRules()
      return true
    } catch {
      return false
    }
  }

  async function handleDeleteRule(row: SignRuleItem) {
    await ElMessageBox.confirm(
      `确认删除连续 ${row.continuousDays} 天签到规则吗？`,
      '删除签到规则',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    await deleteSignRule(row.id)
    await loadRules()
  }

  function renderRewardStatus(row: SignRecordItem) {
    const status = rewardStatusMap[row.rewardStatus] || { text: '未知', type: 'info' as const }

    return h(
      ElTag,
      {
        type: status.type,
        effect: 'light',
        round: true
      },
      () => status.text
    )
  }

  const activeLoading = computed(() =>
    activeTab.value === 'rules' ? ruleLoading.value : recordLoading.value
  )

  const activeColumnChecks = computed({
    get: () => (activeTab.value === 'rules' ? ruleColumnChecks.value : recordColumnChecks.value),
    set: (value) => {
      if (activeTab.value === 'rules') ruleColumnChecks.value = value
      else recordColumnChecks.value = value
    }
  })

  watch(activeTab, async (tab) => {
    if (tab === 'records' && !hasLoadedRecords.value) {
      await loadRecords()
    }
  })
</script>
