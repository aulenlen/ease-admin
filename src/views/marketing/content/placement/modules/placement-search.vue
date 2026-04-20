<template>
  <div class="placement-search">
    <EaseTableSearch columns="220px 180px 180px 140px">
      <ElInput v-model="formData.keyword" placeholder="搜索内容位名称或编码" clearable />

      <ElInput v-model="formData.pageCode" placeholder="页面编码" clearable />

      <ElSelect v-model="formData.renderType" placeholder="渲染类型" clearable>
        <ElOption
          v-for="option in SLOT_RENDER_TYPE_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>

      <ElSelect v-model="formData.status" placeholder="状态" clearable>
        <ElOption
          v-for="option in statusOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
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
  import { SLOT_RENDER_TYPE_OPTIONS, getSlotRenderTypeLabel, type SlotStatus } from '@/api/slot'

  export interface PlacementSearchForm {
    keyword?: string
    pageCode?: string
    renderType?: string
    status?: SlotStatus | ''
  }

  interface Props {
    modelValue: PlacementSearchForm
  }

  const statusOptions = [
    { value: 1, label: '启用' },
    { value: 0, label: '禁用' }
  ]

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: PlacementSearchForm): void
    (e: 'search', value: PlacementSearchForm): void
  }>()

  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof PlacementSearchForm; label: string }> = []

    if (formData.value.keyword?.trim()) {
      filters.push({
        key: 'keyword',
        label: `关键词：${formData.value.keyword.trim()}`
      })
    }

    if (formData.value.pageCode?.trim()) {
      filters.push({
        key: 'pageCode',
        label: `页面：${formData.value.pageCode.trim()}`
      })
    }

    if (formData.value.renderType?.trim()) {
      filters.push({
        key: 'renderType',
        label: `渲染：${getSlotRenderTypeLabel(formData.value.renderType.trim())}`
      })
    }

    if (formData.value.status !== undefined && formData.value.status !== '') {
      filters.push({
        key: 'status',
        label: `状态：${formData.value.status === 1 ? '启用' : '禁用'}`
      })
    }

    return filters
  })

  const triggerSearch = () => {
    emit('search', {
      keyword: formData.value.keyword?.trim() || undefined,
      pageCode: formData.value.pageCode?.trim() || undefined,
      renderType: formData.value.renderType?.trim() || undefined,
      status: formData.value.status ?? undefined
    })
  }

  const removeFilter = (key: keyof PlacementSearchForm) => {
    formData.value[key] = undefined
    triggerSearch()
  }

  let initialized = false

  watch(
    () => [
      formData.value.keyword ?? '',
      formData.value.pageCode ?? '',
      formData.value.renderType ?? '',
      formData.value.status ?? null
    ],
    () => {
      if (!initialized) {
        initialized = true
        return
      }

      triggerSearch()
    }
  )
</script>
