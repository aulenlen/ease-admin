<template>
  <div class="inventory-search">
    <EaseTableSearch columns="268px 140px 140px 140px auto">
      <ElInput
        v-model="keywordDraft"
        placeholder="搜索商品名称 / SKU 编码"
        @keyup.enter="triggerSearch"
      >
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
          :key="item.value"
          :label="item.label"
          :value="Number(item.value)"
        />
      </ElSelect>

      <ElSelect v-model="formData.stockStatus" placeholder="库存状态" clearable>
        <ElOption
          v-for="item in props.stockStatusOptions"
          :key="item.value"
          :label="item.label"
          :value="Number(item.value)"
        />
      </ElSelect>

      <ElCheckbox v-model="lowStockWarningDraft" @change="triggerSearch">只看低库存</ElCheckbox>

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
  import type { StockStatus, OptionItem } from '@/api/sku-stock'
  import type { CategoryTreeItem } from '@/api/category'

  export interface InventorySearchForm {
    keyword?: string
    brandId?: number
    categoryId?: number[]
    stockStatus?: StockStatus
    lowStockWarning?: boolean
  }

  type FilterKey = keyof Pick<
    InventorySearchForm,
    'keyword' | 'brandId' | 'categoryId' | 'stockStatus' | 'lowStockWarning'
  >

  const props = defineProps<{
    modelValue: InventorySearchForm
    brandOptions: OptionItem[]
    categoryOptions: CategoryTreeItem[]
    stockStatusOptions: OptionItem[]
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: InventorySearchForm): void
    (e: 'search', value: InventorySearchForm): void
  }>()

  const keywordDraft = ref(props.modelValue.keyword ?? '')
  const lowStockWarningDraft = ref(Boolean(props.modelValue.lowStockWarning))
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
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
  const brandNameMap = computed(
    () => new Map(props.brandOptions.map((item) => [Number(item.value), item.label]))
  )
  const stockStatusNameMap = computed(
    () => new Map(props.stockStatusOptions.map((item) => [Number(item.value), item.label]))
  )

  const buildSearchPayload = (): InventorySearchForm => ({
    keyword: keywordDraft.value.trim() || undefined,
    brandId: formData.value.brandId ?? undefined,
    categoryId: formData.value.categoryId?.length ? [...formData.value.categoryId] : undefined,
    stockStatus: formData.value.stockStatus ?? undefined,
    lowStockWarning: lowStockWarningDraft.value || undefined
  })

  const triggerSearch = async () => {
    formData.value.keyword = keywordDraft.value.trim() || undefined
    formData.value.lowStockWarning = lowStockWarningDraft.value || undefined
    emit('search', buildSearchPayload())
  }

  const categoryCascaderOptions = computed(() => {
    const walk = (
      items: CategoryTreeItem[]
    ): Array<{ label: string; value: number; children?: any[] }> =>
      items.map((item) => ({
        label: item.name,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined
      }))

    return walk(props.categoryOptions || [])
  })

  const activeFilters = computed(() => {
    const filters: Array<{ key: FilterKey; label: string }> = []

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

    const stockStatusLabel =
      formData.value.stockStatus !== undefined
        ? stockStatusNameMap.value.get(formData.value.stockStatus)
        : ''
    if (stockStatusLabel) {
      filters.push({
        key: 'stockStatus',
        label: `库存状态：${stockStatusLabel}`
      })
    }

    if (formData.value.lowStockWarning) {
      filters.push({
        key: 'lowStockWarning',
        label: '低库存：只看低库存'
      })
    }

    return filters
  })

  const removeFilter = async (key: FilterKey) => {
    if (key === 'keyword') {
      keywordDraft.value = ''
      formData.value.keyword = undefined
    } else if (key === 'brandId') {
      formData.value.brandId = undefined
    } else if (key === 'categoryId') {
      formData.value.categoryId = undefined
    } else if (key === 'stockStatus') {
      formData.value.stockStatus = undefined
    } else if (key === 'lowStockWarning') {
      lowStockWarningDraft.value = false
      formData.value.lowStockWarning = undefined
    }

    await triggerSearch()
  }

  let initializedFilterWatch = false

  watch(
    () => [
      formData.value.categoryId?.join(',') ?? '',
      formData.value.brandId ?? null,
      formData.value.stockStatus ?? null,
      lowStockWarningDraft.value
    ],
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

  watch(
    () => props.modelValue.lowStockWarning,
    (value) => {
      lowStockWarningDraft.value = Boolean(value)
    }
  )

  const categoryCascaderProps = {
    checkStrictly: true,
    emitPath: true,
    value: 'value',
    label: 'label',
    children: 'children'
  }
</script>
