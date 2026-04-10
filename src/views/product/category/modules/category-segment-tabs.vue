<template>
  <div class="category-segment-tabs">
    <button
      v-for="item in options"
      :key="String(item.value)"
      type="button"
      class="category-segment-tabs__item"
      :class="{ 'is-active': modelValue === item.value }"
      @click="handleClick(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
  interface SegmentOption {
    label: string
    value: string | number
  }

  interface Props {
    modelValue: string | number
    options: readonly SegmentOption[]
  }

  interface Emits {
    (e: 'update:modelValue', value: string | number): void
    (e: 'change', value: string | number): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  function handleClick(value: string | number) {
    emit('update:modelValue', value)
    emit('change', value)
  }
</script>

<style scoped lang="scss">
  .category-segment-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .category-segment-tabs__item {
    position: relative;
    padding: 10px 0;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
  }

  .category-segment-tabs__item.is-active {
    color: var(--el-text-color-primary);
  }

  .category-segment-tabs__item.is-active::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: var(--el-color-primary);
    border-radius: 999px;
  }
</style>
