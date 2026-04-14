<template>
  <ElDialog
    v-model="visible"
    title="全局属性管理"
    :width="managerDialogWidth"
    top="4vh"
    class="attribute-manager-dialog"
    destroy-on-close
  >
    <AttributeManagerContent
      v-if="visible"
      :preset-type="props.presetType"
      @changed="emit('changed')"
    />
  </ElDialog>
</template>

<script setup lang="ts">
  import AttributeManagerContent from './attribute-manager-content.vue'
  import type { CategoryAttributeType } from '@/api/category-attribute'
  import { useWindowSize } from '@vueuse/core'

  interface Props {
    modelValue: boolean
    presetType?: -1 | CategoryAttributeType
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'changed'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    presetType: -1
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })
  const managerDialogWidth = computed(() => `${Math.min(960, Math.max(width.value - 24, 320))}px`)
</script>

<style scoped lang="scss">
  :deep(.attribute-manager-dialog) {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 8vh);
    margin-bottom: 4vh;
  }

  :deep(.attribute-manager-dialog .el-dialog__body) {
    overflow: auto;
  }
</style>
