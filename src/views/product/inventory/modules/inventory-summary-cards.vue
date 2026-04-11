<template>
  <div class="grid gap-3 xl:grid-cols-4 md:grid-cols-2 grid-cols-1">
    <ElCard v-for="item in items" :key="item.key" shadow="never" class="art-card-xs">
      <div class="flex items-center gap-3">
        <div class="inventory-summary-card__icon" :class="`is-${item.tone}`">
          <ElIcon>
            <component :is="item.icon" />
          </ElIcon>
        </div>
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span class="text-xs text-[var(--el-text-color-regular)]">{{ item.label }}</span>
          <span
            class="shrink-0 text-[15px] font-bold leading-none text-[var(--el-text-color-primary)]"
          >
            {{ item.value }}
          </span>
          <span class="truncate text-xs text-[var(--el-text-color-secondary)]">{{
            item.meta
          }}</span>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  interface SummaryCardItem {
    key: string
    label: string
    value: string
    meta: string
    tone: 'sky' | 'slate' | 'amber' | 'rose'
    icon: any
  }

  defineProps<{
    items: SummaryCardItem[]
  }>()
</script>

<style scoped lang="scss">
  :deep(.el-card__body) {
    padding: 12px 14px;
  }

  .inventory-summary-card__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 15px;
    border-radius: 10px;
  }

  .inventory-summary-card__icon.is-sky {
    color: #2563eb;
    background: rgb(219 234 254 / 88%);
  }

  .inventory-summary-card__icon.is-slate {
    color: #475569;
    background: rgb(226 232 240 / 88%);
  }

  .inventory-summary-card__icon.is-amber {
    color: #d97706;
    background: rgb(254 243 199 / 90%);
  }

  .inventory-summary-card__icon.is-rose {
    color: #e11d48;
    background: rgb(255 228 230 / 92%);
  }
</style>
