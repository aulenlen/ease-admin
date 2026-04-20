<template>
  <div class="article-search">
    <EaseTableSearch columns="268px 150px">
      <ElInput
        v-model="keywordDraft"
        placeholder="搜索文章标题"
        clearable
        @keyup.enter="triggerSearch"
        @clear="triggerSearch"
      />

      <ElSelect v-model="formData.status" placeholder="状态" clearable>
        <ElOption
          v-for="opt in ARTICLE_STATUS_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <template v-if="activeFilters.length" #filters>
        <ElTag
          v-for="filter in activeFilters"
          :key="filter.key"
          closable
          effect="light"
          @close="removeFilter(filter.key)"
        >
          {{ filter.label }}
        </ElTag>
      </template>
    </EaseTableSearch>
  </div>
</template>

<script setup lang="ts">
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import { ARTICLE_STATUS_OPTIONS, type ArticleStatus } from '@/api/article'

  export interface ArticleSearchForm {
    keyword?: string
    status?: ArticleStatus | ''
  }

  interface Props {
    modelValue: ArticleSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: ArticleSearchForm): void
    (e: 'search', value: ArticleSearchForm): void
  }>()

  const keywordDraft = ref(props.modelValue.keyword ?? '')
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const statusLabelMap = new Map<number, string>(
    ARTICLE_STATUS_OPTIONS.map((opt) => [opt.value, opt.label])
  )

  const buildSearchPayload = (): ArticleSearchForm => ({
    keyword: keywordDraft.value.trim() || undefined,
    status: formData.value.status ?? undefined
  })

  const triggerSearch = async () => {
    formData.value.keyword = keywordDraft.value.trim() || undefined
    emit('search', buildSearchPayload())
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof ArticleSearchForm; label: string }> = []

    if (formData.value.keyword) {
      filters.push({ key: 'keyword', label: `关键词：${formData.value.keyword}` })
    }

    if (formData.value.status !== undefined && formData.value.status !== '') {
      filters.push({
        key: 'status',
        label: `状态：${statusLabelMap.get(formData.value.status) || '-'}`
      })
    }

    return filters
  })

  const removeFilter = (key: keyof ArticleSearchForm) => {
    if (key === 'keyword') {
      keywordDraft.value = ''
      formData.value.keyword = undefined
      void triggerSearch()
      return
    }

    formData.value.status = undefined
  }

  let initializedFilterWatch = false

  watch(
    () => formData.value.status ?? null,
    async () => {
      if (!initializedFilterWatch) {
        initializedFilterWatch = true
        return
      }

      await triggerSearch()
    }
  )

  watch(
    () => props.modelValue.keyword,
    (value) => {
      keywordDraft.value = value ?? ''
    }
  )
</script>
