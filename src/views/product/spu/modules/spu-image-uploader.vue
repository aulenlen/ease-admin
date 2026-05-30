<template>
  <div>
    <ElUpload
      class="spu-image-uploader__upload"
      :file-list="fileList"
      list-type="picture-card"
      :multiple="multiple"
      :limit="limit"
      :http-request="handleHttpRequest"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :before-upload="beforeUpload"
      accept="image/*"
    >
      <ElIcon><Plus /></ElIcon>
    </ElUpload>

    <ElButton link type="primary" class="mt-2" @click="openMediaPicker"> 从文件库添加 </ElButton>

    <div v-if="tip" class="mt-2 text-xs leading-6 text-g-600">{{ tip }}</div>

    <ElDialog v-model="previewVisible" title="图片预览" width="520px">
      <img :src="previewUrl" alt="preview" class="spu-image-uploader__preview w-full" />
    </ElDialog>

    <EaseMediaPicker
      v-model="mediaPickerVisible"
      :multiple="multiple"
      :limit="limit"
      media-type="IMAGE"
      type-locked
      :selected-urls="modelValue"
      @confirm="handleMediaConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { uploadMedia, type MediaFileItem } from '@/api/media'
  import EaseMediaPicker from '@/components/project/ease-media-picker/index.vue'
  import { Plus } from '@element-plus/icons-vue'
  import type { UploadFile, UploadProps, UploadRequestOptions, UploadUserFile } from 'element-plus'

  interface Props {
    modelValue: string[]
    limit?: number
    multiple?: boolean
    tip?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    limit: 1,
    multiple: false,
    tip: ''
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
  }>()

  const previewVisible = ref(false)
  const previewUrl = ref('')
  const mediaPickerVisible = ref(false)

  const fileList = computed<UploadUserFile[]>(() =>
    (props.modelValue || []).map((url, index) => ({
      name: `image-${index + 1}`,
      url
    }))
  )

  const updateValue = (list: string[]) => {
    emit('update:modelValue', list)
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      ElMessage.warning('仅支持上传图片文件')
      return false
    }
    return true
  }

  const handleHttpRequest = async (options: UploadRequestOptions) => {
    try {
      const data = await uploadMedia(options.file as File)
      const nextList = props.multiple
        ? [...(props.modelValue || []), data.url].slice(0, props.limit)
        : [data.url]

      updateValue(nextList)
      options.onSuccess?.(data)
    } catch (error) {
      const uploadError = error as Error & {
        status?: number
        method?: string
        url?: string
      }
      options.onError?.({
        name: uploadError.name || 'UploadError',
        message: uploadError.message || '上传失败',
        status: uploadError.status || 500,
        method: uploadError.method || 'POST',
        url: uploadError.url || ''
      })
    }
  }

  const handleRemove = (file: UploadFile) => {
    const nextList = (props.modelValue || []).filter((item) => item !== file.url)
    updateValue(nextList)
  }

  const handlePreview = (file: UploadFile) => {
    previewUrl.value = file.url || ''
    previewVisible.value = true
  }

  const openMediaPicker = () => {
    mediaPickerVisible.value = true
  }

  const handleMediaConfirm = (items: MediaFileItem[]) => {
    const urls = items.map((item) => item.url).filter(Boolean)
    if (!urls.length) return

    if (!props.multiple) {
      updateValue([urls[0]])
      return
    }

    const nextList = [...(props.modelValue || [])]
    let skipped = 0

    for (const url of urls) {
      if (nextList.includes(url)) continue
      if (nextList.length >= props.limit) {
        skipped += 1
        continue
      }
      nextList.push(url)
    }

    if (skipped > 0) {
      ElMessage.warning(`最多选择 ${props.limit} 张图片`)
    }

    updateValue(nextList)
  }
</script>

<style scoped lang="scss">
  .spu-image-uploader__preview {
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .spu-image-uploader__upload {
    :deep(.el-upload--picture-card),
    :deep(.el-upload-list__item) {
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }

    :deep(.el-upload--picture-card) {
      background: var(--el-fill-color-blank);
      border-color: var(--el-border-color-light);
    }
  }
</style>
