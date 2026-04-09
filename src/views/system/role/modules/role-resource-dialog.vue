<template>
  <ElDialog
    v-model="visible"
    title="资源权限"
    width="720px"
    align-center
    destroy-on-close
    @closed="handleClose"
  >
    <div class="resource-dialog__body custom-scroll">
      <ElCheckboxGroup v-model="resourceCheckedIds">
        <div v-for="group in groupedResources" :key="group.id" class="resource-group">
          <div class="resource-group__title">{{ group.name }}</div>
          <div class="resource-group__items">
            <ElCheckbox v-for="item in group.resources" :key="item.id" :value="item.id">
              {{ item.name }}
            </ElCheckbox>
          </div>
        </div>
      </ElCheckboxGroup>
    </div>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchAllocRoleResources,
    fetchGetResourceListAll,
    fetchGetRoleDetail
  } from '@/api/system-manage'

  type RoleListItem = Api.SystemManage.RoleListItem
  type ResourceListItem = Api.SystemManage.ResourceListItem

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

  const submitting = ref(false)
  const resourceCheckedIds = ref<number[]>([])
  const allResources = ref<ResourceListItem[]>([])

  const categoryMap: Record<number, string> = {
    1: '商品模块',
    2: '订单模块',
    3: '营销模块',
    4: '权限模块',
    5: '内容模块'
  }

  const groupedResources = computed(() => {
    const groups: Record<number, { id: number; name: string; resources: ResourceListItem[] }> = {}

    allResources.value.forEach((item) => {
      const categoryId = item.categoryId || 0
      if (!groups[categoryId]) {
        groups[categoryId] = {
          id: categoryId,
          name: categoryMap[categoryId] || `其他模块 (${categoryId})`,
          resources: []
        }
      }
      groups[categoryId].resources.push(item)
    })

    return Object.values(groups)
  })

  async function initData() {
    const roleId = props.roleData?.id ?? props.roleData?.roleId
    if (!roleId) return

    if (!allResources.value.length) {
      allResources.value = await fetchGetResourceListAll()
    }

    const detail = await fetchGetRoleDetail(roleId)
    resourceCheckedIds.value = [...(detail.resourceIds || [])]
  }

  function handleClose() {
    visible.value = false
    resourceCheckedIds.value = []
  }

  async function handleSubmit() {
    const roleId = props.roleData?.id ?? props.roleData?.roleId
    if (!roleId) return

    submitting.value = true
    try {
      await fetchAllocRoleResources(roleId, resourceCheckedIds.value)
      ElMessage.success('资源权限保存成功')
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
        await initData()
      }
    }
  )
</script>

<style scoped lang="scss">
  .resource-dialog__body {
    max-height: 520px;
    padding: 8px 24px;
    overflow-y: auto;
  }

  .resource-group {
    margin-bottom: 24px;
  }

  .resource-group:last-child {
    margin-bottom: 0;
  }

  .resource-group__title {
    padding-bottom: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    border-bottom: 1px solid var(--border-muted);
  }

  .resource-group__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
</style>
