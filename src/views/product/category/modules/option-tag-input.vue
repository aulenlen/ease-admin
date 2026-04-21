<template>
  <div class="option-tag-input">
    <VueDraggable
      v-if="tags.length"
      :model-value="tags"
      tag="div"
      class="option-tag-input__list"
      handle=".option-tag-input__tag"
      :animation="180"
      @update:model-value="handleSortUpdate"
    >
      <div v-for="option in tags" :key="option" class="option-tag-input__tag">
        <span class="option-tag-input__tag-label">{{ option }}</span>
        <span class="option-tag-input__tag-close" @click.stop="removeOption(option)">×</span>
      </div>
    </VueDraggable>

    <button v-if="!editing" type="button" class="option-tag-input__adder" @click="openEditor">
      <ElIcon><Plus /></ElIcon>
      <span>{{ resolvedAddLabel }}</span>
    </button>

    <div v-else class="option-tag-input__editor" @click.stop>
      <input
        ref="inputRef"
        v-model.trim="inputValue"
        type="text"
        class="option-tag-input__native"
        :placeholder="resolvedInputPlaceholder"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Plus } from '@element-plus/icons-vue'
  import { VueDraggable } from 'vue-draggable-plus'

  interface Props {
    modelValue?: string[]
    placeholder?: string
    addLabel?: string
    inputPlaceholder?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    placeholder: '',
    addLabel: '',
    inputPlaceholder: ''
  })

  const emit = defineEmits<Emits>()

  const inputRef = ref<HTMLInputElement>()
  const inputValue = ref('')
  const editing = ref(false)

  const tags = computed(() =>
    Array.from(
      new Set((props.modelValue || []).map((item) => String(item || '').trim()).filter(Boolean))
    )
  )

  const resolvedAddLabel = computed(() => props.addLabel || '添加选项')
  const resolvedInputPlaceholder = computed(
    () => props.inputPlaceholder || props.placeholder || '输入后按回车或逗号添加'
  )

  function parseTokens(value?: string) {
    return String(value || '')
      .split(/[\n,，;；/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function openEditor() {
    editing.value = true
    nextTick(() => inputRef.value?.focus())
  }

  function closeEditor() {
    editing.value = false
    inputValue.value = ''
  }

  function commitInput() {
    const tokens = parseTokens(inputValue.value)
    if (!tokens.length) return
    emit('update:modelValue', Array.from(new Set([...tags.value, ...tokens])))
    inputValue.value = ''
  }

  function handleBlur() {
    commitInput()
    closeEditor()
  }

  function removeOption(option: string) {
    emit(
      'update:modelValue',
      tags.value.filter((item) => item !== option)
    )
  }

  function handleSortUpdate(value: string[]) {
    emit('update:modelValue', value.map((item) => String(item || '').trim()).filter(Boolean))
  }

  function handleKeydown(event: Event | KeyboardEvent) {
    if (!(event instanceof KeyboardEvent)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      closeEditor()
      return
    }

    const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete'
    if (isDeleteKey && !inputValue.value.trim() && tags.value.length) {
      event.preventDefault()
      removeOption(tags.value[tags.value.length - 1])
      return
    }

    if (event.key !== 'Enter' && event.key !== ',' && event.key !== '，') return
    event.preventDefault()
    commitInput()
  }
</script>

<style scoped lang="scss">
  .option-tag-input {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    width: 100%;
  }

  .option-tag-input__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .option-tag-input__tag {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    font: inherit;
    color: var(--el-text-color-regular);
    cursor: default;
    background: #f7f8fa;
    border: 1px solid #e7eaf0;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .option-tag-input__tag-label {
    font-size: 13px;
    line-height: 24px;
  }

  .option-tag-input__tag-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 15px;
    line-height: 1;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    border-radius: 999px;
    transition:
      color 0.18s ease,
      background-color 0.18s ease;
  }

  .option-tag-input__tag-close:hover {
    color: var(--el-text-color-primary);
    background: rgb(0 0 0 / 5%);
  }

  .option-tag-input__adder,
  .option-tag-input__editor {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-width: 116px;
    min-height: 24px;
    padding: 0 10px;
    background: var(--el-bg-color);
    border: 1px dashed var(--el-border-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .option-tag-input__adder {
    font: inherit;
    color: var(--el-text-color-regular);
    cursor: pointer;
  }

  .option-tag-input__adder:hover,
  .option-tag-input__editor:focus-within {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
  }

  .option-tag-input__native {
    flex: 1;
    min-width: 0;
    padding: 0;
    font-size: 13px;
    line-height: 24px;
    color: var(--el-text-color-primary);
    background: transparent;
    border: 0;
    outline: 0;
  }

  .option-tag-input__native::placeholder {
    color: var(--el-text-color-placeholder);
  }
</style>
