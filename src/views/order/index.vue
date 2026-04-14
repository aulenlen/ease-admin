<template>
  <div class="order-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedOrderNos.length"
      @refresh="refreshAll"
    >
      <template #toolbarTop>
        <EaseSegmentTabs v-model="activeTab" :items="tabItems" />
      </template>

      <template #search>
        <OrderSearch v-model="searchForm" @search="handleSearch" />
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
          row-key="orderNo"
          highlight-current-row
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>

    <OrderDeliverDialog
      v-model="deliverVisible"
      :order-no="deliverOrderNo"
      :submitting="deliverSubmitting"
      @submit="handleDeliverSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchOrderPage,
    fetchOrderStatusDistributionStats,
    forceCancelOrder,
    shipOrder,
    type OrderListItem,
    type OrderQueryParams,
    type OrderShipPayload
  } from '@/api/order'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import { ElMessageBox, ElTag } from 'element-plus'
  import OrderDeliverDialog from './modules/order-deliver-dialog.vue'
  import OrderSearch, { type OrderSearchForm } from './modules/order-search.vue'
  import {
    TAB_TO_STATUS,
    canForceCancelOrder,
    formatMoney,
    getOrderStatusText,
    getOrderTagType,
    getPaymentStatusText,
    getPaymentTagType,
    getShipmentStatusText,
    getShipmentTagType,
    isOrderReadyToShip,
    type OrderTabKey
  } from './modules/order-status'

  defineOptions({ name: 'OrderPage' })

  const router = useRouter()
  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const selectedOrderNos = ref<string[]>([])
  const activeTab = ref<OrderTabKey>('all')
  const deliverVisible = ref(false)
  const deliverSubmitting = ref(false)
  const deliverOrderNo = ref<string | null>(null)
  const queryVersion = ref(0)
  const activeQueryKey = ref('')
  const lastCompletedQueryKey = ref('')
  const hasInitializedQuery = ref(false)
  const tabStats = ref<Record<OrderTabKey, number>>({
    all: 0,
    pendingPay: 0,
    paid: 0,
    pendingShip: 0,
    pendingReceive: 0,
    finished: 0,
    canceled: 0
  })

  const createDefaultSearchForm = (): OrderSearchForm => ({
    orderNo: undefined,
    receiverPhone: undefined,
    paymentStatus: undefined,
    payChannel: undefined,
    payAmountMin: undefined,
    payAmountMax: undefined,
    createTimeRange: []
  })

  const searchForm = ref<OrderSearchForm>(createDefaultSearchForm())

  const tabItems = computed<{ value: OrderTabKey; label: string; count: number }[]>(() => [
    { value: 'all', label: '全部订单', count: tabStats.value.all },
    { value: 'pendingPay', label: '待支付', count: tabStats.value.pendingPay },
    { value: 'paid', label: '已支付', count: tabStats.value.paid },
    { value: 'pendingShip', label: '待发货', count: tabStats.value.pendingShip },
    { value: 'pendingReceive', label: '待收货', count: tabStats.value.pendingReceive },
    { value: 'finished', label: '已完成', count: tabStats.value.finished },
    { value: 'canceled', label: '已取消', count: tabStats.value.canceled }
  ])

  const buildBaseFilters = () => {
    const [createTimeStart, createTimeEnd] = searchForm.value.createTimeRange || []

    return {
      orderNo: searchForm.value.orderNo?.trim() || undefined,
      receiverPhone: searchForm.value.receiverPhone?.trim() || undefined,
      paymentStatus: searchForm.value.paymentStatus,
      payChannel: searchForm.value.payChannel,
      payAmountMin: searchForm.value.payAmountMin,
      payAmountMax: searchForm.value.payAmountMax,
      createTimeStart: createTimeStart || undefined,
      createTimeEnd: createTimeEnd || undefined
    }
  }

  const buildTableFilters = (): Partial<OrderQueryParams> => ({
    ...buildBaseFilters(),
    status: TAB_TO_STATUS[activeTab.value] ?? undefined
  })

  const createQueryKey = (filters: Partial<OrderQueryParams>) => JSON.stringify(filters)

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
      apiFn: fetchOrderPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: () => [
        {
          type: 'selection',
          width: 56
        },
        {
          prop: 'orderNo',
          label: '订单',
          minWidth: 230,
          fixed: 'left',
          formatter: (row) =>
            h('div', { class: 'flex flex-col gap-1' }, [
              h(
                'button',
                {
                  class: 'cursor-pointer text-left font-medium text-g-900',
                  onClick: () => openDetail(row)
                },
                row.orderNo
              ),
              h(
                'span',
                { class: 'text-xs text-g-500' },
                `${(row.items || []).length} 件商品 · 用户 ID ${row.userId || '-'}`
              )
            ])
        },
        {
          prop: 'receiverName',
          label: '客户',
          minWidth: 180,
          formatter: (row) =>
            h('div', { class: 'flex flex-col gap-1' }, [
              h('span', { class: 'font-medium text-g-900' }, row.receiverName || '-'),
              h('span', { class: 'text-xs text-g-500' }, row.receiverPhone || '-')
            ])
        },
        {
          prop: 'payment',
          label: '付款状态',
          width: 120,
          formatter: (row) =>
            h(
              ElTag,
              {
                type: getPaymentTagType(row),
                effect: 'light',
                round: true
              },
              () => getPaymentStatusText(row)
            )
        },
        {
          prop: 'shipment',
          label: '履约状态',
          width: 120,
          formatter: (row) =>
            h(
              ElTag,
              {
                type: getShipmentTagType(row),
                effect: 'light',
                round: true
              },
              () => getShipmentStatusText(row)
            )
        },
        {
          prop: 'payAmount',
          label: '金额',
          width: 150,
          formatter: (row) =>
            h('div', { class: 'flex w-full flex-col items-start gap-1 text-left' }, [
              h('span', { class: 'font-medium text-g-900' }, formatMoney(row.payAmount)),
              h('span', { class: 'text-xs text-g-500' }, `运费 ${formatMoney(row.freightAmount)}`)
            ])
        },
        {
          prop: 'createTime',
          label: '下单时间',
          minWidth: 170,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'status',
          label: '订单状态',
          width: 120,
          formatter: (row) =>
            h(
              ElTag,
              {
                type: getOrderTagType(row.status),
                effect: 'light',
                round: true
              },
              () => getOrderStatusText(row.status, row.statusDesc)
            )
        },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          disabled: true,
          formatter: (row) => {
            const actions: ButtonMoreItem[] = [
              {
                key: 'ship',
                label: '发货',
                icon: 'ri:truck-line',
                disabled: !isOrderReadyToShip(row.status, row.statusDesc)
              },
              {
                key: 'cancel',
                label: '强制取消',
                icon: 'ri:close-circle-line',
                color: 'var(--el-color-danger)',
                disabled: !canForceCancelOrder(row.status)
              }
            ]

            return h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                iconClass: 'ease-table-action ease-table-action--view',
                onClick: () => openDetail(row)
              }),
              h(ArtButtonMore, {
                list: actions,
                onClick: (item: ButtonMoreItem) => handleMoreAction(item, row)
              })
            ])
          }
        }
      ]
    }
  })

  const loadTabTotals = async (): Promise<Record<OrderTabKey, number>> => {
    const distribution = await fetchOrderStatusDistributionStats(buildBaseFilters())
    const statusCountMap = new Map(
      distribution.map((item) => [Number(item.status), Number(item.count)])
    )
    const total = distribution.reduce((sum, item) => sum + Number(item.count || 0), 0)

    return {
      all: total,
      pendingPay: statusCountMap.get(5) || 0,
      paid: statusCountMap.get(6) || 0,
      pendingShip: statusCountMap.get(1) || 0,
      pendingReceive: statusCountMap.get(2) || 0,
      finished: statusCountMap.get(3) || 0,
      canceled: statusCountMap.get(4) || 0
    }
  }

  const runOrderQuery = async (options?: { force?: boolean; refresh?: boolean }) => {
    const filters = buildTableFilters()
    const queryKey = createQueryKey(filters)

    if (!options?.force) {
      if (activeQueryKey.value === queryKey) return
      if (hasInitializedQuery.value && lastCompletedQueryKey.value === queryKey) return
    }

    const version = ++queryVersion.value
    activeQueryKey.value = queryKey
    replaceSearchParams(filters)

    try {
      const [stats] = await Promise.all([
        loadTabTotals(),
        options?.refresh ? refreshData() : getData()
      ])

      if (version !== queryVersion.value) return

      tabStats.value = stats
      lastCompletedQueryKey.value = queryKey
      hasInitializedQuery.value = true
    } finally {
      if (activeQueryKey.value === queryKey) {
        activeQueryKey.value = ''
      }
    }
  }

  const handleSelectionChange = (selection: OrderListItem[]) => {
    selectedOrderNos.value = selection.map((item) => item.orderNo)
  }

  const refreshAll = async () => {
    selectedOrderNos.value = []
    await runOrderQuery({ force: true, refresh: true })
  }

  const openDetail = (row: Pick<OrderListItem, 'orderNo'>) => {
    router.push({
      name: 'OrderDetail',
      params: { orderNo: row.orderNo }
    })
  }

  const openDeliverDialog = (row: Pick<OrderListItem, 'orderNo'>) => {
    deliverOrderNo.value = row.orderNo
    deliverVisible.value = true
  }

  const handleCancel = async (row: Pick<OrderListItem, 'orderNo'>) => {
    await ElMessageBox.confirm(`确认强制取消订单 ${row.orderNo} 吗？`, '强制取消', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await forceCancelOrder(row.orderNo)
    await refreshAll()
  }

  const handleMoreAction = async (item: ButtonMoreItem, row: OrderListItem) => {
    if (item.key === 'ship') {
      if (!isOrderReadyToShip(row.status, row.statusDesc)) return
      openDeliverDialog(row)
      return
    }

    if (item.key === 'cancel') {
      if (!canForceCancelOrder(row.status)) return
      await handleCancel(row)
    }
  }

  const handleSearch = async (params: OrderSearchForm) => {
    selectedOrderNos.value = []
    searchForm.value = {
      ...createDefaultSearchForm(),
      ...params
    }
    await runOrderQuery()
  }

  const handleDeliverSubmit = async (payload: Omit<OrderShipPayload, 'orderNo'>) => {
    const orderNo = deliverOrderNo.value
    if (!orderNo) return

    deliverSubmitting.value = true
    try {
      await shipOrder({
        orderNo,
        logisticsCompany: payload.logisticsCompany,
        logisticsCode: payload.logisticsCode,
        logisticsNo: payload.logisticsNo
      })
      deliverVisible.value = false
      await refreshAll()
    } finally {
      deliverSubmitting.value = false
    }
  }

  watch(activeTab, () => {
    selectedOrderNos.value = []
    void runOrderQuery()
  })

  watch(deliverVisible, (visible) => {
    if (!visible) {
      deliverOrderNo.value = null
    }
  })

  onMounted(() => {
    void runOrderQuery({ force: true })
  })
</script>
