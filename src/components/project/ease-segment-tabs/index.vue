<template>
  <div class="ease-segment-tabs">
    <button
      v-for="item in items"
      :key="String(item.value)"
      type="button"
      class="ease-segment-tabs__item"
      :class="{ 'is-active': modelValue === item.value }"
      @click="handleClick(item.value)"
    >
      <span class="ease-segment-tabs__label">{{ item.label }}</span>
      <span v-if="item.count !== undefined && item.count !== null" class="ease-segment-tabs__count">
        {{ item.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'EaseSegmentTabs' })

  export type EaseSegmentTabValue = string | number

  export interface EaseSegmentTabItem {
    label: string
    value: EaseSegmentTabValue
    count?: string | number
  }

  interface Props {
    modelValue: EaseSegmentTabValue
    items: readonly EaseSegmentTabItem[]
  }

  interface Emits {
    (e: 'update:modelValue', value: EaseSegmentTabValue): void
    (e: 'change', value: EaseSegmentTabValue): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  function handleClick(value: EaseSegmentTabValue) {
    emit('update:modelValue', value)
    emit('change', value)
  }
</script>
