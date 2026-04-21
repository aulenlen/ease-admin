<template>
  <div class="ease-table-search">
    <div class="ease-table-search__row" :style="rowStyle">
      <slot />
    </div>

    <div v-if="$slots.filters" class="ease-table-search__filters">
      <slot name="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'EaseTableSearch' })

  interface Props {
    columns?: string
    gap?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    columns: 'minmax(0, 1fr)',
    gap: 12
  })

  const rowStyle = computed(() => ({
    '--ease-table-search-columns': props.columns,
    '--ease-table-search-gap': typeof props.gap === 'number' ? `${props.gap}px` : props.gap
  }))
</script>

<style scoped lang="scss">
  /* 这里只控制搜索区结构：
   - 第一行 fields 的网格布局
   - 第二行 filters 的换行布局
   - 移动端降成单列
   不再控制 input / select / button 的视觉样式。 */
  .ease-table-search {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ease-table-search__row {
    display: grid;
    grid-template-columns: var(--ease-table-search-columns);
    gap: var(--ease-table-search-gap);
    align-items: center;
    width: fit-content;
    max-width: 100%;
  }

  :deep(.ease-table-search__row .el-input),
  :deep(.ease-table-search__row .el-select),
  :deep(.ease-table-search__row .el-cascader),
  :deep(.ease-table-search__row .el-date-editor) {
    width: 100%;
  }

  :deep(.ease-table-search__row > *) {
    min-width: 0;
  }

  .ease-table-search__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.ease-table-search__filters .el-tag) {
    height: 24px !important;
    padding: 0 8px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border-color: transparent !important;
    border-radius: 6px !important;
    transition: none !important;
  }

  :deep(.ease-table-search__filters .el-tag--light) {
    color: var(--el-text-color-regular) !important;
    background: var(--el-fill-color) !important;
  }

  :deep(.ease-table-search__keyword-suffix) {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding-right: 2px;
  }

  :deep(.ease-table-search__keyword-icon) {
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    transition: color 0.18s ease;

    &:hover {
      color: var(--el-text-color-primary);
    }
  }

  @media (width <= 768px) {
    .ease-table-search {
      width: 100%;
    }

    .ease-table-search__row {
      grid-template-columns: 1fr;
      width: 100%;
    }
  }
</style>
