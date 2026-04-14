<template>
  <div class="order-search">
    <EaseTableSearch columns="268px 140px 140px">
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

      <ElSelect v-model="localForm.paymentStatus" placeholder="付款状态" clearable>
        <ElOption
          v-for="(label, value) in PAYMENT_STATUS_TEXT"
          :key="value"
          :label="label"
          :value="Number(value)"
        />
      </ElSelect>

      <ElSelect v-model="localForm.payChannel" placeholder="支付渠道" clearable>
        <ElOption
          v-for="(label, value) in PAY_CHANNEL_TEXT"
          :key="value"
          :label="label"
          :value="Number(value)"
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
  import {
    PAY_CHANNEL_TEXT,
    PAYMENT_STATUS_TEXT,
    type PayChannel,
    type PaymentStatus
  } from '@/api/order'
  import { formatMoney } from './order-status'

  export interface OrderSearchForm {
    orderNo?: string
    receiverPhone?: string
    paymentStatus?: PaymentStatus
    payChannel?: PayChannel
    payAmountMin?: number
    payAmountMax?: number
    createTimeRange?: [string, string] | []
  }

  interface Props {
    modelValue: OrderSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: OrderSearchForm): void
    (e: 'search', value: OrderSearchForm): void
  }>()

  const createLocalForm = (value: OrderSearchForm): OrderSearchForm => ({
    orderNo: value.orderNo ?? undefined,
    receiverPhone: value.receiverPhone ?? undefined,
    paymentStatus: value.paymentStatus ?? undefined,
    payChannel: value.payChannel ?? undefined,
    payAmountMin: value.payAmountMin,
    payAmountMax: value.payAmountMax,
    createTimeRange: value.createTimeRange?.length ? [...value.createTimeRange] : []
  })

  const localForm = reactive<OrderSearchForm>(createLocalForm(props.modelValue))
  const syncingFromParent = ref(false)
  const lastCommittedKey = ref('')

  const createSearchKey = (value: OrderSearchForm) => JSON.stringify(value)

  const buildSearchPayload = (): OrderSearchForm => ({
    orderNo: String(localForm.orderNo || '').trim() || undefined,
    receiverPhone: localForm.receiverPhone,
    paymentStatus: localForm.paymentStatus ?? undefined,
    payChannel: localForm.payChannel ?? undefined,
    payAmountMin: localForm.payAmountMin,
    payAmountMax: localForm.payAmountMax,
    createTimeRange: localForm.createTimeRange?.length ? [...localForm.createTimeRange] : []
  })

  const syncLocalForm = (value: OrderSearchForm) => {
    localForm.orderNo = value.orderNo ?? undefined
    localForm.receiverPhone = value.receiverPhone ?? undefined
    localForm.paymentStatus = value.paymentStatus ?? undefined
    localForm.payChannel = value.payChannel ?? undefined
    localForm.payAmountMin = value.payAmountMin
    localForm.payAmountMax = value.payAmountMax
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

  const clearOrderNo = () => {
    localForm.orderNo = undefined
    commitSearch()
  }

  const activeFilters = computed(() => {
    const filters: Array<{ key: string; label: string }> = []

    if (localForm.orderNo) {
      filters.push({ key: 'orderNo', label: `订单号：${localForm.orderNo}` })
    }
    if (localForm.receiverPhone) {
      filters.push({ key: 'receiverPhone', label: `手机号：${localForm.receiverPhone}` })
    }
    if (localForm.paymentStatus !== undefined) {
      filters.push({
        key: 'paymentStatus',
        label: `付款：${PAYMENT_STATUS_TEXT[localForm.paymentStatus]}`
      })
    }
    if (localForm.payChannel !== undefined) {
      filters.push({
        key: 'payChannel',
        label: `渠道：${PAY_CHANNEL_TEXT[localForm.payChannel]}`
      })
    }
    if (localForm.payAmountMin !== undefined) {
      filters.push({
        key: 'payAmountMin',
        label: `最低金额：${formatMoney(localForm.payAmountMin)}`
      })
    }
    if (localForm.payAmountMax !== undefined) {
      filters.push({
        key: 'payAmountMax',
        label: `最高金额：${formatMoney(localForm.payAmountMax)}`
      })
    }
    if (localForm.createTimeRange?.length) {
      filters.push({
        key: 'createTimeRange',
        label: `时间：${localForm.createTimeRange.join(' 至 ')}`
      })
    }

    return filters
  })

  const removeFilter = (key: string) => {
    switch (key) {
      case 'orderNo':
        localForm.orderNo = undefined
        break
      case 'receiverPhone':
        localForm.receiverPhone = undefined
        break
      case 'paymentStatus':
        localForm.paymentStatus = undefined
        break
      case 'payChannel':
        localForm.payChannel = undefined
        break
      case 'payAmountMin':
        localForm.payAmountMin = undefined
        break
      case 'payAmountMax':
        localForm.payAmountMax = undefined
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
    () => [localForm.paymentStatus ?? null, localForm.payChannel ?? null],
    () => {
      if (syncingFromParent.value) return
      commitSearch()
    }
  )
</script>
