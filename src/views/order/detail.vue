<template>
  <div class="art-full-height flex flex-col gap-4" v-loading="pageLoading">
    <div>
      <ElButton @click="router.push('/order')">返回订单列表</ElButton>
    </div>

    <ElEmpty v-if="!pageLoading && !detail" description="未找到订单" />

    <template v-else-if="detail">
      <ElCard class="art-card-xs" shadow="never">
        <div class="flex items-start justify-between gap-4 max-lg:flex-col">
          <div class="min-w-0 flex-1">
            <div
              class="flex min-w-0 items-center gap-3 text-xl font-semibold text-[var(--el-text-color-primary)]"
            >
              <span class="truncate">订单详情</span>
              <ElTag :type="statusTagType" effect="light" round>
                {{ getOrderStatusText(detail.status, detail.statusDesc) }}
              </ElTag>
            </div>
            <div
              class="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--el-text-color-secondary)]"
            >
              <span class="font-mono">{{ detail.orderNo }}</span>
              <span>用户 ID：{{ detail.userId }}</span>
              <span>下单：{{ formatDateTime(detail.createTime) || '-' }}</span>
              <span>更新：{{ formatDateTime(detail.updateTime) || '-' }}</span>
            </div>
          </div>

          <div class="text-left max-lg:w-full lg:min-w-[160px] lg:text-right">
            <div class="text-xs text-[var(--el-text-color-secondary)]">应付金额</div>
            <div class="mt-2 text-2xl font-semibold text-[var(--el-text-color-primary)]">
              {{ formatMoney(detail.payAmount) }}
            </div>
          </div>
        </div>

        <ElDescriptions :column="4" border class="mt-4">
          <ElDescriptionsItem label="付款状态">{{ paymentStatusText }}</ElDescriptionsItem>
          <ElDescriptionsItem label="支付渠道">{{ paymentChannelText }}</ElDescriptionsItem>
          <ElDescriptionsItem label="物流状态">{{ shipmentStatusText }}</ElDescriptionsItem>
          <ElDescriptionsItem label="商品数">{{ detail.items?.length || 0 }} 件</ElDescriptionsItem>
          <ElDescriptionsItem label="商品小计">{{
            formatMoney(detail.totalAmount)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="运费">{{
            formatMoney(detail.freightAmount)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="优惠金额">
            -{{ formatMoney(detail.discountAmount) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="支付单号">
            {{ detail.payment?.paymentNo || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mt-4 flex flex-wrap gap-3">
          <ElButton v-if="canAdjustAmount" type="primary" @click="openAmountDialog">
            调整金额
          </ElButton>
          <ElButton v-if="canEditAddress" @click="openAddressDialog">修改地址</ElButton>
          <ElButton v-if="canShip" @click="deliverVisible = true">发货</ElButton>
          <ElButton @click="refreshShipment">刷新物流</ElButton>
          <ElButton v-if="canForceCancel" type="danger" plain @click="handleForceCancel">
            强制取消
          </ElButton>
        </div>
      </ElCard>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div class="space-y-4">
          <ElCard shadow="never" class="art-card-xs">
            <template #header>商品明细</template>
            <ArtTable :data="detail.items || []" :columns="itemColumns" empty-text="暂无商品" />
          </ElCard>

          <ElCard shadow="never" class="art-card-xs">
            <template #header>物流与收货</template>

            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="物流方式">
                {{ detail.shipment?.logisticsCompany || '暂未配置物流公司' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="物流状态">{{ shipmentStatusText }}</ElDescriptionsItem>
              <ElDescriptionsItem label="运单号">
                {{ detail.shipment?.logisticsNo || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="发货时间">
                {{ detail.shipment?.shipTime ? formatDateTime(detail.shipment.shipTime) : '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="收货地址">
                {{ fullAddress || '暂无收货地址' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="收货人">{{
                detail.receiverName || '-'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="手机号">
                {{ detail.receiverPhone || '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <ElCard shadow="never" class="art-card-xs">
            <template #header>操作时间线</template>
            <ElTimeline v-if="operationLogs.length">
              <ElTimelineItem
                v-for="log in operationLogs"
                :key="log.id"
                :timestamp="formatDateTime(log.createTime)"
                placement="top"
              >
                <div class="grid gap-1">
                  <div class="text-sm font-medium text-[var(--el-text-color-primary)]">
                    {{ getLogTitle(log) }}
                  </div>
                  <div class="text-xs leading-6 text-[var(--el-text-color-secondary)]">
                    {{ getLogMeta(log) }}
                  </div>
                </div>
              </ElTimelineItem>
            </ElTimeline>
            <ElEmpty v-else description="暂无操作记录" />
          </ElCard>
        </div>

        <div class="space-y-4">
          <ElCard shadow="never" class="art-card-xs">
            <template #header>支付信息</template>
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="付款状态">
                <ElTag :type="paymentTagType" effect="light" round>
                  {{ paymentStatusText }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="支付渠道">{{ paymentChannelText }}</ElDescriptionsItem>
              <ElDescriptionsItem label="支付单号">
                <span class="font-mono">{{ detail.payment?.paymentNo || '-' }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="支付时间">
                {{ detail.payment?.paidTime ? formatDateTime(detail.payment.paidTime) : '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <ElCard shadow="never" class="art-card-xs">
            <template #header>金额与营销</template>
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="小计">{{
                formatMoney(detail.totalAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="运费">{{
                formatMoney(detail.freightAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="优惠金额">
                -{{ formatMoney(detail.discountAmount) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="应付金额">
                <span class="text-lg font-semibold text-[var(--el-text-color-primary)]">
                  {{ formatMoney(detail.payAmount) }}
                </span>
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <ElCard shadow="never" class="art-card-xs">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <span>备注</span>
                <ElButton text @click="toggleRemarkEdit">
                  {{ remarkEditing ? '收起编辑' : '编辑备注' }}
                </ElButton>
              </div>
            </template>

            <div v-if="remarkEditing" class="grid gap-3">
              <ElInput
                v-model="remarkDraft"
                type="textarea"
                :rows="4"
                placeholder="请输入订单备注"
              />
              <div class="flex justify-end gap-3">
                <ElButton @click="cancelRemarkEdit">取消</ElButton>
                <ElButton type="primary" :disabled="!canSubmitRemark" @click="submitRemark">
                  保存备注
                </ElButton>
              </div>
            </div>

            <div
              v-else
              class="min-h-[88px] whitespace-pre-wrap text-sm leading-7 text-[var(--el-text-color-primary)]"
            >
              {{ detail.remark || '暂无备注信息' }}
            </div>
          </ElCard>

          <ElCard shadow="never" class="art-card-xs">
            <template #header>订单概况</template>
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="订单号">
                <span class="font-mono">{{ detail.orderNo }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="用户 ID">{{ detail.userId }}</ElDescriptionsItem>
              <ElDescriptionsItem label="订单状态">
                {{ getOrderStatusText(detail.status, detail.statusDesc) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="商品数量"
                >{{ detail.items?.length || 0 }} 件</ElDescriptionsItem
              >
              <ElDescriptionsItem label="更新时间">
                {{ formatDateTime(detail.updateTime) || '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </div>
      </div>
    </template>

    <ElDialog v-model="addressDialogVisible" title="修改地址" width="560px" append-to-body>
      <ElForm label-width="88px">
        <ElFormItem label="收货人">
          <ElInput v-model="addressDraft.receiverName" clearable />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="addressDraft.receiverPhone" clearable />
        </ElFormItem>
        <ElFormItem label="省">
          <ElInput v-model="addressDraft.receiverProvince" clearable />
        </ElFormItem>
        <ElFormItem label="市">
          <ElInput v-model="addressDraft.receiverCity" clearable />
        </ElFormItem>
        <ElFormItem label="区">
          <ElInput v-model="addressDraft.receiverDistrict" clearable />
        </ElFormItem>
        <ElFormItem label="详细地址">
          <ElInput v-model="addressDraft.receiverAddress" clearable />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="addressDialogVisible = false">取消</ElButton>
          <ElButton type="primary" :disabled="!canSubmitAddress" @click="submitAddress">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog v-model="amountDialogVisible" title="调整金额" width="480px" append-to-body>
      <div
        class="mb-4 rounded-lg bg-[var(--el-fill-color-light)] p-3 text-sm text-[var(--el-text-color-secondary)]"
      >
        当前应付：<span class="font-medium text-[var(--el-text-color-primary)]">{{
          formatMoney(detail?.payAmount || 0)
        }}</span>
      </div>

      <ElForm label-width="88px">
        <ElFormItem label="新应付金额">
          <ElInputNumber
            v-model="payAmountDraft"
            :min="0"
            :precision="2"
            controls-position="right"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="amountDialogVisible = false">取消</ElButton>
          <ElButton type="primary" :disabled="!canSubmitAmount" @click="submitAmount">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <OrderDeliverDialog
      v-model="deliverVisible"
      :order-no="detail?.orderNo || null"
      :submitting="deliverSubmitting"
      @submit="handleDeliverSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    adjustOrderAmount,
    fetchOrderDetail,
    fetchOrderOperationLogs,
    fetchOrderShipment,
    forceCancelOrder,
    OPERATION_TYPE_TEXT,
    PAY_CHANNEL_TEXT,
    shipOrder,
    updateOrderAddress,
    updateOrderRemark,
    type OperationType,
    type OrderDetailItem,
    type OrderOperationLog,
    type OrderShipPayload
  } from '@/api/order'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types/component'
  import { formatDateTime } from '@/utils/date'
  import { ElImage, ElMessageBox } from 'element-plus'
  import OrderDeliverDialog from './modules/order-deliver-dialog.vue'
  import {
    canForceCancelOrder,
    formatMoney,
    getOrderStatusText,
    getOrderTagType,
    getPaymentStatusText,
    getPaymentTagType,
    getShipmentStatusText,
    isOrderReadyToShip
  } from './modules/order-status'

  defineOptions({ name: 'OrderDetailPage' })

  const route = useRoute()
  const router = useRouter()
  const orderNo = computed(() => String(route.params.orderNo || '').trim())

  const pageLoading = ref(false)
  const detail = ref<OrderDetailItem | null>(null)
  const operationLogs = ref<OrderOperationLog[]>([])
  const remarkDraft = ref('')
  const remarkEditing = ref(false)

  const addressDialogVisible = ref(false)
  const amountDialogVisible = ref(false)
  const deliverVisible = ref(false)
  const deliverSubmitting = ref(false)
  const payAmountDraft = ref<number | null>(null)
  const addressDraft = ref({
    receiverName: '',
    receiverPhone: '',
    receiverProvince: '',
    receiverCity: '',
    receiverDistrict: '',
    receiverAddress: ''
  })

  const normalizedStatus = computed(() => Number(detail.value?.status || 0))
  const canEditAddress = computed(() => [1, 5, 6].includes(normalizedStatus.value))
  const canAdjustAmount = computed(() => normalizedStatus.value === 5)
  const canShip = computed(() => isOrderReadyToShip(detail.value?.status, detail.value?.statusDesc))
  const canForceCancel = computed(() => canForceCancelOrder(detail.value?.status))
  const statusTagType = computed(() => getOrderTagType(detail.value?.status))

  const fullAddress = computed(() =>
    [
      detail.value?.receiverProvince,
      detail.value?.receiverCity,
      detail.value?.receiverDistrict,
      detail.value?.receiverAddress
    ]
      .filter(Boolean)
      .join(' ')
  )

  const paymentChannelText = computed(() => {
    const payChannel = detail.value?.payment?.payChannel
    if (!payChannel) return '未配置渠道'
    return PAY_CHANNEL_TEXT[payChannel] || '未配置渠道'
  })

  const paymentStatusText = computed(() => getPaymentStatusText(detail.value))

  const paymentTagType = computed(() => getPaymentTagType(detail.value))

  const shipmentStatusText = computed(() => getShipmentStatusText(detail.value))

  const canSubmitRemark = computed(() => {
    return remarkDraft.value.trim() !== String(detail.value?.remark || '').trim()
  })

  const canSubmitAddress = computed(() => {
    if (!detail.value) return false

    return (
      addressDraft.value.receiverName.trim() !== String(detail.value.receiverName || '').trim() ||
      addressDraft.value.receiverPhone.trim() !== String(detail.value.receiverPhone || '').trim() ||
      addressDraft.value.receiverProvince.trim() !==
        String(detail.value.receiverProvince || '').trim() ||
      addressDraft.value.receiverCity.trim() !== String(detail.value.receiverCity || '').trim() ||
      addressDraft.value.receiverDistrict.trim() !==
        String(detail.value.receiverDistrict || '').trim() ||
      addressDraft.value.receiverAddress.trim() !==
        String(detail.value.receiverAddress || '').trim()
    )
  })

  const canSubmitAmount = computed(() => {
    if (!detail.value || payAmountDraft.value === null) return false
    return Number(payAmountDraft.value) !== Number(detail.value.payAmount || 0)
  })

  const getOperationTypeText = (operationType: number) =>
    OPERATION_TYPE_TEXT[operationType as OperationType] || `类型 ${operationType}`

  const getLogTitle = (log: OrderOperationLog) =>
    log.detail || getOperationTypeText(log.operationType)

  const getLogMeta = (log: OrderOperationLog) => {
    const meta: string[] = [`操作类型：${getOperationTypeText(log.operationType)}`]
    if (log.operatorName) meta.unshift(`操作人：${log.operatorName}`)
    else if (log.operatorId !== null && log.operatorId !== undefined) {
      meta.unshift(`操作人 ID：${log.operatorId}`)
    }
    return meta.join(' · ')
  }

  const formatSkuAttrs = (raw?: string | null) => {
    if (!raw) return '-'

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return raw

      const result = parsed
        .map((item) => {
          const attrName = String(item?.attrName ?? '').trim()
          const attrValue = String(item?.attrValue ?? '').trim()
          if (attrName && attrValue) return `${attrName}: ${attrValue}`
          return attrName || attrValue
        })
        .filter(Boolean)
        .join('；')

      return result || raw
    } catch {
      return raw
    }
  }

  const itemColumns: ColumnOption[] = [
    {
      type: 'globalIndex',
      width: 68,
      label: '序号'
    },
    {
      prop: 'spuName',
      label: '商品信息',
      minWidth: 280,
      formatter: (row) =>
        h('div', { class: 'flex items-center gap-3' }, [
          row.skuPic
            ? h(ElImage, {
                src: row.skuPic,
                fit: 'cover',
                class: 'size-12 rounded-lg',
                previewSrcList: [row.skuPic],
                previewTeleported: true
              })
            : h(
                'div',
                {
                  class:
                    'flex size-12 items-center justify-center rounded-lg bg-g-100 text-xs text-g-500'
                },
                '无图'
              ),
          h('div', { class: 'min-w-0 flex-1' }, [
            h('div', { class: 'truncate font-medium text-g-900' }, row.spuName || '-'),
            h('div', { class: 'truncate text-xs text-g-500' }, formatSkuAttrs(row.skuAttrs))
          ])
        ])
    },
    {
      prop: 'price',
      label: '单价',
      width: 120,
      formatter: (row) => formatMoney(row.price)
    },
    {
      prop: 'quantity',
      label: '数量',
      width: 90
    },
    {
      prop: 'subtotal',
      label: '小计',
      width: 120,
      formatter: (row) => formatMoney(row.subtotal)
    }
  ]

  const loadDetail = async () => {
    if (!orderNo.value) return

    pageLoading.value = true
    try {
      const [detailData, logs] = await Promise.all([
        fetchOrderDetail(orderNo.value),
        fetchOrderOperationLogs(orderNo.value)
      ])

      detail.value = detailData
      operationLogs.value = logs
      remarkDraft.value = String(detailData.remark || '')
    } finally {
      pageLoading.value = false
    }
  }

  const refreshShipment = async () => {
    if (!detail.value) return
    detail.value = {
      ...detail.value,
      shipment: await fetchOrderShipment(detail.value.orderNo)
    }
  }

  const toggleRemarkEdit = () => {
    remarkEditing.value = !remarkEditing.value
    if (remarkEditing.value) {
      remarkDraft.value = String(detail.value?.remark || '')
    }
  }

  const cancelRemarkEdit = () => {
    remarkEditing.value = false
    remarkDraft.value = String(detail.value?.remark || '')
  }

  const submitRemark = async () => {
    if (!detail.value || !canSubmitRemark.value) return
    await updateOrderRemark({
      orderNo: detail.value.orderNo,
      remark: remarkDraft.value.trim() || null
    })
    remarkEditing.value = false
    await loadDetail()
  }

  const openAddressDialog = () => {
    if (!detail.value) return
    addressDraft.value = {
      receiverName: detail.value.receiverName || '',
      receiverPhone: detail.value.receiverPhone || '',
      receiverProvince: detail.value.receiverProvince || '',
      receiverCity: detail.value.receiverCity || '',
      receiverDistrict: detail.value.receiverDistrict || '',
      receiverAddress: detail.value.receiverAddress || ''
    }
    addressDialogVisible.value = true
  }

  const submitAddress = async () => {
    if (!detail.value || !canSubmitAddress.value) return

    await updateOrderAddress({
      orderNo: detail.value.orderNo,
      receiverName: addressDraft.value.receiverName.trim() || null,
      receiverPhone: addressDraft.value.receiverPhone.trim() || null,
      receiverProvince: addressDraft.value.receiverProvince.trim() || null,
      receiverCity: addressDraft.value.receiverCity.trim() || null,
      receiverDistrict: addressDraft.value.receiverDistrict.trim() || null,
      receiverAddress: addressDraft.value.receiverAddress.trim() || null
    })

    addressDialogVisible.value = false
    await loadDetail()
  }

  const openAmountDialog = () => {
    if (!detail.value) return
    payAmountDraft.value = Number(detail.value.payAmount || 0)
    amountDialogVisible.value = true
  }

  const submitAmount = async () => {
    if (!detail.value || !canSubmitAmount.value || payAmountDraft.value === null) return

    await adjustOrderAmount({
      orderNo: detail.value.orderNo,
      payAmount: Number(payAmountDraft.value)
    })

    amountDialogVisible.value = false
    await loadDetail()
  }

  const handleForceCancel = async () => {
    if (!detail.value) return

    await ElMessageBox.confirm(`确认强制取消订单 ${detail.value.orderNo} 吗？`, '强制取消', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await forceCancelOrder(detail.value.orderNo)
    await loadDetail()
  }

  const handleDeliverSubmit = async (payload: Omit<OrderShipPayload, 'orderNo'>) => {
    if (!detail.value) return

    deliverSubmitting.value = true
    try {
      await shipOrder({
        orderNo: detail.value.orderNo,
        logisticsCompany: payload.logisticsCompany,
        logisticsCode: payload.logisticsCode,
        logisticsNo: payload.logisticsNo
      })
      deliverVisible.value = false
      await loadDetail()
    } finally {
      deliverSubmitting.value = false
    }
  }

  watch(
    () => orderNo.value,
    () => {
      void loadDetail()
    },
    { immediate: true }
  )
</script>
