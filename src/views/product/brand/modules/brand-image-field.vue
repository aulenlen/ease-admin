<template>
  <article class="brand-image-field">
    <div class="text-sm font-medium text-g-900">{{ title }}</div>

    <div class="mt-2.5">
      <button
        v-if="!value"
        type="button"
        class="brand-image-field__empty flex-cc flex-col border border-dashed border-[#d9d9d9] rounded-md bg-transparent"
        :style="previewStyle"
        @click="openCropDialog"
      >
        <ElIcon class="!text-xl !text-g-600"><Plus /></ElIcon>
        <div class="mt-2 text-sm text-g-600">{{ emptyText }}</div>
      </button>

      <ElImage
        v-else
        :src="value"
        :alt="title"
        class="brand-image-field__image"
        :style="previewStyle"
        :preview-src-list="[value]"
        preview-teleported
      />

      <div v-if="tip" class="mt-2 text-xs text-g-700">{{ tip }}</div>

      <div class="brand-image-field__actions">
        <button
          type="button"
          class="brand-image-field__action brand-image-field__action--primary"
          :disabled="uploading"
          @click="openCropDialog"
        >
          {{ uploading ? '上传中...' : value ? '重新裁剪' : '裁剪上传' }}
        </button>
        <button type="button" class="brand-image-field__action" @click="toggleManualInput">
          {{ showManualInput ? '收起地址' : '使用地址' }}
        </button>
        <button v-if="value" type="button" class="brand-image-field__action" @click="clearImage">
          清空
        </button>
      </div>

      <ElInput
        v-if="showManualInput"
        v-model.trim="value"
        :placeholder="inputPlaceholder"
        clearable
        class="mt-3"
        :style="{ width: previewStyle.width }"
      />
    </div>

    <BrandCropDialog
      v-model="cropDialogVisible"
      :title="title"
      :preview-mode="previewMode"
      :img-url="value"
      @crop-done="handleCropDone"
      @error="handleCropError"
    />
  </article>
</template>

<script setup lang="ts">
  import { uploadMedia } from '@/api/media'
  import BrandCropDialog from './brand-crop-dialog.vue'
  import { Plus } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  interface Props {
    modelValue?: string
    title: string
    tip?: string
    previewMode?: 'square' | 'wide'
    inputPlaceholder?: string
    emptyText?: string
  }

  interface CropResult {
    fileName: string
    file: File
    blob: Blob
    dataURL: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    tip: '',
    previewMode: 'square',
    inputPlaceholder: '请输入图片地址',
    emptyText: '点击上传图片'
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()

  const uploading = ref(false)
  const showManualInput = ref(false)
  const cropDialogVisible = ref(false)

  const value = computed({
    get: () => props.modelValue || '',
    set: (newValue: string) => emit('update:modelValue', newValue)
  })

  const previewStyle = computed(() => ({
    width: '160px',
    height: '160px'
  }))

  const toggleManualInput = () => {
    showManualInput.value = !showManualInput.value
  }

  const clearImage = () => {
    value.value = ''
    showManualInput.value = false
  }

  const openCropDialog = () => {
    cropDialogVisible.value = true
  }

  const handleCropError = (error: unknown) => {
    console.error('裁剪失败:', error)
  }

  const handleCropDone = async (result: CropResult) => {
    cropDialogVisible.value = false

    try {
      uploading.value = true
      const file =
        result.file || new File([result.blob], result.fileName, { type: result.blob.type })
      const data = await uploadMedia(file)
      value.value = data.url
      ElMessage.success('图片上传成功')
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('图片上传失败')
      ElMessage.error(uploadError.message)
    } finally {
      uploading.value = false
    }
  }
</script>

<style scoped lang="scss">
  .brand-image-field {
    display: block;
  }

  .brand-image-field__empty {
    padding: 0;
    cursor: pointer;
  }

  .brand-image-field__image {
    display: block;
    cursor: pointer;
    object-fit: cover;
    border-radius: 6px;
  }

  .brand-image-field__actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
    font-size: 12px;
  }

  .brand-image-field__action {
    padding: 0;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: transparent;
    border: none;
  }

  .brand-image-field__action--primary {
    color: var(--theme-color);
  }

  .brand-image-field__action:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
</style>
