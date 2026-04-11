<template>
  <ElDrawer
    v-model="visible"
    :size="drawerSize"
    :with-header="false"
    destroy-on-close
    modal-class="brand-editor-modal"
    @closed="handleDrawerClosed"
  >
    <div class="flex h-full flex-col bg-[var(--default-box-color)]">
      <header
        class="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--art-card-border)_60%,transparent)] bg-[var(--default-box-color)] px-6 py-5 max-md:flex-col max-md:px-4"
      >
        <div class="min-w-0">
          <p class="m-0 text-xs text-[var(--el-text-color-secondary)]">商品管理 / 品牌</p>
          <h2
            class="mt-1 text-[20px] font-semibold leading-tight text-[var(--el-text-color-primary)]"
          >
            {{ isEdit ? '编辑品牌' : '新增品牌' }}
          </h2>
        </div>

        <ElButton circle plain aria-label="关闭品牌编辑抽屉" @click="handleClose">
          <ElIcon><Close /></ElIcon>
        </ElButton>
      </header>

      <div
        v-loading="loading"
        class="flex-1 overflow-x-hidden overflow-y-auto px-6 py-5 pb-24 max-md:px-4"
      >
        <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
          <section>
            <div class="mb-3">
              <h3
                class="m-0 text-[15px] font-semibold leading-tight text-[var(--el-text-color-primary)]"
                >基础信息</h3
              >
            </div>

            <div class="grid grid-cols-1 gap-4">
              <ElFormItem label="品牌名称" prop="name" class="mb-0">
                <ElInput
                  v-model.trim="formData.name"
                  maxlength="64"
                  show-word-limit
                  placeholder="请输入品牌名称"
                />
              </ElFormItem>

              <ElFormItem label="首字母" prop="firstLetter" class="mb-0">
                <ElInput
                  v-model.trim="formData.firstLetter"
                  maxlength="1"
                  placeholder="A"
                  @input="handleFirstLetterInput"
                />
              </ElFormItem>

              <ElFormItem label="排序" prop="sort" class="mb-0">
                <ElInputNumber
                  v-model="formData.sort"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                  class="w-full"
                />
              </ElFormItem>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <ElFormItem label="显示状态" class="mb-0">
                <ElRadioGroup v-model="formData.showStatus" size="small">
                  <ElRadioButton :value="1">显示</ElRadioButton>
                  <ElRadioButton :value="0">隐藏</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>

              <ElFormItem label="制造商品牌" class="mb-0">
                <ElRadioGroup v-model="formData.factoryStatus" size="small">
                  <ElRadioButton :value="1">是</ElRadioButton>
                  <ElRadioButton :value="0">否</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>
            </div>
          </section>

          <section
            class="mt-7 border-t border-[color-mix(in_srgb,var(--art-card-border)_55%,transparent)] pt-6"
          >
            <div class="mb-3">
              <h3
                class="m-0 text-[15px] font-semibold leading-tight text-[var(--el-text-color-primary)]"
                >品牌素材</h3
              >
            </div>

            <div class="grid grid-cols-1 gap-6">
              <ElFormItem prop="logo" class="mb-0 min-w-0">
                <BrandImageField
                  v-model="formData.logo"
                  title="品牌 Logo"
                  preview-mode="square"
                  input-placeholder="请输入品牌 Logo 图片地址"
                  empty-text="上传 Logo"
                />
              </ElFormItem>

              <div class="min-w-0">
                <BrandImageField
                  v-model="formData.bigPic"
                  title="品牌专区大图"
                  preview-mode="wide"
                  input-placeholder="请输入品牌专区大图地址"
                  empty-text="上传大图"
                />
              </div>
            </div>
          </section>

          <section
            class="mt-7 border-t border-[color-mix(in_srgb,var(--art-card-border)_55%,transparent)] pt-6"
          >
            <div class="mb-3">
              <h3
                class="m-0 text-[15px] font-semibold leading-tight text-[var(--el-text-color-primary)]"
                >品牌故事</h3
              >
            </div>

            <ElFormItem class="mb-0">
              <ElInput
                v-model.trim="formData.brandStory"
                type="textarea"
                :rows="6"
                maxlength="500"
                show-word-limit
                placeholder="请输入品牌介绍，可选"
              />
            </ElFormItem>
          </section>
        </ElForm>
      </div>

      <footer
        class="sticky bottom-0 flex justify-end border-t border-[color-mix(in_srgb,var(--art-card-border)_60%,transparent)] bg-[color-mix(in_srgb,var(--default-box-color)_96%,white)] px-6 py-3.5 max-md:px-4"
      >
        <div class="flex gap-2.5">
          <ElButton @click="handleClose">取消</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建品牌' }}
          </ElButton>
        </div>
      </footer>
    </div>
  </ElDrawer>
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
  import { Close } from '@element-plus/icons-vue'
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
  const drawerSize = computed(() => (width.value < 768 ? '100%' : '680px'))
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

  function handleDrawerClosed() {
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
  :deep(.el-drawer__body) {
    padding: 0;
  }
</style>
