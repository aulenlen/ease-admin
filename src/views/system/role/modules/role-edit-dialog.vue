<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="36%"
    align-center
    destroy-on-close
    @closed="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="角色名称" prop="name">
        <ElInput v-model.trim="form.name" placeholder="请输入角色名称" />
      </ElFormItem>

      <ElFormItem label="角色编码" prop="roleCode">
        <ElInput v-model.trim="form.roleCode" placeholder="请输入角色编码" />
      </ElFormItem>

      <ElFormItem label="角色描述" prop="description">
        <ElInput
          v-model.trim="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="请输入角色描述"
        />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="status">
        <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
      </ElFormItem>

      <ElFormItem label="排序" prop="sort">
        <ElInputNumber
          v-model="form.sort"
          :min="0"
          :max="999"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateRole, fetchUpdateRole } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  type RoleListItem = Api.SystemManage.RoleListItem

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    roleData: undefined
  })

  const emit = defineEmits<Emits>()
  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const defaultForm: Api.SystemManage.RoleSavePayload = {
    id: undefined,
    name: '',
    roleCode: '',
    description: '',
    status: 1,
    sort: 0
  }

  const form = reactive<Api.SystemManage.RoleSavePayload>({ ...defaultForm })

  const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
  })

  function initForm() {
    if (props.dialogType === 'edit' && props.roleData) {
      Object.assign(form, {
        id: props.roleData.id ?? props.roleData.roleId,
        name: props.roleData.name || props.roleData.roleName || '',
        roleCode: props.roleData.roleCode || '',
        description: props.roleData.description || '',
        status: props.roleData.status ?? (props.roleData.enabled ? 1 : 0),
        sort: props.roleData.sort ?? 0
      })
    } else {
      Object.assign(form, { ...defaultForm })
    }
  }

  function handleClose() {
    visible.value = false
    formRef.value?.resetFields()
  }

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitting.value = true

    try {
      const payload: Api.SystemManage.RoleSavePayload = {
        id: form.id,
        name: String(form.name || '').trim(),
        roleCode: String(form.roleCode || '')
          .trim()
          .toUpperCase(),
        description: String(form.description || '').trim(),
        status: Number(form.status ?? 1),
        sort: Number(form.sort ?? 0)
      }

      if (props.dialogType === 'add') {
        await fetchCreateRole(payload)
      } else {
        await fetchUpdateRole(payload)
      }

      ElMessage.success(props.dialogType === 'add' ? '新增成功' : '修改成功')
      emit('success')
      handleClose()
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => [props.modelValue, props.dialogType, props.roleData],
    ([opened]) => {
      if (opened) {
        initForm()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )
</script>
