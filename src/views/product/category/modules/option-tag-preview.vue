<template>
  <div v-if="normalizedOptions.length" ref="rootRef" class="option-tag-preview">
    <span v-for="option in visibleOptions" :key="option" class="option-tag-preview__tag">
      {{ option }}
    </span>

    <ElPopover
      v-if="hiddenCount > 0"
      placement="top"
      trigger="hover"
      :show-after="300"
      :width="popoverWidth"
    >
      <div class="option-tag-preview__popover">
        <span
          v-for="(option, index) in normalizedOptions"
          :key="`all-${option}-${index}`"
          class="option-tag-preview__tag"
        >
          {{ option }}
        </span>
      </div>
      <template #reference>
        <span class="option-tag-preview__more">+{{ hiddenCount }}</span>
      </template>
    </ElPopover>
  </div>
  <span v-else class="option-tag-preview__empty">—</span>

  <div class="option-tag-preview__measure" aria-hidden="true">
    <span
      v-for="(option, index) in normalizedOptions"
      :key="`measure-${option}-${index}`"
      ref="measureTagRefs"
      class="option-tag-preview__tag"
    >
      {{ option }}
    </span>
    <span ref="measureMoreRef" class="option-tag-preview__more">+0</span>
  </div>
</template>

<script setup lang="ts">
  import { useResizeObserver, useWindowSize } from '@vueuse/core'

  interface Props {
    options?: string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    options: () => []
  })

  const { width } = useWindowSize()

  const rootRef = ref<HTMLElement>()
  const measureTagRefs = ref<HTMLElement[]>([])
  const measureMoreRef = ref<HTMLElement>()
  const visibleCount = ref(0)

  const normalizedOptions = computed(() =>
    (props.options || []).map((item) => String(item || '').trim()).filter(Boolean)
  )
  const popoverWidth = computed(() => Math.min(360, Math.max(width.value - 48, 240)))
  const visibleOptions = computed(() => normalizedOptions.value.slice(0, visibleCount.value))
  const hiddenCount = computed(() =>
    Math.max(0, normalizedOptions.value.length - visibleCount.value)
  )

  function getMoreWidth(hidden: number) {
    if (!measureMoreRef.value) return 0

    const previousText = measureMoreRef.value.textContent
    measureMoreRef.value.textContent = `+${hidden}`
    const nextWidth = measureMoreRef.value.offsetWidth
    measureMoreRef.value.textContent = previousText || '+0'
    return nextWidth
  }

  function recalculateVisibleCount() {
    const total = normalizedOptions.value.length
    if (!total) {
      visibleCount.value = 0
      return
    }

    const containerWidth = rootRef.value?.clientWidth || 0
    const tagWidths = measureTagRefs.value.map((item) => item.offsetWidth).filter(Boolean)
    const gap = 8

    if (!containerWidth || !tagWidths.length) {
      visibleCount.value = total
      return
    }

    for (let count = total; count >= 0; count -= 1) {
      const hidden = total - count
      let consumedWidth = 0

      if (count > 0) {
        consumedWidth += tagWidths.slice(0, count).reduce((sum, width) => sum + width, 0)
        consumedWidth += gap * Math.max(count - 1, 0)
      }

      if (hidden > 0) {
        consumedWidth += getMoreWidth(hidden)
        if (count > 0) consumedWidth += gap
      }

      if (consumedWidth <= containerWidth) {
        visibleCount.value = count
        return
      }
    }

    visibleCount.value = 0
  }

  useResizeObserver(rootRef, () => {
    recalculateVisibleCount()
  })

  watch(
    () => normalizedOptions.value,
    async () => {
      await nextTick()
      recalculateVisibleCount()
    },
    { deep: true, immediate: true }
  )
</script>

<style scoped lang="scss">
  .option-tag-preview,
  .option-tag-preview__popover {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    align-items: center;
    width: 100%;
    min-width: 0;
  }

  .option-tag-preview__popover {
    flex-wrap: wrap;
    width: auto;
  }

  .option-tag-preview__tag {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    font-size: 13px;
    line-height: 24px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
    background: #f7f8fa;
    border: 1px solid #e7eaf0;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .option-tag-preview__more {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    cursor: pointer;
  }

  .option-tag-preview__empty {
    color: var(--el-text-color-secondary);
  }

  .option-tag-preview__measure {
    position: fixed;
    top: -9999px;
    left: -9999px;
    z-index: -1;
    display: flex;
    gap: 8px;
    white-space: nowrap;
    pointer-events: none;
    visibility: hidden;
  }
</style>
