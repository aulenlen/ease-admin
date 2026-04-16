<template>
  <div class="payment-search">
    <EaseTableSearch columns="260px 240px 140px 140px 320px">
      <ElInput v-model="localForm.paymentNo" placeholder="搜索支付单号" @keyup.enter="commitSearch">
        <template #suffix>
          <span class="ease-table-search__keyword-suffix">
            <ElIcon
              v-if="localForm.paymentNo"
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="clearPaymentNo"
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

      <ElInput v-model="localForm.orderNo" placeholder="搜索订单号" @keyup.enter="commitSearch">
        <template #suffix>
          <span class="ease-table-search__keyword-suffix">
            <ElIcon
              v-if="localForm.orderNo"
              class="ease-table-search__keyword-icon"
              @mousedown.prevent
              @click="clearOrderNo"
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

      <ElSelect v-model="localForm.payChannel" placeholder="支付渠道" clearable>
        <ElOption
          v-for="(label, value) in PAY_CHANNEL_TEXT"
          :key="value"
          :label="label"
          :value="Number(value)"
        />
      </ElSelect>

      <ElSelect v-model="localForm.status" placeholder="支付状态" clearable>
        <ElOption
          v-for="(label, value) in PAYMENT_STATUS_TEXT"
          :key="value"
          :label="label"
          :value="Number(value)"
        />
      </ElSelect>

      <ElDatePicker
        v-model="localForm.createTimeRange"
        type="datetimerange"
        clearable
        unlink-panels
        range-separator="至"
        start-placeholder="创建开始"
        end-placeholder="创建结束"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DDTHH:mm:ss"
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
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import {
    PAY_CHANNEL_TEXT,
    PAYMENT_STATUS_TEXT,
    type PayChannel,
    type PaymentStatus
  } from '@/api/order'

  type PaymentDateRange = [string, string] | []

  export interface PaymentSearchForm {
    paymentNo?: string
    orderNo?: string
    payChannel?: PayChannel
    status?: PaymentStatus
    createTimeRange?: PaymentDateRange
  }

  interface Props {
    modelValue: PaymentSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: PaymentSearchForm): void
    (e: 'search', value: PaymentSearchForm): void
  }>()

  const createLocalForm = (value: PaymentSearchForm): PaymentSearchForm => ({
    paymentNo: value.paymentNo ?? undefined,
    orderNo: value.orderNo ?? undefined,
    payChannel: value.payChannel ?? undefined,
    status: value.status ?? undefined,
    createTimeRange: value.createTimeRange?.length ? [...value.createTimeRange] : []
  })

  const localForm = reactive<PaymentSearchForm>(createLocalForm(props.modelValue))
  const syncingFromParent = ref(false)
  const lastCommittedKey = ref('')

  const createSearchKey = (value: PaymentSearchForm) => JSON.stringify(value)

  const buildSearchPayload = (): PaymentSearchForm => ({
    paymentNo: String(localForm.paymentNo || '').trim() || undefined,
    orderNo: String(localForm.orderNo || '').trim() || undefined,
    payChannel: localForm.payChannel ?? undefined,
    status: localForm.status ?? undefined,
    createTimeRange: localForm.createTimeRange?.length ? [...localForm.createTimeRange] : []
  })

  const syncLocalForm = (value: PaymentSearchForm) => {
    localForm.paymentNo = value.paymentNo ?? undefined
    localForm.orderNo = value.orderNo ?? undefined
    localForm.payChannel = value.payChannel ?? undefined
    localForm.status = value.status ?? undefined
    localForm.createTimeRange = value.createTimeRange?.length ? [...value.createTimeRange] : []
  }

  const commitSearch = () => {
    const payload = buildSearchPayload()
    const searchKey = createSearchKey(payload)

    if (searchKey === lastCommittedKey.value) return

    lastCommittedKey.value = searchKey
    emit('update:modelValue', payload)
    emit('search', payload)
  }

  const clearPaymentNo = () => {
    localForm.paymentNo = undefined
    commitSearch()
  }

  const clearOrderNo = () => {
    localForm.orderNo = undefined
    commitSearch()
  }

  const formatRangeLabel = (range?: PaymentDateRange) => {
    if (!range?.length) return ''
    return `${range[0].replace('T', ' ')} 至 ${range[1].replace('T', ' ')}`
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof PaymentSearchForm; label: string }> = []

    if (localForm.paymentNo) {
      filters.push({ key: 'paymentNo', label: `支付单：${localForm.paymentNo}` })
    }

    if (localForm.orderNo) {
      filters.push({ key: 'orderNo', label: `订单号：${localForm.orderNo}` })
    }

    if (localForm.payChannel !== undefined) {
      filters.push({
        key: 'payChannel',
        label: `渠道：${PAY_CHANNEL_TEXT[localForm.payChannel]}`
      })
    }

    if (localForm.status !== undefined) {
      filters.push({
        key: 'status',
        label: `状态：${PAYMENT_STATUS_TEXT[localForm.status]}`
      })
    }

    if (localForm.createTimeRange?.length) {
      filters.push({
        key: 'createTimeRange',
        label: `创建时间：${formatRangeLabel(localForm.createTimeRange)}`
      })
    }

    return filters
  })

  const removeFilter = (key: keyof PaymentSearchForm) => {
    switch (key) {
      case 'paymentNo':
        localForm.paymentNo = undefined
        break
      case 'orderNo':
        localForm.orderNo = undefined
        break
      case 'payChannel':
        localForm.payChannel = undefined
        break
      case 'status':
        localForm.status = undefined
        break
      case 'createTimeRange':
        localForm.createTimeRange = []
        break
    }

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
      localForm.payChannel ?? null,
      localForm.status ?? null,
      localForm.createTimeRange?.[0] ?? null,
      localForm.createTimeRange?.[1] ?? null
    ],
    () => {
      if (syncingFromParent.value) return
      commitSearch()
    }
  )
</script>
