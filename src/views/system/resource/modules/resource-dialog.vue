<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'add' ? '添加资源' : '编辑资源'"
    width="36%"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="资源名称" prop="name">
        <ElInput v-model.trim="form.name" placeholder="请输入资源名称" />
      </ElFormItem>

      <ElFormItem label="资源分类" prop="categoryId">
        <ElSelect v-model="form.categoryId" placeholder="请选择资源分类" class="w-full">
          <ElOption
            v-for="item in categoryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="资源接口 URL" prop="url">
        <ElInput v-model.trim="form.url" placeholder="/api/module/resource" />
      </ElFormItem>

      <ElFormItem label="备注描述" prop="description">
        <ElInput
          v-model.trim="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="请输入资源说明"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateResource, fetchUpdateResource } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    modelValue: boolean
    mode: 'add' | 'edit'
    data?: Partial<Api.SystemManage.ResourceListItem>
    categoryOptions: Api.SystemManage.ResourceCategoryItem[]
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const defaultForm: Api.SystemManage.ResourceSavePayload = {
    id: undefined,
    name: '',
    url: '',
    description: '',
    categoryId: undefined
  }

  const form = reactive<Api.SystemManage.ResourceSavePayload>({ ...defaultForm })

  const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
    url: [{ required: true, message: '请输入资源接口 URL', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择资源分类', trigger: 'change' }]
  })

  function resetForm() {
    Object.assign(form, { ...defaultForm })
    formRef.value?.resetFields()
  }

  function handleClosed() {
    resetForm()
  }

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitting.value = true
    try {
      if (props.mode === 'add') {
        await fetchCreateResource(form)
      } else {
        await fetchUpdateResource(form)
      }
      ElMessage.success(props.mode === 'add' ? '添加成功' : '更新成功')
      emit('success')
      visible.value = false
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => [props.modelValue, props.data],
    ([opened]) => {
      if (!opened) return
      if (props.data) {
        Object.assign(form, {
          id: props.data.id,
          name: props.data.name || '',
          url: props.data.url || '',
          description: props.data.description || '',
          categoryId: props.data.categoryId
        })
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )
</script>
