<template>
  <ElDialog
    :model-value="modelValue"
    :title="session ? '编辑秒杀场次' : '新建秒杀场次'"
    width="560px"
    append-to-body
    destroy-on-close
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="92px">
      <ElFormItem label="场次名称" prop="name">
        <ElInput v-model="form.name" placeholder="例如：10:00 早安抢购" />
      </ElFormItem>

      <ElFormItem label="场次时间" prop="timeRange">
        <ElDatePicker
          v-model="form.timeRange"
          type="datetimerange"
          clearable
          unlink-panels
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="sessionStatus">
        <ElSwitch v-model="form.sessionStatus" :active-value="1" :inactive-value="0" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ session ? '确定修改' : '确定创建' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { FlashSessionItem, FlashSessionSavePayload } from '@/api/flash'

  interface Props {
    modelValue: boolean
    session: FlashSessionItem | null
    submitting: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', value: FlashSessionSavePayload): void
  }>()

  const formRef = ref<FormInstance>()
  const form = reactive<{
    name: string
    timeRange: [string, string] | []
    sessionStatus: 0 | 1
  }>({
    name: '',
    timeRange: [],
    sessionStatus: 1
  })

  const rules: FormRules<typeof form> = {
    name: [{ required: true, message: '请输入场次名称', trigger: 'blur' }],
    timeRange: [{ required: true, message: '请选择场次时间', trigger: 'change' }]
  }

  const resetForm = () => {
    form.name = ''
    form.timeRange = []
    form.sessionStatus = 1
  }

  const syncForm = (session: FlashSessionItem | null) => {
    if (!session) {
      resetForm()
      return
    }

    form.name = session.name || ''
    form.timeRange = [session.startTime || '', session.endTime || '']
    form.sessionStatus = Number(session.sessionStatus ?? 1) === 1 ? 1 : 0
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (!form.timeRange.length) return

    emit('submit', {
      id: props.session?.id,
      name: form.name,
      startTime: form.timeRange[0],
      endTime: form.timeRange[1],
      sessionStatus: form.sessionStatus
    })
  }

  watch(
    () => [props.modelValue, props.session] as const,
    async ([visible, session]) => {
      if (!visible) return

      syncForm(session)
      await nextTick()
      formRef.value?.clearValidate()
    },
    {
      deep: true,
      immediate: true
    }
  )
</script>
