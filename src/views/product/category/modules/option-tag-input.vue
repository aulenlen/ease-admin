<template>
  <div class="flex min-w-0 w-full flex-col gap-2">
    <div v-if="tags.length" class="flex min-h-8 w-full flex-wrap content-start items-start gap-2">
      <ElTag
        v-for="option in tags"
        :key="option"
        closable
        effect="plain"
        @close="removeOption(option)"
      >
        {{ option }}
      </ElTag>
    </div>

    <ElInput
      v-model.trim="inputValue"
      class="w-full"
      :placeholder="placeholder"
      @keydown="handleKeydown"
      @blur="commitInput"
    />
  </div>
</template>

<script setup lang="ts">
  interface Props {
    modelValue?: string[]
    placeholder?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    placeholder: '输入后按回车或逗号添加'
  })

  const emit = defineEmits<Emits>()

  const inputValue = ref('')

  const tags = computed(() =>
    (props.modelValue || []).map((item) => String(item || '').trim()).filter(Boolean)
  )

  function parseTokens(value?: string) {
    return String(value || '')
      .split(/[\n,，;；/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function commitInput() {
    const tokens = parseTokens(inputValue.value)
    if (!tokens.length) return
    emit('update:modelValue', Array.from(new Set([...tags.value, ...tokens])))
    inputValue.value = ''
  }

  function removeOption(option: string) {
    emit(
      'update:modelValue',
      tags.value.filter((item) => item !== option)
    )
  }

  function handleKeydown(event: Event | KeyboardEvent) {
    if (!(event instanceof KeyboardEvent)) return
    if (event.key !== 'Enter' && event.key !== ',' && event.key !== '，') return
    event.preventDefault()
    commitInput()
  }
</script>
