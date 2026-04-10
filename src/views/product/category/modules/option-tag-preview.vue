<template>
  <div v-if="normalizedOptions.length" class="flex flex-wrap gap-2">
    <ElTag v-for="option in normalizedOptions.slice(0, max)" :key="option" effect="plain">
      {{ option }}
    </ElTag>

    <ElPopover
      v-if="normalizedOptions.length > max"
      placement="top"
      trigger="hover"
      :show-after="300"
      :width="popoverWidth"
    >
      <div class="flex max-h-48 flex-wrap gap-2 overflow-auto">
        <ElTag v-for="option in normalizedOptions" :key="`all-${option}`" effect="plain">
          {{ option }}
        </ElTag>
      </div>
      <template #reference>
        <span class="cursor-pointer text-xs text-[var(--el-text-color-secondary)]">
          +{{ normalizedOptions.length - max }}
        </span>
      </template>
    </ElPopover>
  </div>
  <span v-else class="text-[var(--el-text-color-secondary)]">—</span>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'

  interface Props {
    options?: string[]
    max?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    options: () => [],
    max: 3
  })
  const { width } = useWindowSize()

  const normalizedOptions = computed(() =>
    (props.options || []).map((item) => String(item || '').trim()).filter(Boolean)
  )
  const popoverWidth = computed(() => Math.min(320, Math.max(width.value - 48, 220)))
</script>
