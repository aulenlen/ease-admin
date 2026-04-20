<template>
  <ElSelect
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :loading="loading"
    filterable
    remote
    reserve-keyword
    default-first-option
    class="w-full"
    :remote-method="handleSearch"
    @visible-change="handleVisibleChange"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption v-for="option in options" :key="option.id" :label="option.title" :value="option.id">
      <div class="flex min-w-0 flex-col gap-1 py-1">
        <span class="truncate text-sm">{{ option.title }}</span>
        <span class="truncate text-xs text-[var(--el-text-color-secondary)]">
          {{ [option.author, option.statusLabel, option.publishDate].filter(Boolean).join(' · ') }}
        </span>
      </div>
    </ElOption>
  </ElSelect>
</template>

<script setup lang="ts">
  import {
    ARTICLE_STATUS_OPTIONS,
    fetchArticlePage,
    getArticle,
    type ArticleDetailItem,
    type ArticleListItem
  } from '@/api/article'

  interface Props {
    modelValue?: number
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
  }

  interface ArticleOption {
    id: number
    title: string
    author?: string
    statusLabel?: string
    publishDate?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: undefined,
    placeholder: '搜索并选择文章',
    disabled: false,
    clearable: true
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value?: number): void
  }>()

  const loading = ref(false)
  const options = ref<ArticleOption[]>([])

  const statusLabelMap = new Map<number, string>(
    ARTICLE_STATUS_OPTIONS.map((item) => [item.value, item.label])
  )

  const toOption = (item: ArticleListItem | ArticleDetailItem): ArticleOption => ({
    id: item.id,
    title: item.title || `文章 #${item.id}`,
    author: item.author,
    statusLabel: statusLabelMap.get(Number(item.status)) || '',
    publishDate: item.publishTime?.slice(0, 10)
  })

  async function loadOptions(keyword = '') {
    loading.value = true
    try {
      const res = await fetchArticlePage({
        current: 1,
        size: 20,
        keyword: keyword.trim() || undefined
      })
      options.value = res.records.map(toOption)
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  async function ensureCurrentOption(id?: number) {
    if (!id || options.value.some((item) => item.id === id)) return

    try {
      const detail = await getArticle(id)
      options.value = [toOption(detail), ...options.value]
    } catch {
      // ignore
    }
  }

  function handleSearch(keyword: string) {
    void loadOptions(keyword)
  }

  function handleVisibleChange(visible: boolean) {
    if (visible && options.value.length === 0) {
      void loadOptions()
    }
  }

  watch(
    () => props.modelValue,
    (value) => {
      void ensureCurrentOption(value)
    },
    { immediate: true }
  )
</script>
