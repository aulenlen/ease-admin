<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    top="6vh"
    modal-class="brand-editor-modal"
    destroy-on-close
    @closed="handleDialogClosed"
  >
    <div v-loading="loading" class="max-h-[72vh] overflow-y-auto pr-1">
      <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top" class="space-y-3">
        <div
          class="rounded-[var(--custom-radius)] border border-[var(--art-card-border)] px-5 py-4"
        >
          <section class="space-y-4">
            <div class="font-medium text-[var(--el-text-color-primary)]">基础信息</div>

            <ElFormItem label="品牌名称" prop="name">
              <ElInput
                v-model.trim="formData.name"
                maxlength="64"
                show-word-limit
                placeholder="请输入品牌名称"
              />
            </ElFormItem>

            <ElFormItem label="首字母" prop="firstLetter">
              <ElInput
                v-model.trim="formData.firstLetter"
                maxlength="1"
                placeholder="A"
                @input="handleFirstLetterInput"
              />
            </ElFormItem>

            <ElFormItem label="排序" prop="sort">
              <ElInputNumber
                v-model="formData.sort"
                :min="0"
                :max="9999"
                controls-position="right"
                class="w-full"
              />
            </ElFormItem>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-[var(--el-text-color-primary)]">显示状态</span>
              <ElSwitch v-model="showStatusValue" />
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-[var(--el-text-color-primary)]">制造商品牌</span>
              <ElSwitch v-model="factoryStatusValue" />
            </div>
          </section>

          <section class="mt-6 space-y-4">
            <div class="font-medium text-[var(--el-text-color-primary)]">品牌素材</div>

            <ElFormItem label="品牌 Logo" prop="logo" class="mb-0 min-w-0">
              <BrandImageField
                v-model="formData.logo"
                title=""
                preview-mode="square"
                input-placeholder="请输入品牌 Logo 图片地址"
                empty-text="上传 Logo"
              />
            </ElFormItem>

            <ElFormItem label="品牌专区大图" class="mb-0 min-w-0">
              <BrandImageField
                v-model="formData.bigPic"
                title=""
                preview-mode="square"
                input-placeholder="请输入品牌专区大图地址"
                empty-text="上传大图"
              />
            </ElFormItem>
          </section>

          <section class="mt-6 space-y-4">
            <div class="font-medium text-[var(--el-text-color-primary)]">品牌故事</div>

            <ElFormItem class="mb-0">
              <ElInput
                v-model.trim="formData.brandStory"
                type="textarea"
                :rows="5"
                maxlength="500"
                show-word-limit
                placeholder="请输入品牌介绍，可选"
              />
            </ElFormItem>
          </section>
        </div>
      </ElForm>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建品牌' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    createBrand,
    getBrand,
    updateBrand,
    type BrandDetailItem,
    type BrandListItem,
    type BrandSavePayload
  } from '@/api/brand'
  import BrandImageField from './brand-image-field.vue'
  import type { DialogType } from '@/types'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'

  interface Props {
    modelValue: boolean
    dialogType: DialogType
    brandData?: Partial<BrandListItem>
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    brandData: undefined
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const { width } = useWindowSize()

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const submitLoading = ref(false)

  const defaultFormData: BrandSavePayload = {
    name: '',
    firstLetter: '',
    sort: 0,
    factoryStatus: 0,
    showStatus: 1,
    logo: '',
    bigPic: '',
    brandStory: ''
  }

  const formData = reactive<BrandSavePayload>({ ...defaultFormData })
  const snapshot = ref<BrandSavePayload>({ ...defaultFormData })

  const isEdit = computed(() => props.dialogType === 'edit')
  const dialogTitle = computed(() => (isEdit.value ? '编辑品牌' : '新增品牌'))
  const dialogWidth = computed(() => (width.value < 768 ? 'calc(100vw - 24px)' : '760px'))
  const showStatusValue = computed({
    get: () => Number(formData.showStatus ?? 0) === 1,
    set: (value: boolean) => {
      formData.showStatus = value ? 1 : 0
    }
  })
  const factoryStatusValue = computed({
    get: () => Number(formData.factoryStatus ?? 0) === 1,
    set: (value: boolean) => {
      formData.factoryStatus = value ? 1 : 0
    }
  })
  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入品牌名称', trigger: 'blur' },
      { min: 2, max: 64, message: '长度在 2 到 64 个字符', trigger: 'blur' }
    ],
    logo: [{ required: true, message: '请上传品牌 Logo 或填写地址', trigger: 'blur' }],
    firstLetter: [
      {
        validator: (_rule, value, callback) => {
          if (value && !/^[A-Z]$/.test(String(value))) {
            callback(new Error('首字母需为单个大写英文字母'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  })

  function applyFormData(data?: Partial<BrandDetailItem | BrandSavePayload>) {
    Object.assign(formData, {
      ...defaultFormData,
      ...data,
      firstLetter: String(data?.firstLetter || '')
        .toUpperCase()
        .slice(0, 1),
      sort: Number(data?.sort ?? 0),
      showStatus: Number(data?.showStatus ?? defaultFormData.showStatus) === 1 ? 1 : 0,
      factoryStatus: Number(data?.factoryStatus ?? defaultFormData.factoryStatus) === 1 ? 1 : 0
    })
  }

  function buildPayload(): BrandSavePayload {
    return {
      name: String(formData.name || '').trim(),
      firstLetter: String(formData.firstLetter || '')
        .trim()
        .toUpperCase()
        .slice(0, 1),
      sort: Number(formData.sort ?? 0),
      factoryStatus: Number(formData.factoryStatus ?? 0) === 1 ? 1 : 0,
      showStatus: Number(formData.showStatus ?? 0) === 1 ? 1 : 0,
      logo: String(formData.logo || '').trim(),
      bigPic: String(formData.bigPic || '').trim(),
      brandStory: String(formData.brandStory || '').trim()
    }
  }

  function handleFirstLetterInput(value: string | number) {
    formData.firstLetter = String(value || '')
      .toUpperCase()
      .slice(0, 1)
  }

  async function loadBrandDetail() {
    const brandId = Number(props.brandData?.id)
    if (!brandId) {
      ElMessage.error('缺少品牌 ID')
      visible.value = false
      return
    }

    loading.value = true
    try {
      const data = await getBrand(brandId)
      applyFormData(data)
      snapshot.value = buildPayload()
      nextTick(() => formRef.value?.clearValidate())
    } finally {
      loading.value = false
    }
  }

  function resetToSnapshot() {
    applyFormData(isEdit.value ? snapshot.value : defaultFormData)
  }

  function handleReset() {
    resetToSnapshot()
    nextTick(() => formRef.value?.clearValidate())
  }

  function handleClose() {
    visible.value = false
  }

  function handleDialogClosed() {
    submitLoading.value = false
    loading.value = false
    resetToSnapshot()
  }

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitLoading.value = true

    try {
      const payload = buildPayload()
      if (isEdit.value) {
        const brandId = Number(props.brandData?.id)
        await updateBrand(brandId, payload)
      } else {
        await createBrand(payload)
      }

      emit('success')
      visible.value = false
    } finally {
      submitLoading.value = false
    }
  }

  watch(
    () => props.modelValue,
    (newValue) => {
      if (!newValue) return

      if (isEdit.value) {
        loadBrandDetail()
        return
      }

      snapshot.value = { ...defaultFormData }
      applyFormData(defaultFormData)
      nextTick(() => formRef.value?.clearValidate())
    }
  )
</script>

<style scoped lang="scss">
  :deep(.brand-editor-modal .el-overlay-dialog) {
    overflow: hidden;
  }
</style>
