<template>
  <div class="flex flex-wrap items-center gap-5 border-b border-[var(--el-border-color-lighter)]">
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
  .category-segment-tabs__item {
    position: relative;
    padding: 10px 0;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: transparent;
    border: none;
  }

  .category-segment-tabs__item.is-active {
    color: var(--el-text-color-primary);
  }

  .category-segment-tabs__item.is-active::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 999px;
  }
</style>
