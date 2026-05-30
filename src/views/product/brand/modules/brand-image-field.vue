<template>
  <article>
    <div v-if="title" class="text-sm font-medium text-[var(--el-text-color-primary)]">{{
      title
    }}</div>

    <div :class="title ? 'mt-2' : ''">
      <button
        v-if="!value"
        type="button"
        class="flex-cc flex-col rounded-md border border-dashed border-[var(--art-card-border)] bg-transparent p-0"
        :style="previewStyle"
        @click="openCropDialog"
      >
        <ElIcon class="!text-xl !text-[var(--el-text-color-secondary)]"><Plus /></ElIcon>
        <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">{{ emptyText }}</div>
      </button>

      <ElImage
        v-else
        :src="value"
        :alt="title"
        class="block cursor-pointer rounded-md object-cover"
        :style="previewStyle"
        :preview-src-list="[value]"
        preview-teleported
      />

      <div v-if="tip" class="mt-2 text-xs text-[var(--el-text-color-secondary)]">{{ tip }}</div>

      <ElSpace wrap class="mt-1.5">
        <ElButton link type="primary" :disabled="uploading" @click="openCropDialog">
          {{ uploading ? '上传中...' : value ? '重新裁剪' : '裁剪上传' }}
        </ElButton>
        <ElButton link type="primary" @click="openMediaPicker"> 从文件库选择 </ElButton>
        <ElButton link @click="toggleManualInput">
          {{ showManualInput ? '收起地址' : '使用地址' }}
        </ElButton>
        <ElButton v-if="value" link @click="clearImage"> 清空 </ElButton>
      </ElSpace>

      <ElInput
        v-if="showManualInput"
        v-model.trim="value"
        :placeholder="inputPlaceholder"
        clearable
        class="mt-2.5 w-full"
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

    <EaseMediaPicker
      v-model="mediaPickerVisible"
      media-type="IMAGE"
      type-locked
      :selected-urls="value ? [value] : []"
      @confirm="handleMediaConfirm"
    />
  </article>
</template>

<script setup lang="ts">
  import { uploadMedia, type MediaFileItem } from '@/api/media'
  import EaseMediaPicker from '@/components/project/ease-media-picker/index.vue'
  import BrandCropDialog from './brand-crop-dialog.vue'
  import { Plus } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'

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
  const mediaPickerVisible = ref(false)
  const { width } = useWindowSize()

  const value = computed({
    get: () => props.modelValue || '',
    set: (newValue: string) => emit('update:modelValue', newValue)
  })

  const previewStyle = computed(() => ({
    width: width.value <= 640 ? '100%' : props.previewMode === 'wide' ? '240px' : '160px',
    maxWidth: props.previewMode === 'wide' ? '240px' : '160px',
    height: props.previewMode === 'wide' ? '135px' : '160px'
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

  const openMediaPicker = () => {
    mediaPickerVisible.value = true
  }

  const handleCropError = (error: unknown) => {
    console.error('裁剪失败:', error)
  }

  const handleMediaConfirm = (items: MediaFileItem[]) => {
    const selected = items[0]
    if (!selected?.url) return
    value.value = selected.url
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
