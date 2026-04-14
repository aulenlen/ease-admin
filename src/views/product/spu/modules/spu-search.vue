<template>
  <div class="spu-search">
    <EaseTableSearch columns="268px 140px 140px">
      <ElInput v-model="keywordDraft" placeholder="搜索商品名称或编码" @keyup.enter="triggerSearch">
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

      <ElCascader
        v-model="formData.categoryId"
        placeholder="商品分类"
        clearable
        filterable
        :options="categoryCascaderOptions"
        :props="categoryCascaderProps"
      />

      <ElSelect v-model="formData.brandId" placeholder="商品品牌" clearable filterable>
        <ElOption
          v-for="item in props.brandOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
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
  import { CircleCloseFilled, Search } from '@element-plus/icons-vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import type { BrandListItem } from '@/api/brand'
  import type { CategoryTreeItem } from '@/api/category'

  export interface SpuSearchForm {
    keyword?: string
    brandId?: number
    categoryId?: number[]
  }

  interface Props {
    modelValue: SpuSearchForm
    brandOptions: BrandListItem[]
    categoryOptions: CategoryTreeItem[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: SpuSearchForm): void
    (e: 'search', value: SpuSearchForm): void
  }>()

  const keywordDraft = ref(props.modelValue.keyword ?? '')
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const buildSearchPayload = (): SpuSearchForm => ({
    keyword: keywordDraft.value.trim() || undefined,
    brandId: formData.value.brandId ?? undefined,
    categoryId: formData.value.categoryId?.length ? [...formData.value.categoryId] : undefined
  })

  const triggerSearch = async () => {
    formData.value.keyword = keywordDraft.value.trim() || undefined
    emit('search', buildSearchPayload())
  }

  const categoryCascaderOptions = computed(() => {
    const walk = (items: CategoryTreeItem[]): any[] =>
      items.map((item) => ({
        label: item.name,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined
      }))

    return walk(props.categoryOptions || [])
  })

  const categoryNameMap = computed(() => {
    const map = new Map<number, string>()
    const walk = (items: CategoryTreeItem[]) => {
      items.forEach((item) => {
        map.set(item.id, item.name)
        if (item.children?.length) walk(item.children)
      })
    }

    walk(props.categoryOptions || [])
    return map
  })

  const brandNameMap = computed(() => {
    return new Map(props.brandOptions.map((item) => [item.id, item.name]))
  })

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof SpuSearchForm; label: string }> = []

    if (formData.value.keyword) {
      filters.push({
        key: 'keyword',
        label: `关键词：${formData.value.keyword}`
      })
    }

    const categoryId = formData.value.categoryId?.[formData.value.categoryId.length - 1]
    const categoryLabel = categoryId ? categoryNameMap.value.get(categoryId) : ''
    if (categoryLabel) {
      filters.push({
        key: 'categoryId',
        label: `商品分类：${categoryLabel}`
      })
    }

    const brandLabel = formData.value.brandId ? brandNameMap.value.get(formData.value.brandId) : ''
    if (brandLabel) {
      filters.push({
        key: 'brandId',
        label: `商品品牌：${brandLabel}`
      })
    }

    return filters
  })

  const categoryCascaderProps = {
    checkStrictly: true,
    emitPath: true,
    value: 'value',
    label: 'label',
    children: 'children'
  }

  const removeFilter = (key: keyof SpuSearchForm) => {
    if (key === 'categoryId') {
      formData.value.categoryId = undefined
    } else if (key === 'brandId') {
      formData.value.brandId = undefined
    } else if (key === 'keyword') {
      keywordDraft.value = ''
      formData.value.keyword = undefined
      triggerSearch()
      return
    }
  }

  let initializedFilterWatch = false

  watch(
    () => [formData.value.categoryId?.join(',') ?? '', formData.value.brandId ?? null],
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
