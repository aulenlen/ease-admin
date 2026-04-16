<template>
  <div class="flash-session-search">
    <EaseTableSearch columns="260px 160px 360px">
      <ElInput v-model="localForm.name" placeholder="搜索场次名称" @keyup.enter="commitSearch">
        <template #suffix>
          <span class="ease-table-search__keyword-suffix">
            <ElIcon
              v-if="localForm.name"
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="clearName"
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

      <ElSelect v-model="localForm.sessionStatus" placeholder="场次状态" clearable>
        <ElOption label="启用" :value="1" />
        <ElOption label="禁用" :value="0" />
      </ElSelect>

      <ElDatePicker
        v-model="localForm.timeRange"
        type="datetimerange"
        clearable
        unlink-panels
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
      />

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
  import type { FlashSessionStatus } from '@/api/flash'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'

  export type FlashSessionTimeRange = [string, string] | []

  export interface FlashSessionSearchForm {
    name?: string
    sessionStatus?: FlashSessionStatus
    timeRange?: FlashSessionTimeRange
  }

  interface Props {
    modelValue: FlashSessionSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: FlashSessionSearchForm): void
    (e: 'search', value: FlashSessionSearchForm): void
  }>()

  const createLocalForm = (value: FlashSessionSearchForm): FlashSessionSearchForm => ({
    name: value.name ?? undefined,
    sessionStatus: value.sessionStatus ?? undefined,
    timeRange: value.timeRange?.length ? [...value.timeRange] : []
  })

  const localForm = reactive<FlashSessionSearchForm>(createLocalForm(props.modelValue))
  const syncingFromParent = ref(false)
  const lastCommittedKey = ref('')

  const createSearchKey = (value: FlashSessionSearchForm) => JSON.stringify(value)

  const buildSearchPayload = (): FlashSessionSearchForm => ({
    name: String(localForm.name || '').trim() || undefined,
    sessionStatus: localForm.sessionStatus ?? undefined,
    timeRange: localForm.timeRange?.length ? [...localForm.timeRange] : []
  })

  const commitSearch = () => {
    const payload = buildSearchPayload()
    const searchKey = createSearchKey(payload)

    if (searchKey === lastCommittedKey.value) return

    lastCommittedKey.value = searchKey
    emit('update:modelValue', payload)
    emit('search', payload)
  }

  const clearName = () => {
    localForm.name = undefined
    commitSearch()
  }

  const syncLocalForm = (value: FlashSessionSearchForm) => {
    localForm.name = value.name ?? undefined
    localForm.sessionStatus = value.sessionStatus ?? undefined
    localForm.timeRange = value.timeRange?.length ? [...value.timeRange] : []
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof FlashSessionSearchForm; label: string }> = []

    if (localForm.name) {
      filters.push({ key: 'name', label: `场次：${localForm.name}` })
    }

    if (localForm.sessionStatus !== undefined) {
      filters.push({
        key: 'sessionStatus',
        label: `状态：${localForm.sessionStatus === 1 ? '启用' : '禁用'}`
      })
    }

    if (localForm.timeRange?.length) {
      filters.push({
        key: 'timeRange',
        label: `时间：${localForm.timeRange.join(' 至 ')}`
      })
    }

    return filters
  })

  const removeFilter = (key: keyof FlashSessionSearchForm) => {
    if (key === 'name') localForm.name = undefined
    if (key === 'sessionStatus') localForm.sessionStatus = undefined
    if (key === 'timeRange') localForm.timeRange = []

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
    () => [
      localForm.sessionStatus ?? null,
      localForm.timeRange?.[0] ?? null,
      localForm.timeRange?.[1] ?? null
    ],
    () => {
      if (syncingFromParent.value) return
      commitSearch()
    }
  )
</script>
