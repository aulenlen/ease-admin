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
    <ElOption v-for="option in options" :key="option.id" :label="option.name" :value="option.id">
      <div class="flex min-w-0 items-center gap-3 py-1">
        <ElImage v-if="option.pic" :src="option.pic" fit="cover" class="h-10 w-10 shrink-0" />
        <div
          v-else
          class="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--el-fill-color-light)] text-[var(--el-text-color-placeholder)]"
        >
          <i class="ri-image-line text-base" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm">{{ option.name }}</div>
          <div class="truncate text-xs text-[var(--el-text-color-secondary)]">
            {{
              [option.categoryName, option.brandName, option.priceText].filter(Boolean).join(' · ')
            }}
          </div>
        </div>
      </div>
    </ElOption>
  </ElSelect>
</template>

<script setup lang="ts">
  import { fetchSpuPage, getSpu, type SpuDetailItem, type SpuListItem } from '@/api/spu'

  interface Props {
    modelValue?: number
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
  }

  interface SpuOption {
    id: number
    name: string
    pic?: string
    brandName?: string
    categoryName?: string
    priceText?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: undefined,
    placeholder: '搜索并选择商品',
    disabled: false,
    clearable: true
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value?: number): void
  }>()

  const loading = ref(false)
  const options = ref<SpuOption[]>([])

  function formatPrice(min?: number, max?: number) {
    const hasMin = typeof min === 'number' && min > 0
    const hasMax = typeof max === 'number' && max > 0

    if (!hasMin && !hasMax) return ''
    if (hasMin && hasMax && min !== max) return `¥${min} - ¥${max}`
    return `¥${hasMin ? min : max}`
  }

  function toOption(item: SpuListItem | SpuDetailItem): SpuOption {
    const detailPrice = 'skuStockList' in item ? item.skuStockList?.[0]?.price : undefined
    const minPrice = 'minPrice' in item ? item.minPrice : detailPrice
    const maxPrice = 'maxPrice' in item ? item.maxPrice : detailPrice

    return {
      id: item.id,
      name: item.name || `商品 #${item.id}`,
      pic: item.pic,
      brandName: item.brandName,
      categoryName: item.categoryName,
      priceText: formatPrice(minPrice, maxPrice)
    }
  }

  async function loadOptions(keyword = '') {
    loading.value = true
    try {
      const res = await fetchSpuPage({
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
      const detail = await getSpu(id)
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
