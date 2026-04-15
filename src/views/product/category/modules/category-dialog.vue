<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    top="6vh"
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading" class="max-h-[72vh] overflow-y-auto pr-1">
      <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top" class="space-y-3">
        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">基础信息</span>
          </template>

          <ElFormItem label="上级分类" prop="parentId">
            <ElTreeSelect
              v-model="formData.parentId"
              :data="treeOptions"
              :props="{ label: 'name', value: 'id', children: 'children' }"
              check-strictly
              clearable
              class="w-full"
              placeholder="请选择上级分类"
            />
          </ElFormItem>

          <ElFormItem label="分类名称" prop="name">
            <ElInput
              v-model.trim="formData.name"
              maxlength="100"
              placeholder="请输入分类名称"
              class="w-full"
            />
          </ElFormItem>

          <ElRow :gutter="16">
            <ElCol :xs="24" :md="8">
              <ElFormItem label="启用状态">
                <ElSwitch v-model="enableStatusValue" />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :md="8">
              <ElFormItem label="导航显示">
                <ElSwitch v-model="navStatusValue" />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :md="8">
              <ElFormItem label="排序">
                <ElInputNumber
                  v-model="formData.sort"
                  :min="0"
                  :max="999"
                  controls-position="right"
                  class="w-full"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElCard>

        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">展示与 SEO</span>
          </template>

          <ElRow :gutter="16">
            <ElCol :xs="24" :md="12">
              <ElFormItem label="图标">
                <CategoryIconPicker v-model="formData.icon" />
              </ElFormItem>

              <ElFormItem label="图片地址" class="mb-0">
                <ElInput
                  v-model.trim="formData.image"
                  placeholder="请输入分类图片地址"
                  class="w-full"
                />
              </ElFormItem>
            </ElCol>

            <ElCol :xs="24" :md="12">
              <ElFormItem label="关键词">
                <ElInput
                  v-model.trim="formData.keywords"
                  placeholder="请输入 SEO 关键词"
                  class="w-full"
                />
              </ElFormItem>

              <ElFormItem label="描述" class="mb-0">
                <ElInput
                  v-model.trim="formData.description"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入分类描述"
                  class="w-full"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElCard>
      </ElForm>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    createCategory,
    getCategory,
    updateCategory,
    type CategoryDetailItem,
    type CategorySavePayload,
    type CategoryTreeItem
  } from '@/api/category'
  import CategoryIconPicker from './category-icon-picker.vue'
  import { useWindowSize } from '@vueuse/core'
  import type { FormInstance } from 'element-plus'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    categoryData?: Partial<CategoryTreeItem> | null
    treeData: CategoryTreeItem[]
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success', categoryId?: number): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    categoryData: null
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const submitting = ref(false)
  const dialogTitle = computed(() => (props.dialogType === 'add' ? '新增分类' : '编辑分类'))
  const dialogWidth = computed(() => (width.value < 768 ? 'calc(100vw - 24px)' : '860px'))

  const defaultFormData: CategorySavePayload = {
    id: undefined,
    parentId: 0,
    name: '',
    enableStatus: 1,
    isNav: 1,
    sort: 0,
    icon: '',
    image: '',
    keywords: '',
    description: ''
  }

  const formData = reactive<CategorySavePayload>({ ...defaultFormData })

  const treeOptions = computed(() => [
    { id: 0, name: '无（一级分类）', children: [] as CategoryTreeItem[] },
    ...props.treeData
  ])

  const enableStatusValue = computed({
    get: () => Number(formData.enableStatus ?? 1) === 1,
    set: (value: boolean) => {
      formData.enableStatus = value ? 1 : 0
    }
  })

  const navStatusValue = computed({
    get: () => Number(formData.isNav ?? 1) === 1,
    set: (value: boolean) => {
      formData.isNav = value ? 1 : 0
    }
  })

  const rules = {
    parentId: [{ required: true, message: '请选择上级分类', trigger: 'change' }],
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
  }

  function applyFormData(data?: Partial<CategoryDetailItem | CategorySavePayload>) {
    Object.assign(formData, {
      ...defaultFormData,
      ...data,
      parentId: Number(data?.parentId ?? 0),
      enableStatus: Number(data?.enableStatus ?? 1) === 1 ? 1 : 0,
      isNav: Number(data?.isNav ?? 1) === 1 ? 1 : 0,
      sort: Number(data?.sort ?? 0)
    })
  }

  async function loadCategoryDetail() {
    const categoryId = Number(props.categoryData?.id)
    if (!categoryId) return

    loading.value = true
    try {
      const detail = await getCategory(categoryId)
      applyFormData(detail)
      nextTick(() => formRef.value?.clearValidate?.())
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    applyFormData(defaultFormData)
    formRef.value?.clearValidate?.()
  }

  function handleClosed() {
    submitting.value = false
    loading.value = false
    resetForm()
  }

  async function handleSubmit() {
    await formRef.value?.validate?.()
    submitting.value = true

    try {
      const payload: CategorySavePayload = {
        id: formData.id,
        parentId: Number(formData.parentId ?? 0),
        name: String(formData.name || '').trim(),
        enableStatus: Number(formData.enableStatus ?? 1) as 0 | 1,
        isNav: Number(formData.isNav ?? 1) as 0 | 1,
        sort: Number(formData.sort ?? 0),
        icon: String(formData.icon || '').trim(),
        image: String(formData.image || '').trim(),
        keywords: String(formData.keywords || '').trim(),
        description: String(formData.description || '').trim()
      }

      let categoryId = Number(payload.id || 0)

      if (props.dialogType === 'add') {
        categoryId = await createCategory(payload)
      } else {
        await updateCategory(payload)
      }

      ElMessage.success(props.dialogType === 'add' ? '新增成功' : '更新成功')
      visible.value = false
      emit('success', categoryId || payload.id)
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => [props.modelValue, props.dialogType, props.categoryData],
    ([opened]) => {
      if (!opened) return

      if (props.dialogType === 'edit') {
        loadCategoryDetail()
        return
      }

      applyFormData({
        ...defaultFormData,
        parentId: Number(props.categoryData?.parentId ?? 0)
      })
      nextTick(() => formRef.value?.clearValidate?.())
    },
    { immediate: true }
  )
</script>
