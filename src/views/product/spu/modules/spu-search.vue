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
    (e: 'reset'): void
  }>()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const categoryCascaderOptions = computed(() => {
    const walk = (items: CategoryTreeItem[]): any[] =>
      items.map((item) => ({
        label: item.name,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined
      }))

    return walk(props.categoryOptions || [])
  })

  const formItems = computed(() => [
    {
      label: '关键词',
      labelWidth: '56px',
      key: 'keyword',
      type: 'input',
      span: 6,
      props: {
        placeholder: '请输入商品名称或编码',
        clearable: true
      }
    },
    {
      label: '分类',
      labelWidth: '56px',
      key: 'categoryId',
      type: 'cascader',
      span: 6,
      props: {
        placeholder: '请选择商品分类',
        clearable: true,
        filterable: true,
        options: categoryCascaderOptions.value,
        props: {
          checkStrictly: true,
          emitPath: true,
          value: 'value',
          label: 'label',
          children: 'children'
        }
      }
    },
    {
      label: '品牌',
      labelWidth: '56px',
      key: 'brandId',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择品牌',
        clearable: true,
        filterable: true,
        options: props.brandOptions.map((item) => ({
          label: item.name,
          value: item.id
        }))
      }
    }
  ])

  const handleSearch = async (params: SpuSearchForm) => {
    await searchBarRef.value?.validate?.()
    emit('search', params)
  }
</script>
