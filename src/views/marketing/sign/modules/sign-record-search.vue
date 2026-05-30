<template>
  <div class="sign-record-search">
    <EaseTableSearch columns="220px 160px 300px">
      <ElInput
        v-model="localForm.memberId"
        placeholder="会员ID"
        clearable
        @keyup.enter="triggerSearch"
      />

      <ElSelect v-model="localForm.rewardStatus" placeholder="奖励状态" clearable>
        <ElOption label="待处理" :value="0" />
        <ElOption label="已处理" :value="1" />
        <ElOption label="处理失败" :value="2" />
      </ElSelect>

      <ElDatePicker
        v-model="localForm.dateRange"
        type="daterange"
        clearable
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />
    </EaseTableSearch>
  </div>
</template>
<script setup lang="ts">
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import type { SignRewardStatus } from '@/api/sign'

  export type SignRecordDateRange = [string, string] | []

  export interface SignRecordSearchForm {
    memberId?: string
    rewardStatus?: SignRewardStatus
    dateRange: SignRecordDateRange
  }

  interface Props {
    modelValue: SignRecordSearchForm
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: SignRecordSearchForm): void
    (e: 'search', value: SignRecordSearchForm): void
  }>()

  const localForm = reactive<SignRecordSearchForm>({
    memberId: props.modelValue.memberId,
    rewardStatus: props.modelValue.rewardStatus,
    dateRange: props.modelValue.dateRange || []
  })

  function buildPayload(): SignRecordSearchForm {
    return {
      memberId: String(localForm.memberId || '').trim() || undefined,
      rewardStatus: localForm.rewardStatus ?? undefined,
      dateRange: localForm.dateRange?.length ? [...localForm.dateRange] : []
    }
  }

  function triggerSearch() {
    const payload = buildPayload()
    emit('update:modelValue', payload)
    emit('search', payload)
  }

  watch(
    () => [
      localForm.rewardStatus ?? null,
      localForm.dateRange?.[0] ?? null,
      localForm.dateRange?.[1] ?? null
    ],
    () => {
      triggerSearch()
    }
  )
</script>
