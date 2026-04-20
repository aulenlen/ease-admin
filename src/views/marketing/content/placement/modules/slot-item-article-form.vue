<template>
  <ElForm :model="form" label-position="top" class="slot-item-form">
    <ElFormItem label="关联文章" required>
      <SlotItemArticleSelect v-model="form.articleId" />
    </ElFormItem>

    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElFormItem label="排序值">
          <ElInputNumber
            v-model="form.sort"
            :min="0"
            placeholder="越小越靠前"
            class="w-full"
            controls-position="right"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="状态">
          <ElSwitch
            :model-value="Number(form.status ?? SLOT_STATUS.ENABLED) === SLOT_STATUS.ENABLED"
            active-text="启用"
            inactive-text="禁用"
            @change="(value) => (form.status = value ? SLOT_STATUS.ENABLED : SLOT_STATUS.DISABLED)"
          />
        </ElFormItem>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElFormItem label="生效开始时间">
          <ElDatePicker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disableStartDate"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生效结束时间">
          <ElDatePicker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disableEndDate"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
    </ElRow>

    <ElFormItem label="备注">
      <ElInput
        v-model="form.note"
        type="textarea"
        :rows="2"
        maxlength="255"
        show-word-limit
        placeholder="备注信息"
      />
    </ElFormItem>
  </ElForm>
</template>

<script setup lang="ts">
  import { SLOT_STATUS, type SlotItem } from '@/api/slot'
  import SlotItemArticleSelect from './slot-item-article-select.vue'

  defineOptions({ name: 'SlotItemArticleForm' })

  interface Props {
    form: SlotItem
  }

  const props = defineProps<Props>()
  const form = computed(() => props.form)

  function toDayStart(value?: string) {
    if (!value) return null
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) return null
    const date = new Date(time)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }

  function disableStartDate(date: Date) {
    const endDay = toDayStart(form.value.endTime)
    if (endDay === null) return false
    return date.getTime() > endDay
  }

  function disableEndDate(date: Date) {
    const startDay = toDayStart(form.value.startTime)
    if (startDay === null) return false
    return date.getTime() < startDay
  }

  function validate(): true | string {
    const value = form.value
    if (!value.articleId) return '请选择关联文章'

    if (value.startTime && value.endTime) {
      if (new Date(value.startTime).getTime() > new Date(value.endTime).getTime()) {
        return '生效结束时间不能早于开始时间'
      }
    }

    return true
  }

  defineExpose({ validate })
</script>
