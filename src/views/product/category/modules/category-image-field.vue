<template>
  <ElPopover
    v-model:visible="popoverVisible"
    trigger="click"
    placement="bottom-start"
    :width="popoverWidth"
    append-to-body
  >
    <template #reference>
      <button type="button" class="category-image-field__trigger">
        <div v-if="modelValue" class="category-image-field__thumb">
          <img :src="modelValue" alt="分类图片" class="category-image-field__thumb-image" />
        </div>
        <div v-else class="category-image-field__thumb category-image-field__thumb--empty">
          <ElIcon class="category-image-field__thumb-icon"><Picture /></ElIcon>
        </div>

        <div class="category-image-field__text">
          <div class="category-image-field__title">
            {{ modelValue ? '已设置分类图片' : '设置分类图片' }}
          </div>
          <div class="category-image-field__description">
            {{ modelValue ? '点击查看、修改地址或重新上传' : '支持输入图片地址或直接上传图片' }}
          </div>
        </div>
      </button>
    </template>

    <div class="category-image-field__panel">
      <div class="category-image-field__preview">
        <img
          v-if="modelValue"
          :src="modelValue"
          alt="分类图片预览"
          class="category-image-field__preview-image"
        />
        <div v-else class="category-image-field__preview-empty">
          <ElIcon><Picture /></ElIcon>
          <span>暂无分类图片</span>
        </div>
      </div>

      <EaseSegmentTabs v-model="activeTab" :items="tabOptions" />

      <div class="category-image-field__editor">
        <template v-if="activeTab === 'url'">
          <ElInput
            v-model.trim="draftValue"
            clearable
            placeholder="请输入分类图片地址"
            @keyup.enter="applyUrl"
          >
            <template #append>
              <ElButton text @click="applyUrl">应用</ElButton>
            </template>
          </ElInput>

          <div class="category-image-field__tip"
            >支持粘贴完整图片 URL，应用后会立即替换当前图片</div
          >
        </template>

        <template v-else>
          <ElUpload
            class="category-image-field__upload"
            accept="image/*"
            :show-file-list="false"
            :http-request="handleUpload"
            :before-upload="beforeUpload"
          >
            <ElButton :loading="uploading">
              {{ uploading ? '上传中...' : modelValue ? '重新上传图片' : '上传图片' }}
            </ElButton>
          </ElUpload>

          <div class="category-image-field__tip">仅支持图片文件，上传成功后将直接替换当前图片</div>
        </template>
      </div>

      <div class="category-image-field__actions">
        <ElButton text @click="popoverVisible = false">关闭</ElButton>
        <ElButton v-if="modelValue" text type="danger" @click="clearValue">清空</ElButton>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import { uploadMedia } from '@/api/media'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import { Picture } from '@element-plus/icons-vue'
  import { useWindowSize } from '@vueuse/core'
  import type { UploadProps, UploadRequestOptions } from 'element-plus'

  interface Props {
    modelValue?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: ''
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const popoverVisible = ref(false)
  const activeTab = ref<'url' | 'upload'>('url')
  const draftValue = ref('')
  const uploading = ref(false)

  const tabOptions = [
    { label: '图片地址', value: 'url' },
    { label: '上传图片', value: 'upload' }
  ]

  const popoverWidth = computed(() => (width.value < 768 ? Math.max(width.value - 32, 280) : 380))

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('仅支持上传图片文件')
      return false
    }
    return true
  }

  function applyUrl() {
    emit('update:modelValue', String(draftValue.value || '').trim())
    popoverVisible.value = false
  }

  function clearValue() {
    draftValue.value = ''
    emit('update:modelValue', '')
    popoverVisible.value = false
  }

  async function handleUpload(options: UploadRequestOptions) {
    try {
      uploading.value = true
      const data = await uploadMedia(options.file as File)
      draftValue.value = data.url
      emit('update:modelValue', data.url)
      ElMessage.success('图片上传成功')
      options.onSuccess?.(data)
      popoverVisible.value = false
    } catch (error) {
      const uploadError = error as Error & {
        status?: number
        method?: string
        url?: string
      }
      ElMessage.error(uploadError.message || '图片上传失败')
      options.onError?.({
        name: uploadError.name || 'UploadError',
        message: uploadError.message || '图片上传失败',
        status: uploadError.status || 500,
        method: uploadError.method || 'POST',
        url: uploadError.url || ''
      })
    } finally {
      uploading.value = false
    }
  }

  watch(
    () => props.modelValue,
    (value) => {
      draftValue.value = String(value || '')
    },
    { immediate: true }
  )

  watch(popoverVisible, (visible) => {
    if (!visible) return
    draftValue.value = String(props.modelValue || '')
  })
</script>

<style scoped lang="scss">
  .category-image-field__trigger {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 12px;
    text-align: left;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: var(--custom-radius);
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;
  }

  .category-image-field__trigger:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
  }

  .category-image-field__thumb {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: calc(var(--custom-radius) - 2px);
  }

  .category-image-field__thumb--empty {
    color: var(--el-text-color-secondary);
  }

  .category-image-field__thumb-image,
  .category-image-field__preview-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .category-image-field__thumb-icon {
    font-size: 20px;
  }

  .category-image-field__text {
    min-width: 0;
  }

  .category-image-field__title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  .category-image-field__description {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .category-image-field__panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .category-image-field__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 168px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--custom-radius);
  }

  .category-image-field__preview-empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .category-image-field__preview-empty .el-icon {
    font-size: 24px;
  }

  .category-image-field__editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-image-field__tip {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .category-image-field__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
</style>
