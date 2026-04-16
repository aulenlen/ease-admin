<template>
  <div class="flash-product-search">
    <EaseTableSearch columns="140px 260px 140px">
      <ElInput
        :model-value="localSessionIdText"
        placeholder="场次 ID"
        @update:model-value="updateNumberField('sessionId', $event)"
        @keyup.enter="commitSearch"
      />

      <ElInput v-model="localForm.keyword" placeholder="搜索商品关键词" @keyup.enter="commitSearch">
        <template #suffix>
          <span class="ease-table-search__keyword-suffix">
            <ElIcon
              v-if="localForm.keyword"
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="clearKeyword"
            >
              <CircleCloseFilled />
            </ElIcon>
            <ElIcon
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="commitSearch"
            >
              <Search />
            </ElIcon>
          </span>
        </template>
      </ElInput>

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
  import type { FlashRouteType } from '@/api/flash'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import { getFlashRouteTypeText } from './flash-utils'

  export interface FlashProductSearchForm {
    sessionId?: number
    keyword?: string
    brandId?: number
    categoryId?: number
    spuId?: number
    skuId?: number
    routeType?: FlashRouteType
  }

  interface Props {
    modelValue: FlashProductSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: FlashProductSearchForm): void
    (e: 'search', value: FlashProductSearchForm): void
  }>()

  const createLocalForm = (value: FlashProductSearchForm): FlashProductSearchForm => ({
    sessionId: value.sessionId ?? undefined,
    keyword: value.keyword ?? undefined,
    brandId: value.brandId ?? undefined,
    categoryId: value.categoryId ?? undefined,
    spuId: value.spuId ?? undefined,
    skuId: value.skuId ?? undefined,
    routeType: value.routeType ?? undefined
  })

  const localForm = reactive<FlashProductSearchForm>(createLocalForm(props.modelValue))
  const syncingFromParent = ref(false)
  const lastCommittedKey = ref('')

  const localSessionIdText = computed(() =>
    localForm.sessionId !== undefined ? String(localForm.sessionId) : ''
  )

  const createSearchKey = (value: FlashProductSearchForm) => JSON.stringify(value)

  const buildSearchPayload = (): FlashProductSearchForm => ({
    sessionId: localForm.sessionId,
    keyword: String(localForm.keyword || '').trim() || undefined,
    routeType: localForm.routeType ?? undefined
  })

  const commitSearch = () => {
    const payload = buildSearchPayload()
    const searchKey = createSearchKey(payload)

    if (searchKey === lastCommittedKey.value) return

    lastCommittedKey.value = searchKey
    emit('update:modelValue', payload)
    emit('search', payload)
  }

  const clearKeyword = () => {
    localForm.keyword = undefined
    commitSearch()
  }

  const toOptionalNumber = (value: unknown) => {
    const normalized = String(value ?? '').trim()
    if (!normalized) return undefined

    const next = Number(normalized)
    return Number.isNaN(next) ? undefined : next
  }

  const updateNumberField = (key: 'sessionId', value: string | number | null | undefined) => {
    localForm[key] = toOptionalNumber(value)
  }

  const syncLocalForm = (value: FlashProductSearchForm) => {
    localForm.sessionId = value.sessionId ?? undefined
    localForm.keyword = value.keyword ?? undefined
    localForm.routeType = value.routeType ?? undefined
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof FlashProductSearchForm; label: string }> = []

    if (localForm.sessionId !== undefined) {
      filters.push({ key: 'sessionId', label: `场次：#${localForm.sessionId}` })
    }

    if (localForm.keyword) {
      filters.push({ key: 'keyword', label: `关键词：${localForm.keyword}` })
    }

    if (localForm.routeType !== undefined) {
      filters.push({
        key: 'routeType',
        label: `类型：${getFlashRouteTypeText(localForm.routeType)}`
      })
    }

    return filters
  })

  const removeFilter = (key: keyof FlashProductSearchForm) => {
    localForm[key] = undefined
    commitSearch()
  }

  watch(
    () => props.modelValue,
    async (value) => {
      syncingFromParent.value = true
      syncLocalForm(value)
      lastCommittedKey.value = createSearchKey(buildSearchPayload())
      await nextTick()
      syncingFromParent.value = false
    },
    {
      deep: true,
      immediate: true
    }
  )

  watch(
    () => [localForm.routeType ?? null],
    () => {
      if (syncingFromParent.value) return
      commitSearch()
    }
  )
</script>
