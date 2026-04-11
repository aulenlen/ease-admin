<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="$emit('reset')"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import type { OptionItem, StockStatus } from '@/api/sku-stock'

  export interface InventorySearchForm {
    keyword?: string
    brandId?: number
    categoryId?: number
    stockStatus?: StockStatus
    lowStockWarning?: boolean
  }

  const props = defineProps<{
    modelValue: InventorySearchForm
    brandOptions: OptionItem[]
    categoryOptions: OptionItem[]
    stockStatusOptions: OptionItem[]
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: InventorySearchForm): void
    (e: 'search', value: InventorySearchForm): void
    (e: 'reset'): void
  }>()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formItems = computed(() => [
    {
      label: '关键词',
      labelWidth: '56px',
      key: 'keyword',
      type: 'input',
      span: 6,
      props: {
        placeholder: '搜索商品 / SKU / 规格',
        clearable: true
      }
    },
    {
      label: '品牌',
      labelWidth: '56px',
      key: 'brandId',
      type: 'select',
      span: 5,
      props: {
        placeholder: '全部品牌',
        clearable: true,
        filterable: true,
        options: props.brandOptions
      }
    },
    {
      label: '分类',
      labelWidth: '56px',
      key: 'categoryId',
      type: 'select',
      span: 5,
      props: {
        placeholder: '全部分类',
        clearable: true,
        filterable: true,
        options: props.categoryOptions
      }
    },
    {
      label: '库存状态',
      labelWidth: '70px',
      key: 'stockStatus',
      type: 'select',
      span: 5,
      props: {
        placeholder: '库存状态',
        clearable: true,
        options: props.stockStatusOptions
      }
    },
    {
      label: '低库存',
      labelWidth: '60px',
      key: 'lowStockWarning',
      type: 'checkbox',
      span: 3,
      props: {
        label: '只看低库存'
      }
    }
  ])

  const handleSearch = async (params: InventorySearchForm) => {
    await searchBarRef.value?.validate?.()
    emit('search', params)
  }
</script>
