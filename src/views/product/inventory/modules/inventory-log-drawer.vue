<template>
  <ElDrawer
    :model-value="modelValue"
    size="420px"
    direction="rtl"
    append-to-body
    :with-header="false"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <div class="flex h-full flex-col">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="text-lg font-semibold">库存变更记录</div>
          <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
            查看当前 SKU 的库存变更轨迹
          </div>
        </div>
        <div v-if="sku" class="text-xs text-[var(--el-text-color-secondary)]">{{
          sku.skuCode
        }}</div>
      </header>

      <div
        v-if="sku"
        class="mt-3 rounded-[10px] bg-[var(--el-fill-color-light)] px-3 py-3 text-xs text-[var(--el-text-color-secondary)]"
      >
        {{ sku.spuName || '-' }} · {{ sku.brandName || '-' }} · {{ formatSpecs(sku.specs || []) }}
      </div>

      <div v-loading="loading" class="custom-scroll mt-4 flex-1">
        <article
          v-for="item in items"
          :key="item.id"
          class="rounded-[10px] border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-blank)] px-3.5 py-3"
          :class="{ 'mt-3': true }"
        >
          <div class="flex justify-between gap-2">
            <span class="font-semibold">{{ item.changeType }}</span>
            <span class="text-xs text-g-500">{{ formatDateTime(item.createTime) }}</span>
          </div>
          <div
            class="mt-1.5 flex justify-between gap-2 text-[13px] text-[var(--el-text-color-regular)]"
          >
            <span>库存 {{ item.changeQuantity >= 0 ? '+' : '' }}{{ item.changeQuantity }}</span>
            <span>当前 {{ item.afterStock }}</span>
            <span>锁定 {{ item.afterLockStock }}</span>
          </div>
          <div class="mt-1.5 text-[13px] text-[var(--el-text-color-regular)]">
            {{ item.remark || [item.sourceType, item.sourceNo].filter(Boolean).join(' / ') || '—' }}
          </div>
        </article>
        <ElEmpty v-if="!loading && items.length === 0" description="暂无变更记录" />
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { formatDateTime } from '@/utils/date'
  import type { InventorySkuRow, StockLogItem } from '@/api/sku-stock'

  defineProps<{
    modelValue: boolean
    loading: boolean
    sku: (InventorySkuRow & { spuName?: string; brandName?: string }) | null
    items: StockLogItem[]
  }>()

  defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  const formatSpecs = (specs: { attrName?: string; attrValue?: string }[]) =>
    specs.map((item) => `${item.attrName}：${item.attrValue}`).join(' · ')
</script>
