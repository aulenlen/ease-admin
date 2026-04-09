<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import type { BrandFlag01 } from '@/api/brand'

  interface BrandSearchForm {
    keyword?: string
    showStatus?: BrandFlag01
    factoryStatus?: BrandFlag01
  }

  interface Props {
    modelValue: BrandSearchForm
  }

  interface Emits {
    (e: 'update:modelValue', value: BrandSearchForm): void
    (e: 'search', params: BrandSearchForm): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

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
        placeholder: '请输入品牌名称关键词',
        clearable: true
      }
    },
    {
      label: '显示状态',
      labelWidth: '70px',
      key: 'showStatus',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择显示状态',
        clearable: true,
        options: [
          { label: '显示', value: 1 },
          { label: '隐藏', value: 0 }
        ]
      }
    },
    {
      label: '制造商',
      labelWidth: '56px',
      key: 'factoryStatus',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择制造商状态',
        clearable: true,
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 }
        ]
      }
    }
  ])

  const handleReset = () => {
    emit('reset')
  }

  const handleSearch = async (params: BrandSearchForm) => {
    await searchBarRef.value?.validate?.()
    emit('search', params)
  }
</script>
