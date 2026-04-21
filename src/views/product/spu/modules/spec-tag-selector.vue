<template>
  <div class="flex flex-col gap-3 py-4 md:grid md:grid-cols-[180px_minmax(0,1fr)_auto] md:gap-x-4">
    <div class="min-w-0">
      <ElInput
        v-if="editable"
        v-model.trim="draftName"
        placeholder="请输入规格名"
        @keyup.enter="commitName"
        @blur="commitName"
      />
      <ElInput v-else :model-value="attrName || '未命名规格'" readonly />
    </div>

    <div class="min-w-0 space-y-3">
      <div class="spec-tag-selector__value-shell">
        <div v-if="normalizedValues.length" class="spec-tag-selector__value-prefix">
          <ElTag
            v-for="value in normalizedValues"
            :key="value"
            size="small"
            closable
            effect="plain"
            class="spec-tag-selector__selected-tag"
            @close="removeValue(value)"
          >
            {{ value }}
          </ElTag>
        </div>

        <input
          v-model="inputValue"
          type="text"
          class="spec-tag-selector__value-native"
          :class="{ 'is-empty': !normalizedValues.length }"
          placeholder=""
          @keydown="handleKeydown"
          @blur="commitInput"
        />
      </div>

      <div v-if="presetOptions.length" class="space-y-2">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in presetOptions"
            :key="option"
            type="button"
            class="spec-tag-selector__preset-tag"
            :class="{ 'is-active': selectedPresetValues.includes(option) }"
            @click="togglePreset(option, !selectedPresetValues.includes(option))"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="editable" class="flex items-start justify-end gap-2 pt-1">
      <ElButton text size="small" type="danger" @click="emit('remove')">
        <ArtSvgIcon icon="ri:delete-bin-6-line" class="text-sm" />
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    attrName: string
    attrId?: number
    presetOptions?: string[]
    modelValue: string[]
    editable?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    attrId: undefined,
    presetOptions: () => [],
    editable: false
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
    (e: 'update:attrName', name: string): void
    (e: 'remove'): void
    (e: 'change'): void
  }>()

  const inputValue = ref('')
  const draftName = ref('')

  const normalizedValues = computed(() =>
    Array.from(
      new Set((props.modelValue || []).map((item) => String(item || '').trim()).filter(Boolean))
    )
  )

  watch(
    () => props.attrName,
    (value) => {
      draftName.value = value
    },
    { immediate: true }
  )

  const selectedPresetValues = computed(() =>
    props.presetOptions.filter((option) => normalizedValues.value.includes(option))
  )

  const emitValues = (values: string[]) => {
    emit(
      'update:modelValue',
      Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)))
    )
    emit('change')
  }

  const parseTokens = (value?: string) =>
    String(value || '')
      .split(/[\n,，;；/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)

  const removeValue = (value: string) => {
    emitValues(normalizedValues.value.filter((item) => item !== value))
  }

  const commitInput = () => {
    const tokens = parseTokens(inputValue.value)
    if (!tokens.length) return
    emitValues([...normalizedValues.value, ...tokens])
    inputValue.value = ''
  }

  const handleKeydown = (event: Event | KeyboardEvent) => {
    if (!(event instanceof KeyboardEvent)) return
    const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete'
    if (isDeleteKey && !inputValue.value.trim() && normalizedValues.value.length) {
      event.preventDefault()
      removeValue(normalizedValues.value[normalizedValues.value.length - 1])
      return
    }

    if (event.key !== 'Enter' && event.key !== ',' && event.key !== '，') return
    event.preventDefault()
    commitInput()
  }

  const togglePreset = (option: string, checked: boolean) => {
    if (checked) {
      emitValues([...normalizedValues.value, option])
      return
    }

    emitValues(normalizedValues.value.filter((item) => item !== option))
  }

  const commitName = () => {
    const trimmed = draftName.value.trim()
    if (trimmed && trimmed !== props.attrName) {
      emit('update:attrName', trimmed)
      return
    }

    draftName.value = props.attrName
  }
</script>

<style scoped lang="scss">
  .spec-tag-selector__value-shell {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
    align-items: center;
    width: 100%;
    min-height: var(--el-component-size);
    padding: 3px 11px;
    background: var(--el-fill-color-blank);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
    transition: box-shadow var(--el-transition-duration);

    &:focus-within {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  .spec-tag-selector__value-prefix {
    display: contents;
  }

  .spec-tag-selector__value-native {
    box-sizing: border-box;
    flex: 1 1 96px;
    min-width: 96px;
    height: 24px;
    padding: 0;
    font-size: 14px;
    line-height: 24px;
    color: var(--el-text-color-primary);
    background: transparent;
    border: 0;
    outline: 0;
  }

  .spec-tag-selector__value-native.is-empty {
    min-width: 140px;
  }

  .spec-tag-selector__selected-tag {
    --el-tag-bg-color: #d9e3ff;
    --el-tag-border-color: #d9e3ff;
    --el-tag-text-color: var(--el-text-color-primary);

    font-weight: 400;
  }

  .spec-tag-selector__preset-tag {
    min-height: 24px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 400;
    line-height: 24px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: #f7f8fa;
    border: 1px solid #e7eaf0;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .spec-tag-selector__preset-tag:hover {
    color: var(--el-text-color-primary);
    background: #eef2fb;
    border-color: #d7e1ff;
  }

  .spec-tag-selector__preset-tag.is-active {
    font-weight: 500;
    color: var(--el-text-color-primary);
    background: #dce5ff;
    border-color: #b8caff;
  }

  :deep(.spec-tag-selector__selected-tag.el-tag) {
    height: 24px;
    padding: 0 8px;
    font-size: 13px;
    line-height: 24px;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  :deep(.spec-tag-selector__selected-tag .el-tag__close) {
    color: var(--el-text-color-primary);
  }

  :deep(.spec-tag-selector__selected-tag .el-tag__close:hover) {
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, #000 8%, #d9e3ff);
  }
</style>
