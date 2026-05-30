<template>
  <ElDialog
    v-model="visible"
    :title="rule ? '编辑签到规则' : '新增签到规则'"
    width="560px"
    append-to-body
    destroy-on-close
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="92px"
      class="sign-rule-form"
      require-asterisk-position="left"
    >
      <ElFormItem label="连续天数" prop="continuousDays">
        <ElInputNumber
          v-model="form.continuousDays"
          :min="1"
          :max="365"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>

      <ElFormItem label="奖励积分" prop="integration">
        <ElInputNumber
          v-model="form.integration"
          :min="0"
          :max="999999"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>

      <ElFormItem label="成长值" prop="growth">
        <ElInputNumber
          v-model="form.growth"
          :min="0"
          :max="999999"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="enableStatus">
        <ElSwitch v-model="form.enableStatus" :active-value="1" :inactive-value="0" />
      </ElFormItem>

      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请输入备注"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit"> 确定 </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { SignEnableStatus, SignRuleItem, SignRulePayload } from '@/api/sign'

  interface Props {
    modelValue: boolean
    rule: SignRuleItem | null
    submitting: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', value: SignRulePayload): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()

  const form = reactive<SignRulePayload>({
    continuousDays: 1,
    integration: 0,
    growth: 0,
    remark: '',
    enableStatus: 1
  })

  const rules: FormRules = {
    continuousDays: [{ required: true, message: '请输入连续天数', trigger: 'blur' }]
  }

  function resetForm() {
    form.continuousDays = 1
    form.integration = 0
    form.growth = 0
    form.remark = ''
    form.enableStatus = 1
  }

  function syncForm(rule: SignRuleItem | null) {
    if (!rule) {
      resetForm()
      return
    }

    form.id = rule.id
    form.continuousDays = rule.continuousDays
    form.integration = rule.integration
    form.growth = rule.growth
    form.remark = rule.remark || ''
    form.enableStatus = Number(rule.enableStatus ?? 1) === 1 ? 1 : 0
  }

  async function handleSubmit() {
    if (!formRef.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    emit('submit', {
      id: props.rule?.id,
      continuousDays: Number(form.continuousDays || 1),
      integration: Number(form.integration || 0),
      growth: Number(form.growth || 0),
      remark: String(form.remark || '').trim(),
      enableStatus: Number(form.enableStatus ?? 1) === 1 ? 1 : (0 as SignEnableStatus)
    })
  }

  watch(
    () => [props.modelValue, props.rule] as const,
    async ([visibleValue, rule]) => {
      if (!visibleValue) return

      syncForm(rule)
      await nextTick()
      formRef.value?.clearValidate()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  :deep(.sign-rule-form .el-input-number) {
    width: 100%;
  }
</style>
