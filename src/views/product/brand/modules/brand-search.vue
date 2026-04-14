<template>
  <div class="brand-search">
    <EaseTableSearch columns="268px 140px 140px">
      <ElInput v-model="keywordDraft" placeholder="搜索品牌名称" @keyup.enter="triggerSearch">
        <template #suffix>
          <span class="ease-table-search__keyword-suffix">
            <ElIcon
              v-if="keywordDraft"
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="keywordDraft = ''"
            >
              <CircleCloseFilled />
            </ElIcon>
            <ElIcon
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="triggerSearch"
            >
              <Search />
            </ElIcon>
          </span>
        </template>
      </ElInput>

      <ElSelect v-model="formData.showStatus" placeholder="显示状态" clearable>
        <ElOption label="显示" :value="1" />
        <ElOption label="隐藏" :value="0" />
      </ElSelect>

      <ElSelect v-model="formData.factoryStatus" placeholder="制造商" clearable>
        <ElOption label="是" :value="1" />
        <ElOption label="否" :value="0" />
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
  import { CircleCloseFilled, Search } from '@element-plus/icons-vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import type { BrandFlag01 } from '@/api/brand'

  export interface BrandSearchForm {
    keyword?: string
    showStatus?: BrandFlag01
    factoryStatus?: BrandFlag01
  }

  interface Props {
    modelValue: BrandSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: BrandSearchForm): void
    (e: 'search', value: BrandSearchForm): void
  }>()

  const keywordDraft = ref(props.modelValue.keyword ?? '')
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const statusLabelMap = new Map<BrandFlag01, string>([
    [1, '显示'],
    [0, '隐藏']
  ])

  const factoryLabelMap = new Map<BrandFlag01, string>([
    [1, '是'],
    [0, '否']
  ])

  const buildSearchPayload = (): BrandSearchForm => ({
    keyword: keywordDraft.value.trim() || undefined,
    showStatus: formData.value.showStatus ?? undefined,
    factoryStatus: formData.value.factoryStatus ?? undefined
  })

  const triggerSearch = async () => {
    formData.value.keyword = keywordDraft.value.trim() || undefined
    emit('search', buildSearchPayload())
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof BrandSearchForm; label: string }> = []

    if (formData.value.keyword) {
      filters.push({
        key: 'keyword',
        label: `关键词：${formData.value.keyword}`
      })
    }

    if (formData.value.showStatus !== undefined) {
      filters.push({
        key: 'showStatus',
        label: `显示状态：${statusLabelMap.get(formData.value.showStatus) || '-'}`
      })
    }

    if (formData.value.factoryStatus !== undefined) {
      filters.push({
        key: 'factoryStatus',
        label: `制造商：${factoryLabelMap.get(formData.value.factoryStatus) || '-'}`
      })
    }

    return filters
  })

  const removeFilter = (key: keyof BrandSearchForm) => {
    if (key === 'keyword') {
      keywordDraft.value = ''
      formData.value.keyword = undefined
      triggerSearch()
      return
    }

    if (key === 'showStatus') {
      formData.value.showStatus = undefined
      return
    }

    formData.value.factoryStatus = undefined
  }

  let initializedFilterWatch = false

  watch(
    () => [formData.value.showStatus ?? null, formData.value.factoryStatus ?? null],
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
