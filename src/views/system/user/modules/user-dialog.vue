<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
    width="36%"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
      <ElFormItem label="用户名" prop="username">
        <ElInput
          v-model.trim="formData.username"
          :disabled="dialogType === 'edit'"
          placeholder="请输入登录账号"
        />
      </ElFormItem>

      <ElFormItem v-if="dialogType === 'add'" label="初始密码" prop="password">
        <ElInput
          v-model.trim="formData.password"
          type="password"
          show-password
          placeholder="请输入初始密码"
        />
      </ElFormItem>

      <ElFormItem label="姓名/昵称" prop="nickName">
        <ElInput v-model.trim="formData.nickName" placeholder="请输入姓名或昵称" />
      </ElFormItem>

      <ElFormItem label="电子邮箱" prop="email">
        <ElInput v-model.trim="formData.email" placeholder="example@mail.com" />
      </ElFormItem>

      <ElFormItem label="账号状态" prop="status">
        <ElSwitch v-model="formData.status" :active-value="1" :inactive-value="0" />
      </ElFormItem>

      <ElFormItem label="角色" prop="roleIds">
        <ElSelect
          v-model="formData.roleIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          placeholder="请选择角色"
        >
          <ElOption
            v-for="role in roleList"
            :key="role.id ?? role.roleId"
            :label="role.roleName"
            :value="role.id ?? role.roleId"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="备注说明" prop="note">
        <ElInput
          v-model.trim="formData.note"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="填写账号备注（选填）"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchAllocUserRoles,
    fetchCreateUser,
    fetchGetRoleListAll,
    fetchGetUserRoles,
    fetchUpdateUser
  } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const roleList = ref<Api.SystemManage.RoleListItem[]>([])

  const defaultFormData: Api.SystemManage.UserSavePayload = {
    username: '',
    password: '',
    nickName: '',
    email: '',
    note: '',
    status: 1,
    roleIds: []
  }

  const formData = reactive<Api.SystemManage.UserSavePayload>({ ...defaultFormData })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [
      {
        validator: (_rule, value, callback) => {
          if (dialogType.value === 'add' && !String(value || '').trim()) {
            callback(new Error('请输入初始密码'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
  }

  async function ensureRoleList() {
    if (roleList.value.length > 0) return
    roleList.value = await fetchGetRoleListAll()
  }

  async function initFormData() {
    await ensureRoleList()

    const isEdit = dialogType.value === 'edit' && props.userData?.id
    const row = props.userData

    Object.assign(formData, {
      ...defaultFormData,
      id: isEdit ? row?.id : undefined,
      username: isEdit ? row?.username || row?.userName || '' : '',
      password: '',
      nickName: isEdit ? row?.nickName || '' : '',
      email: isEdit ? row?.email || row?.userEmail || '' : '',
      note: isEdit ? row?.note || '' : '',
      status: isEdit ? Number(row?.status ?? 1) : 1,
      roleIds: []
    })

    if (isEdit && row?.id) {
      const roles = await fetchGetUserRoles(row.id)
      formData.roleIds = roles
        .map((item) => item.id ?? item.roleId)
        .filter((id): id is number => typeof id === 'number')
    }
  }

  function handleClosed() {
    Object.assign(formData, { ...defaultFormData })
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitting.value = true

    try {
      const payload: Api.SystemManage.UserSavePayload = {
        id: formData.id,
        username: String(formData.username || '').trim(),
        password: formData.password ? String(formData.password).trim() : undefined,
        nickName: String(formData.nickName || '').trim(),
        email: String(formData.email || '').trim(),
        note: String(formData.note || '').trim(),
        status: Number(formData.status ?? 1),
        roleIds: formData.roleIds || []
      }

      let adminId = Number(payload.id || 0)

      if (dialogType.value === 'add') {
        adminId = await fetchCreateUser(payload)
      } else if (adminId) {
        await fetchUpdateUser(adminId, payload)
      }

      if (adminId) {
        await fetchAllocUserRoles({
          adminId,
          roleIds: payload.roleIds || []
        })
      }

      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
      dialogVisible.value = false
      emit('submit')
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => [props.visible, props.type, props.userData],
    async ([visible]) => {
      if (!visible) return
      await initFormData()
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    },
    { immediate: true }
  )
</script>
