<template>
  <ElDialog
    :model-value="modelValue"
    :title="title"
    :width="dialogWidth"
    top="4vh"
    class="ease-media-picker-dialog"
    append-to-body
    destroy-on-close
    @update:model-value="updateVisible"
  >
    <div class="ease-media-picker" :style="{ height: pickerHeight }">
      <div class="ease-media-picker__filters">
        <ElInput
          v-model.trim="keyword"
          clearable
          placeholder="搜索文件名/文件格式"
          class="ease-media-picker__search"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>

        <ElSelect
          v-model="activeMediaType"
          :clearable="!typeLocked"
          :disabled="typeLocked"
          placeholder="文件类型"
          class="ease-media-picker__type"
          @change="handleSearch"
          @clear="handleSearch"
        >
          <ElOption label="图片" value="IMAGE" />
          <ElOption label="视频" value="VIDEO" />
          <ElOption label="其他" value="OTHER" />
        </ElSelect>
      </div>

      <div v-loading="loading" class="ease-media-picker__body">
        <div v-if="!list.length && !loading" class="ease-media-picker__empty">
          <ElEmpty description="暂无文件" :image-size="150">
            <ElUpload
              :show-file-list="false"
              :http-request="handleUpload"
              :before-upload="beforeUpload"
              :accept="uploadAccept"
              :disabled="uploading"
            >
              <ElButton type="primary" :loading="uploading">上传文件</ElButton>
            </ElUpload>
          </ElEmpty>
        </div>

        <template v-else>
          <ElScrollbar class="ease-media-picker__scroll">
            <div class="ease-media-picker__grid">
              <ElUpload
                class="ease-media-picker__upload"
                :show-file-list="false"
                :http-request="handleUpload"
                :before-upload="beforeUpload"
                :accept="uploadAccept"
                :disabled="uploading"
              >
                <div class="ease-media-picker__upload-tile">
                  <ElIcon><Plus /></ElIcon>
                  <span>{{ uploading ? '上传中...' : '上传文件' }}</span>
                </div>
              </ElUpload>

              <article
                v-for="item in list"
                :key="item.id"
                class="ease-media-picker__item"
                :class="{ 'is-selected': isSelected(item) }"
                tabindex="0"
                role="button"
                @click="toggleSelect(item)"
                @keydown.enter.prevent="toggleSelect(item)"
                @keydown.space.prevent="toggleSelect(item)"
              >
                <div class="ease-media-picker__thumb">
                  <img
                    v-if="isImageLike(item) && getDisplayUrl(item)"
                    :src="getDisplayUrl(item)"
                    :alt="item.originalName"
                    class="ease-media-picker__thumb-image"
                  />
                  <div v-else class="ease-media-picker__thumb-placeholder">
                    <ElIcon>
                      <component :is="getFileIcon(item)" />
                    </ElIcon>
                  </div>

                  <span v-if="getExtension(item)" class="ease-media-picker__extension">
                    {{ getExtension(item) }}
                  </span>

                  <span v-if="isSelected(item)" class="ease-media-picker__check">
                    <ElIcon><Check /></ElIcon>
                  </span>

                  <button
                    v-if="item.mediaType === 'IMAGE' && item.url"
                    type="button"
                    class="ease-media-picker__preview"
                    aria-label="预览原图"
                    @click.stop="openPreview(item)"
                  >
                    <ElIcon><View /></ElIcon>
                  </button>
                </div>

                <div class="ease-media-picker__name" :title="item.originalName || item.url">
                  {{ item.originalName || `文件 #${item.id}` }}
                </div>
              </article>
            </div>
          </ElScrollbar>

          <div class="ease-media-picker__pagination">
            <ElPagination
              background
              layout="prev, pager, next"
              :current-page="current"
              :page-size="pageSize"
              :total="total"
              :pager-count="5"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="ease-media-picker__footer">
        <span>已选 {{ selectedItems.length }} 个文件</span>
        <ElSpace>
          <ElButton @click="updateVisible(false)">取消</ElButton>
          <ElButton
            type="primary"
            :disabled="!selectedItems.length"
            :loading="uploading"
            @click="handleConfirm"
          >
            完成
          </ElButton>
        </ElSpace>
      </div>
    </template>
  </ElDialog>

  <ElDialog
    v-model="previewVisible"
    title="原图预览"
    width="720px"
    append-to-body
    class="ease-media-picker-preview"
  >
    <img :src="previewUrl" alt="原图预览" class="ease-media-picker-preview__image" />
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useWindowSize } from '@vueuse/core'
  import {
    Check,
    Document,
    Picture,
    Plus,
    Search,
    VideoCamera,
    View
  } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import type { UploadProps, UploadRequestOptions } from 'element-plus'
  import { fetchMediaPage, uploadMedia, type MediaFileItem, type MediaType } from '@/api/media'

  defineOptions({ name: 'EaseMediaPicker' })

  interface Props {
    modelValue: boolean
    title?: string
    multiple?: boolean
    limit?: number
    pageSize?: number
    mediaType?: MediaType | ''
    typeLocked?: boolean
    selectedUrls?: string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '从文件库中选择',
    multiple: false,
    limit: 0,
    pageSize: 24,
    mediaType: '',
    typeLocked: false,
    selectedUrls: () => []
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', value: MediaFileItem[]): void
  }>()

  const { width } = useWindowSize()

  const keyword = ref('')
  const activeMediaType = ref<MediaType | ''>('')
  const current = ref(1)
  const total = ref(0)
  const list = ref<MediaFileItem[]>([])
  const loading = ref(false)
  const uploadingCount = ref(0)
  const selectedMap = ref<Map<number, MediaFileItem>>(new Map())
  const selectionTouched = ref(false)
  const previewVisible = ref(false)
  const previewUrl = ref('')

  const selectedItems = computed(() => Array.from(selectedMap.value.values()))
  const uploading = computed(() => uploadingCount.value > 0)
  const pageSize = computed(() => props.pageSize)
  const typeLocked = computed(() => Boolean(props.typeLocked && props.mediaType))
  const selectionLimit = computed(() => (props.multiple ? Number(props.limit || 0) : 1))

  const dialogWidth = computed(() => {
    if (width.value <= 640) return 'calc(100vw - 16px)'
    if (width.value <= 1280) return 'calc(100vw - 64px)'
    return '1120px'
  })

  const pickerHeight = computed(() => {
    if (width.value <= 640) return 'calc(100vh - 220px)'
    return 'min(620px, calc(100vh - 230px))'
  })

  const uploadAccept = computed(() => {
    const type = activeMediaType.value || props.mediaType
    if (type === 'IMAGE') return 'image/*'
    if (type === 'VIDEO') return 'video/*'
    return undefined
  })

  watch(
    () => props.modelValue,
    (visible) => {
      if (!visible) return
      resetPicker()
      loadMediaList()
    }
  )

  function updateVisible(value: boolean) {
    emit('update:modelValue', value)
  }

  function resetPicker() {
    keyword.value = ''
    activeMediaType.value = props.mediaType || ''
    current.value = 1
    total.value = 0
    list.value = []
    selectedMap.value = new Map()
    selectionTouched.value = false
  }

  async function loadMediaList() {
    try {
      loading.value = true
      const response = await fetchMediaPage({
        current: current.value,
        size: pageSize.value,
        keyword: keyword.value || undefined,
        mediaType: activeMediaType.value || undefined
      })

      list.value = response.records || []
      total.value = response.total || 0
      hydrateInitialSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : '文件加载失败'
      ElMessage.error(message)
    } finally {
      loading.value = false
    }
  }

  function hydrateInitialSelection() {
    if (selectionTouched.value || !props.selectedUrls.length) return

    const selectedUrls = new Set(props.selectedUrls)
    const next = new Map(selectedMap.value)

    for (const item of list.value) {
      if (!item.url || !selectedUrls.has(item.url)) continue

      if (!props.multiple) {
        next.clear()
        next.set(item.id, item)
        break
      }

      next.set(item.id, item)
    }

    selectedMap.value = next
  }

  function handleSearch() {
    current.value = 1
    loadMediaList()
  }

  function handleCurrentChange(page: number) {
    current.value = page
    loadMediaList()
  }

  function isSelected(item: MediaFileItem) {
    return selectedMap.value.has(item.id)
  }

  function toggleSelect(item: MediaFileItem) {
    selectionTouched.value = true

    const next = new Map(selectedMap.value)
    if (next.has(item.id)) {
      next.delete(item.id)
      selectedMap.value = next
      return
    }

    if (!props.multiple) {
      next.clear()
      next.set(item.id, item)
      selectedMap.value = next
      return
    }

    if (selectionLimit.value > 0 && next.size >= selectionLimit.value) {
      ElMessage.warning(`最多选择 ${selectionLimit.value} 个文件`)
      return
    }

    next.set(item.id, item)
    selectedMap.value = next
  }

  function canAutoSelect(item: MediaFileItem) {
    if (!item.id) return false
    if (!props.multiple) return true
    return selectionLimit.value <= 0 || selectedItems.value.length < selectionLimit.value
  }

  function selectUploadedItem(item: MediaFileItem) {
    if (!canAutoSelect(item)) return

    selectionTouched.value = true
    const next = new Map(selectedMap.value)

    if (!props.multiple) next.clear()
    next.set(item.id, item)
    selectedMap.value = next
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const type = activeMediaType.value || props.mediaType

    if (type === 'IMAGE' && !file.type.startsWith('image/')) {
      ElMessage.warning('仅支持上传图片文件')
      return false
    }

    if (type === 'VIDEO' && !file.type.startsWith('video/')) {
      ElMessage.warning('仅支持上传视频文件')
      return false
    }

    return true
  }

  async function handleUpload(options: UploadRequestOptions) {
    try {
      uploadingCount.value += 1
      const data = await uploadMedia(options.file as File)
      selectUploadedItem(data)
      options.onSuccess?.(data)
      ElMessage.success('文件上传成功')
      await loadMediaList()
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

      ElMessage.error(uploadError.message || '上传失败')
    } finally {
      uploadingCount.value = Math.max(uploadingCount.value - 1, 0)
    }
  }

  function handleConfirm() {
    if (!selectedItems.value.length) {
      ElMessage.warning('请选择文件')
      return
    }

    emit('confirm', selectedItems.value)
    updateVisible(false)
  }

  function getDisplayUrl(item: MediaFileItem) {
    return item.thumbnailUrl || item.url
  }

  function isImageLike(item: MediaFileItem) {
    return item.mediaType === 'IMAGE' || Boolean(item.thumbnailUrl)
  }

  function getExtension(item: MediaFileItem) {
    const extension =
      item.extension || (item.originalName.includes('.') ? item.originalName.split('.').pop() : '')

    return String(extension || '').toUpperCase()
  }

  function getFileIcon(item: MediaFileItem) {
    if (item.mediaType === 'VIDEO') return VideoCamera
    if (item.mediaType === 'IMAGE') return Picture
    return Document
  }

  function openPreview(item: MediaFileItem) {
    previewUrl.value = item.url
    previewVisible.value = true
  }
</script>

<style scoped lang="scss">
  :global(.ease-media-picker-dialog) {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 32px);
    margin-bottom: 16px;
  }

  :global(.ease-media-picker-dialog .el-dialog__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :global(.ease-media-picker-dialog .el-dialog__footer) {
    flex: 0 0 auto;
  }

  .ease-media-picker {
    display: flex;
    flex-direction: column;
    min-height: 360px;
  }

  .ease-media-picker__filters {
    display: flex;
    flex: 0 0 auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 16px;
  }

  .ease-media-picker__search {
    width: min(420px, 100%);
  }

  .ease-media-picker__type {
    width: 168px;
  }

  .ease-media-picker__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .ease-media-picker__empty {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  .ease-media-picker__scroll {
    flex: 1;
    min-height: 0;
  }

  .ease-media-picker__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
    gap: 14px;
    align-content: start;
    padding-right: 4px;
  }

  .ease-media-picker__upload {
    min-width: 0;

    :deep(.el-upload) {
      display: block;
      width: 100%;
    }
  }

  .ease-media-picker__upload-tile {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-lighter);
    border: 1px dashed var(--el-border-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease;
  }

  .ease-media-picker__upload-tile:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .ease-media-picker__upload-tile .el-icon {
    font-size: 28px;
  }

  .ease-media-picker__item {
    min-width: 0;
    cursor: pointer;
    outline: none;
  }

  .ease-media-picker__thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .ease-media-picker__item:hover .ease-media-picker__thumb,
  .ease-media-picker__item:focus-visible .ease-media-picker__thumb {
    border-color: var(--el-color-primary-light-5);
  }

  .ease-media-picker__item.is-selected .ease-media-picker__thumb {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }

  .ease-media-picker__thumb-image,
  .ease-media-picker-preview__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ease-media-picker__thumb-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--el-text-color-secondary);
  }

  .ease-media-picker__thumb-placeholder .el-icon {
    font-size: 36px;
  }

  .ease-media-picker__extension,
  .ease-media-picker__check,
  .ease-media-picker__preview {
    position: absolute;
  }

  .ease-media-picker__extension {
    right: 6px;
    bottom: 6px;
    max-width: calc(100% - 12px);
    padding: 2px 7px;
    overflow: hidden;
    font-size: 12px;
    line-height: 18px;
    color: #fff;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: rgb(0 0 0 / 54%);
    border-radius: 4px;
  }

  .ease-media-picker__check {
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #fff;
    background: var(--el-color-primary);
    border-radius: 50%;
  }

  .ease-media-picker__preview {
    right: 6px;
    bottom: 6px;
    display: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: #fff;
    background: rgb(0 0 0 / 54%);
    border: 0;
    border-radius: 50%;
  }

  .ease-media-picker__item:hover .ease-media-picker__preview {
    display: flex;
  }

  .ease-media-picker__item:hover .ease-media-picker__extension {
    display: none;
  }

  .ease-media-picker__name {
    margin-top: 8px;
    overflow: hidden;
    font-size: 13px;
    line-height: 20px;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ease-media-picker__pagination {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    padding-top: 16px;
  }

  .ease-media-picker__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: var(--el-text-color-regular);
  }

  .ease-media-picker-preview__image {
    max-height: calc(100vh - 240px);
    object-fit: contain;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  @media (width <= 640px) {
    .ease-media-picker__filters {
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    }

    .ease-media-picker__search,
    .ease-media-picker__type {
      width: 100%;
    }

    .ease-media-picker__grid {
      grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
      gap: 12px;
    }

    .ease-media-picker__footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .ease-media-picker__footer :deep(.el-space) {
      justify-content: flex-end;
    }
  }
</style>
