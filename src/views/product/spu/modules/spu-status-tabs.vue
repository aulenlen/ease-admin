<template>
  <div class="spu-status-tabs">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="spu-status-tabs__item"
      :class="{ 'is-active': modelValue === item.key }"
      @click="$emit('update:modelValue', item.key)"
    >
      <span>{{ item.label }}</span>
      <span class="spu-status-tabs__count">{{ item.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  export type SpuStatusTabKey = 'all' | 'publish' | 'unpublish' | 'verify' | 'staged'

  interface TabItem {
    key: SpuStatusTabKey
    label: string
    count: number | string
  }

  interface Props {
    modelValue: SpuStatusTabKey
    items: TabItem[]
  }

  defineProps<Props>()

  defineEmits<{
    (e: 'update:modelValue', value: SpuStatusTabKey): void
  }>()
</script>

<style scoped lang="scss">
  .spu-status-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    padding-bottom: 2px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .spu-status-tabs__item {
    position: relative;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 10px 0;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    user-select: none;
    background: transparent;
    border: none;
    transition: color 0.18s ease;
  }

  .spu-status-tabs__item.is-active {
    color: var(--el-color-primary);
  }

  .spu-status-tabs__item:hover,
  .spu-status-tabs__item:focus-visible {
    color: var(--el-text-color-primary);
    outline: none;
  }

  .spu-status-tabs__item.is-active::after {
    position: absolute;
    right: 0;
    bottom: -3px;
    left: 0;
    height: 2px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 999px;
  }

  .spu-status-tabs__count {
    min-width: 18px;
    padding: 0 5px;
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    color: var(--el-text-color-placeholder);
    text-align: center;
    background: var(--el-fill-color-light);
    border-radius: 999px;
    transition:
      color 0.18s ease,
      background-color 0.18s ease;
  }

  .spu-status-tabs__item.is-active .spu-status-tabs__count {
    color: var(--el-color-primary);
    background: rgb(236 243 255 / 100%);
  }

  @media (width <= 768px) {
    .spu-status-tabs {
      gap: 14px;
    }

    .spu-status-tabs__item {
      font-size: 12px;
    }
  }
</style>
