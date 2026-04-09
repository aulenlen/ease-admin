<template>
  <ElDialog
    v-model="visible"
    title="菜单权限"
    width="520px"
    align-center
    destroy-on-close
    @closed="handleClose"
  >
    <ElScrollbar height="70vh">
      <ElTree
        ref="treeRef"
        :data="menuTree"
        show-checkbox
        node-key="id"
        default-expand-all
        :props="defaultProps"
      />
    </ElScrollbar>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAllocRoleMenus, fetchGetMenuTree, fetchGetRoleDetail } from '@/api/system-manage'

  type RoleListItem = Api.SystemManage.RoleListItem
  type MenuTreeItem = Api.SystemManage.MenuTreeItem

  interface Props {
    modelValue: boolean
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const treeRef = ref()
  const menuTree = ref<MenuTreeItem[]>([])
  const submitting = ref(false)

  const defaultProps = {
    children: 'children',
    label: 'title'
  }

  async function initPermissionData() {
    const roleId = props.roleData?.id ?? props.roleData?.roleId
    if (!roleId) return

    if (!menuTree.value.length) {
      menuTree.value = await fetchGetMenuTree()
    }

    const detail = await fetchGetRoleDetail(roleId)

    await nextTick()
    treeRef.value?.setCheckedKeys(detail.menuIds || [], false)
  }

  function handleClose() {
    visible.value = false
    treeRef.value?.setCheckedKeys([], false)
  }

  async function handleSubmit() {
    const roleId = props.roleData?.id ?? props.roleData?.roleId
    if (!roleId) return

    submitting.value = true
    try {
      const checkedKeys = (treeRef.value?.getCheckedKeys(false) ?? []) as number[]
      await fetchAllocRoleMenus(roleId, checkedKeys)
      ElMessage.success('权限保存成功')
      emit('success')
      handleClose()
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => props.modelValue,
    async (opened) => {
      if (opened) {
        await initPermissionData()
      }
    }
  )
</script>
