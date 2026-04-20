<template>
  <ElForm :model="form" label-position="top" class="slot-item-form">
    <ElFormItem label="标题">
      <ElInput v-model="form.title" placeholder="请输入标题" maxlength="255" show-word-limit />
    </ElFormItem>

    <ElFormItem label="副标题">
      <ElInput v-model="form.subTitle" placeholder="请输入副标题" maxlength="500" show-word-limit />
    </ElFormItem>

    <ElFormItem label="图片" required>
      <SpuImageUploader
        :model-value="form.pic ? [form.pic] : []"
        :limit="1"
        tip="建议上传 1 张主图，宽高比贴合实际渲染场景"
        @update:model-value="(value) => (form.pic = value?.[0] || '')"
      />
    </ElFormItem>

    <ElFormItem label="跳转类型">
      <ElSelect v-model="form.jumpType" placeholder="请选择跳转类型" @change="handleJumpTypeChange">
        <ElOption :value="SLOT_ITEM_JUMP_TYPE.NONE" label="无跳转" />
        <ElOption :value="SLOT_ITEM_JUMP_TYPE.ACTIVITY" label="活动页" />
        <ElOption :value="SLOT_ITEM_JUMP_TYPE.SPU" label="商品详情" />
        <ElOption :value="SLOT_ITEM_JUMP_TYPE.ARTICLE" label="内容文章" />
        <ElOption :value="SLOT_ITEM_JUMP_TYPE.EXTERNAL" label="外链" />
      </ElSelect>
    </ElFormItem>

    <ElFormItem v-if="needsJumpTarget" label="跳转目标">
      <SlotItemJumpField
        :jump-type="form.jumpType"
        v-model:jump-target-id="form.jumpTargetId"
        v-model:url="form.url"
      />
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
  import { SLOT_ITEM_JUMP_TYPE, SLOT_STATUS, type SlotItem } from '@/api/slot'
  import SpuImageUploader from '@/views/product/spu/modules/spu-image-uploader.vue'
  import SlotItemJumpField from './slot-item-jump-field.vue'

  defineOptions({ name: 'SlotItemCardForm' })

  interface Props {
    form: SlotItem
  }

  const props = defineProps<Props>()
  const form = computed(() => props.form)

  const needsJumpTarget = computed(
    () =>
      form.value.jumpType === SLOT_ITEM_JUMP_TYPE.ACTIVITY ||
      form.value.jumpType === SLOT_ITEM_JUMP_TYPE.SPU ||
      form.value.jumpType === SLOT_ITEM_JUMP_TYPE.ARTICLE ||
      form.value.jumpType === SLOT_ITEM_JUMP_TYPE.EXTERNAL
  )

  function handleJumpTypeChange() {
    form.value.jumpTargetId = undefined
    form.value.url = ''
  }

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
    if (!String(value.pic || '').trim()) return '请上传图片'

    if (value.jumpType === SLOT_ITEM_JUMP_TYPE.EXTERNAL) {
      const url = String(value.url || '').trim()
      if (!url) return '请填写跳转链接'
      if (!/^https?:\/\/.+/i.test(url)) return '跳转链接需以 http:// 或 https:// 开头'
    }

    if (
      value.jumpType === SLOT_ITEM_JUMP_TYPE.ACTIVITY ||
      value.jumpType === SLOT_ITEM_JUMP_TYPE.SPU ||
      value.jumpType === SLOT_ITEM_JUMP_TYPE.ARTICLE
    ) {
      if (!value.jumpTargetId) return '请选择跳转目标'
    }

    if (value.startTime && value.endTime) {
      if (new Date(value.startTime).getTime() > new Date(value.endTime).getTime()) {
        return '生效结束时间不能早于开始时间'
      }
    }

    return true
  }

  defineExpose({ validate })
</script>
