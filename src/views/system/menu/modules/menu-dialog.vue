<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增菜单' : '编辑菜单'"
    width="36%"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
      <ElFormItem label="上级菜单" prop="parentId">
        <ElTreeSelect
          v-model="formData.parentId"
          :data="menuOptions"
          :props="{ label: 'title', value: 'id', children: 'children' }"
          check-strictly
          clearable
          class="w-full"
          placeholder="请选择上级菜单"
        />
      </ElFormItem>

      <ElFormItem label="菜单名称" prop="title">
        <ElInput v-model.trim="formData.title" placeholder="请输入菜单名称" />
      </ElFormItem>

      <ElFormItem label="前端标识" prop="name">
        <ElInput v-model.trim="formData.name" placeholder="请输入菜单标识" />
      </ElFormItem>

      <ElFormItem label="菜单图标" prop="icon">
        <ElInput v-model.trim="formData.icon" placeholder="如：ri:user-line" />
      </ElFormItem>

      <ElFormItem label="显示状态" prop="hidden">
        <ElSwitch v-model="hiddenVisible" inline-prompt active-text="显示" inactive-text="隐藏" />
      </ElFormItem>

      <ElFormItem label="排序" prop="sort">
        <ElInputNumber
          v-model="formData.sort"
          :min="0"
          :max="999"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    editData?: Partial<Api.SystemManage.MenuTreeItem> | null
    menuTree?: Api.SystemManage.MenuTreeItem[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: Api.SystemManage.MenuSavePayload): void
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 'add',
    editData: null,
    menuTree: () => []
  })

  const emit = defineEmits<Emits>()
  const formRef = ref()
  const submitting = ref(false)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const defaultFormData: Api.SystemManage.MenuSavePayload = {
    id: undefined,
    parentId: 0,
    title: '',
    name: '',
    icon: '',
    sort: 0,
    hidden: 0
  }

  const formData = reactive<Api.SystemManage.MenuSavePayload>({ ...defaultFormData })

  const menuOptions = computed(() => [{ id: 0, title: '无（一级菜单）' }, ...props.menuTree])

  const hiddenVisible = computed({
    get: () => Number(formData.hidden ?? 0) === 0,
    set: (value: boolean) => {
      formData.hidden = value ? 0 : 1
    }
  })

  const rules = {
    title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    parentId: [{ required: true, message: '请选择上级菜单', trigger: 'change' }]
  }

  function resetForm() {
    Object.assign(formData, { ...defaultFormData })
    formRef.value?.clearValidate?.()
  }

  function initFormData() {
    if (props.type === 'edit' && props.editData) {
      Object.assign(formData, {
        id: props.editData.id,
        parentId: props.editData.parentId ?? 0,
        title: props.editData.title || '',
        name: props.editData.name || '',
        icon: props.editData.icon || '',
        sort: props.editData.sort ?? 0,
        hidden: props.editData.hidden ?? 0
      })
    } else {
      resetForm()
    }
  }

  async function handleSubmit() {
    await formRef.value?.validate?.()
    submitting.value = true

    try {
      emit('submit', {
        id: formData.id,
        parentId: Number(formData.parentId ?? 0),
        title: String(formData.title || '').trim(),
        name: String(formData.name || '').trim(),
        icon: String(formData.icon || '').trim(),
        sort: Number(formData.sort ?? 0),
        hidden: Number(formData.hidden ?? 0)
      })
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetForm()
  }

  watch(
    () => [props.visible, props.type, props.editData],
    ([opened]) => {
      if (opened) {
        initFormData()
      }
    },
    { immediate: true }
  )
</script>
