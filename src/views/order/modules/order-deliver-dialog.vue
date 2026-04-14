<template>
  <ElDialog
    :model-value="modelValue"
    title="订单发货"
    width="520px"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
    @closed="handleClosed"
  >
    <div class="mb-4 text-sm text-[var(--el-text-color-secondary)]">
      订单号：<span class="font-mono text-[var(--el-text-color-primary)]">{{
        orderNo || '—'
      }}</span>
    </div>

    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="物流公司" prop="logisticsCompany">
        <ElInput v-model="form.logisticsCompany" placeholder="例如：顺丰速运" clearable />
      </ElFormItem>
      <ElFormItem label="物流编码" prop="logisticsCode">
        <ElInput v-model="form.logisticsCode" placeholder="选填，例如：shunfeng" clearable />
      </ElFormItem>
      <ElFormItem label="运单号" prop="logisticsNo">
        <ElInput v-model="form.logisticsNo" placeholder="请输入运单号" clearable />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
        <ElButton type="primary" :loading="dialogSubmitting" @click="submit">确认发货</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  const props = defineProps<{
    modelValue: boolean
    orderNo: string | null
    submitting?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (
      e: 'submit',
      payload: {
        logisticsCompany: string
        logisticsCode: string | null
        logisticsNo: string
      }
    ): void
  }>()

  const formRef = ref<FormInstance>()
  const dialogSubmitting = ref(false)
  const form = reactive({
    logisticsCompany: '顺丰速运',
    logisticsCode: '',
    logisticsNo: ''
  })

  const rules: FormRules = {
    logisticsCompany: [{ required: true, message: '请输入物流公司', trigger: 'blur' }],
    logisticsNo: [
      { required: true, message: '请输入运单号', trigger: 'blur' },
      { min: 6, message: '运单号长度过短', trigger: 'blur' }
    ]
  }

  watch(
    () => props.submitting,
    (value) => {
      dialogSubmitting.value = Boolean(value)
    },
    { immediate: true }
  )

  watch(
    () => props.modelValue,
    (visible) => {
      if (!visible) return
      form.logisticsCompany = '顺丰速运'
      form.logisticsCode = ''
      form.logisticsNo = ''
    }
  )

  const submit = async () => {
    if (!formRef.value) return
    const valid = await formRef.value.validate()
    if (!valid) return

    emit('submit', {
      logisticsCompany: form.logisticsCompany.trim(),
      logisticsCode: form.logisticsCode.trim() || null,
      logisticsNo: form.logisticsNo.trim()
    })
  }

  const handleClosed = () => {
    formRef.value?.clearValidate()
  }
</script>
