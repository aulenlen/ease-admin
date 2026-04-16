<template>
  <ElDrawer
    :model-value="modelValue"
    :size="drawerSize"
    direction="rtl"
    append-to-body
    :with-header="false"
    class="payment-detail-drawer"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <div class="flex h-full flex-col">
      <header
        class="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--el-border-color-lighter)] px-5 pb-4 pt-5"
      >
        <div class="min-w-0 flex-1">
          <div class="text-lg font-semibold text-[var(--el-text-color-primary)]">支付单详情</div>
          <div
            v-if="detail?.paymentNo"
            class="mt-1 break-all text-xs text-[var(--el-text-color-secondary)]"
          >
            {{ detail.paymentNo }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <ElTag v-if="detail" :type="getPaymentTagType(detail.status)" effect="light" round>
            {{ getPaymentStatusText(detail.status) }}
          </ElTag>
          <ElButton
            v-if="detail?.orderNo"
            link
            type="primary"
            @click="emit('open-order', detail.orderNo)"
          >
            查看订单
          </ElButton>
        </div>
      </header>

      <div v-loading="loading" class="flex-1 overflow-y-auto px-5 py-4">
        <template v-if="detail">
          <ElDescriptions :column="1" border class="payment-detail-drawer__descriptions">
            <ElDescriptionsItem label="支付单号">{{ detail.paymentNo || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="订单号">{{ detail.orderNo || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="支付金额">{{
              formatMoney(detail.payAmount)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="支付渠道">
              {{ getPayChannelText(detail.payChannel) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="支付状态">
              {{ getPaymentStatusText(detail.status) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="创建时间">
              {{ formatDateTime(detail.createTime) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="过期时间">
              {{ formatDateTime(detail.expireTime) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="支付时间">
              {{ formatDateTime(detail.paidTime) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <section v-if="detail.payForm" class="mt-4">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">支付表单</div>
            <ElInput :model-value="detail.payForm" type="textarea" :rows="8" readonly />
            <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
              出于安全考虑，仅展示原始文本，不直接渲染 HTML。
            </div>
          </section>
        </template>

        <ElEmpty v-else description="暂无支付单数据" />
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import type { PaymentDetailItem } from '@/api/payment'
  import { formatDateTime } from '@/utils/date'
  import {
    formatMoney,
    getPayChannelText,
    getPaymentStatusText,
    getPaymentTagType
  } from './payment-status'

  defineOptions({ name: 'PaymentDetailDrawer' })

  defineProps<{
    modelValue: boolean
    loading: boolean
    detail: PaymentDetailItem | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'open-order', orderNo: string): void
  }>()

  const { width } = useWindowSize()
  const drawerSize = computed(() => (width.value <= 768 ? '100%' : '640px'))
</script>

<style scoped lang="scss">
  :deep(.payment-detail-drawer > .el-drawer__body) {
    padding: 0;
  }

  :deep(.payment-detail-drawer__descriptions .el-descriptions__label) {
    width: 112px;
  }
</style>
