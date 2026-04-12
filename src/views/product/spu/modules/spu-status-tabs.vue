<template>
  <div
    class="flex flex-wrap items-center gap-4 border-b border-[var(--el-border-color-lighter)] pb-0.5 max-md:gap-3"
  >
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
  export type SharedStatusTabKey = string | number

  interface TabItem {
    key: SharedStatusTabKey
    label: string
    count: number | string
  }

  interface Props {
    modelValue: SharedStatusTabKey
    items: TabItem[]
  }

  defineProps<Props>()

  defineEmits<{
    (e: 'update:modelValue', value: SharedStatusTabKey): void
  }>()
</script>

<style scoped lang="scss">
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
    background: var(--art-el-active-color);
  }
</style>
