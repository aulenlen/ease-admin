<template>
  <ElDrawer
    v-model="visible"
    :size="drawerSize"
    :with-header="false"
    destroy-on-close
    modal-class="brand-editor-modal"
    @closed="handleDrawerClosed"
  >
    <div class="brand-editor">
      <header class="brand-editor__header">
        <div class="brand-editor__header-main">
          <p class="brand-editor__eyebrow">商品管理 / 品牌</p>
          <h2 class="brand-editor__title">{{ isEdit ? '编辑品牌' : '新增品牌' }}</h2>
        </div>

        <ElButton circle plain aria-label="关闭品牌编辑抽屉" @click="handleClose">
          <ElIcon><Close /></ElIcon>
        </ElButton>
      </header>

      <div v-loading="loading" class="brand-editor__body">
        <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
          <section class="brand-editor__section">
            <div class="brand-editor__section-head">
              <h3 class="brand-editor__section-title">基础信息</h3>
            </div>

            <div class="brand-editor__grid">
              <ElFormItem label="品牌名称" prop="name" class="brand-editor__field">
                <ElInput
                  v-model.trim="formData.name"
                  maxlength="64"
                  show-word-limit
                  placeholder="请输入品牌名称"
                />
              </ElFormItem>

              <ElFormItem label="首字母" prop="firstLetter" class="brand-editor__field">
                <ElInput
                  v-model.trim="formData.firstLetter"
                  maxlength="1"
                  placeholder="A"
                  @input="handleFirstLetterInput"
                />
              </ElFormItem>

              <ElFormItem label="排序" prop="sort" class="brand-editor__field">
                <ElInputNumber
                  v-model="formData.sort"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                  class="w-full"
                />
              </ElFormItem>
            </div>

            <div class="brand-editor__status-grid">
              <ElFormItem label="显示状态" class="brand-editor__field">
                <ElRadioGroup v-model="formData.showStatus" size="small">
                  <ElRadioButton :value="1">显示</ElRadioButton>
                  <ElRadioButton :value="0">隐藏</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>

              <ElFormItem label="制造商品牌" class="brand-editor__field">
                <ElRadioGroup v-model="formData.factoryStatus" size="small">
                  <ElRadioButton :value="1">是</ElRadioButton>
                  <ElRadioButton :value="0">否</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>
            </div>
          </section>

          <section class="brand-editor__section">
            <div class="brand-editor__section-head">
              <h3 class="brand-editor__section-title">品牌素材</h3>
            </div>

            <div class="brand-editor__media-grid">
              <ElFormItem prop="logo" class="brand-editor__media-item">
                <BrandImageField
                  v-model="formData.logo"
                  title="品牌 Logo"
                  preview-mode="square"
                  input-placeholder="请输入品牌 Logo 图片地址"
                  empty-text="上传 Logo"
                />
              </ElFormItem>

              <div class="brand-editor__media-item">
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

          <section class="brand-editor__section">
            <div class="brand-editor__section-head">
              <h3 class="brand-editor__section-title">品牌故事</h3>
            </div>

            <ElFormItem class="brand-editor__story-item">
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

      <footer class="brand-editor__footer">
        <div class="brand-editor__footer-actions">
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

  .brand-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--default-box-color);
  }

  .brand-editor__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px 16px;
    background: var(--default-box-color);
    border-bottom: 1px solid color-mix(in srgb, var(--art-card-border) 60%, transparent);
  }

  .brand-editor__header-main {
    min-width: 0;
  }

  .brand-editor__eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .brand-editor__title {
    margin: 4px 0 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--el-text-color-primary);
  }

  .brand-editor__body {
    flex: 1;
    padding: 20px 24px 96px;
    overflow-y: auto;
  }

  .brand-editor__section + .brand-editor__section {
    padding-top: 24px;
    margin-top: 28px;
    border-top: 1px solid color-mix(in srgb, var(--art-card-border) 55%, transparent);
  }

  .brand-editor__section-head {
    margin-bottom: 12px;
  }

  .brand-editor__section-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary);
  }

  .brand-editor__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .brand-editor__status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .brand-editor__field {
    margin-bottom: 0;
  }

  .brand-editor__media-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .brand-editor__media-item {
    min-width: 0;
    margin-bottom: 0;
  }

  .brand-editor__media-item :deep(.el-form-item__content) {
    display: block;
  }

  .brand-editor__story-item {
    margin-bottom: 0;
  }

  .brand-editor__footer {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: flex-end;
    padding: 14px 24px;
    background: color-mix(in srgb, var(--default-box-color) 96%, white);
    border-top: 1px solid color-mix(in srgb, var(--art-card-border) 60%, transparent);
  }

  .brand-editor__footer-actions {
    display: flex;
    gap: 10px;
  }

  @media (width <= 767px) {
    .brand-editor__header,
    .brand-editor__body,
    .brand-editor__footer {
      padding-right: 16px;
      padding-left: 16px;
    }

    .brand-editor__header {
      flex-direction: column;
    }

    .brand-editor__grid,
    .brand-editor__media-grid,
    .brand-editor__status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
