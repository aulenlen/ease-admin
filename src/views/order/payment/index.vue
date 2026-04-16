<template>
  <div class="payment-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      @refresh="refreshData"
    >
      <template #search>
        <PaymentSearch v-model="searchForm" @search="handleSearch" />
      </template>

      <template #table>
        <ArtTable
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          row-key="paymentNo"
          highlight-current-row
          @row-click="handleRowClick"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>

    <PaymentDetailDrawer
      v-model="detailVisible"
      :loading="detailLoading"
      :detail="detail"
      @open-order="openRelatedOrder"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElTag } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchPaymentDetail,
    fetchPaymentPage,
    type PaymentDetailItem,
    type PaymentListItem,
    type PaymentQueryParams
  } from '@/api/payment'
  import { formatDateTime } from '@/utils/date'
  import PaymentDetailDrawer from './modules/payment-detail-drawer.vue'
  import PaymentSearch, { type PaymentSearchForm } from './modules/payment-search.vue'
  import {
    formatMoney,
    getPayChannelText,
    getPaymentStatusText,
    getPaymentTagType
  } from './modules/payment-status'

  defineOptions({ name: 'OrderPaymentPage' })

  const router = useRouter()
  const showSearchBar = ref(true)
  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<PaymentDetailItem | null>(null)

  const createDefaultSearchForm = (): PaymentSearchForm => ({
    paymentNo: undefined,
    orderNo: undefined,
    payChannel: undefined,
    status: undefined,
    createTimeRange: []
  })

  const searchForm = ref<PaymentSearchForm>(createDefaultSearchForm())

  const openRelatedOrder = (orderNo?: string) => {
    if (!orderNo) return

    router.push({
      name: 'OrderDetail',
      params: {
        orderNo
      }
    })
  }

  const openDetail = async (row: PaymentListItem) => {
    if (!row.paymentNo) return

    detailVisible.value = true
    detailLoading.value = true
    detail.value = row

    try {
      detail.value = await fetchPaymentDetail(row.paymentNo)
    } catch (error: any) {
      ElMessage.error(error?.message || '获取支付单详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  const renderPaymentInfo = (row: PaymentListItem) =>
    h('div', { class: 'flex flex-col gap-1' }, [
      h(
        'button',
        {
          class: 'cursor-pointer text-left font-medium text-g-900',
          onClick: (event: Event) => {
            event.stopPropagation()
            openDetail(row)
          }
        },
        row.paymentNo || '-'
      ),
      h(
        'button',
        {
          class: 'cursor-pointer text-left text-xs text-g-500',
          onClick: (event: Event) => {
            event.stopPropagation()
            openRelatedOrder(row.orderNo)
          }
        },
        `订单：${row.orderNo || '-'}`
      )
    ])

  const renderAmount = (row: PaymentListItem) =>
    h('span', { class: 'font-medium text-g-900' }, formatMoney(row.payAmount))

  const renderChannel = (row: PaymentListItem) =>
    h('span', { class: 'text-[13px] text-g-700' }, getPayChannelText(row.payChannel))

  const renderStatus = (row: PaymentListItem) =>
    h(
      ElTag,
      {
        type: getPaymentTagType(row.status),
        effect: 'light',
        round: true
      },
      () => getPaymentStatusText(row.status)
    )

  const renderAction = (row: PaymentListItem) =>
    h(
      'div',
      {
        onClick: (event: Event) => event.stopPropagation()
      },
      [
        h(ArtButtonTable, {
          type: 'view',
          iconClass: 'ease-table-action ease-table-action--view',
          onClick: () => openDetail(row)
        })
      ]
    )

  const buildFilters = (): Partial<PaymentQueryParams> => {
    const [createTimeStart, createTimeEnd] = searchForm.value.createTimeRange || []

    return {
      paymentNo: searchForm.value.paymentNo?.trim() || undefined,
      orderNo: searchForm.value.orderNo?.trim() || undefined,
      payChannel: searchForm.value.payChannel,
      status: searchForm.value.status,
      createTimeStart: createTimeStart || undefined,
      createTimeEnd: createTimeEnd || undefined
    }
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
    refreshData
  } = useTable({
    core: {
      apiFn: fetchPaymentPage,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          type: 'index',
          width: 70,
          label: '序号'
        },
        {
          prop: 'paymentNo',
          label: '支付单信息',
          minWidth: 250,
          formatter: (row) => renderPaymentInfo(row)
        },
        {
          prop: 'payAmount',
          label: '支付金额',
          width: 130,
          formatter: (row) => renderAmount(row)
        },
        {
          prop: 'payChannel',
          label: '支付渠道',
          width: 120,
          formatter: (row) => renderChannel(row)
        },
        {
          prop: 'status',
          label: '支付状态',
          width: 120,
          formatter: (row) => renderStatus(row)
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'expireTime',
          label: '过期时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.expireTime)
        },
        {
          prop: 'paidTime',
          label: '支付时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.paidTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 72,
          fixed: 'right',
          formatter: (row) => renderAction(row)
        }
      ]
    }
  })

  const handleSearch = (params: PaymentSearchForm) => {
    searchForm.value = {
      ...params,
      createTimeRange: params.createTimeRange?.length ? [...params.createTimeRange] : []
    }
    replaceSearchParams(buildFilters())
    getData()
  }

  const handleRowClick = (row: PaymentListItem) => {
    openDetail(row)
  }

  watch(detailVisible, (visible) => {
    if (!visible) {
      detail.value = null
      detailLoading.value = false
    }
  })
</script>
