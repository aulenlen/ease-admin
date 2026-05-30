<template>
  <div class="marketing-media-page art-full-height">
    <ElCard class="art-table-card marketing-media-page__surface">
      <aside class="marketing-media-page__sidebar">
        <div class="marketing-media-page__sidebar-header">
          <div class="min-w-0">
            <div class="truncate text-base font-semibold text-[var(--el-text-color-primary)]">
              素材分组
            </div>
          </div>

          <ElButton type="primary" text @click="openCreateGroup" v-ripple>
            <ElIcon><Plus /></ElIcon>
          </ElButton>
        </div>

        <ElScrollbar class="marketing-media-page__group-scroll">
          <div class="marketing-media-page__group-list">
            <button
              v-for="item in groupNavItems"
              :key="item.key"
              type="button"
              class="marketing-media-page__group-item"
              :class="{ 'is-active': item.value === activeGroupId }"
              @click="handleGroupSelect(item.value)"
            >
              <span class="marketing-media-page__group-name">{{ item.label }}</span>

              <span v-if="item.group" class="marketing-media-page__group-actions">
                <button type="button" aria-label="编辑分组" @click.stop="openEditGroup(item.group)">
                  <ElIcon><EditPen /></ElIcon>
                </button>
                <button
                  type="button"
                  aria-label="删除分组"
                  @click.stop="handleDeleteGroup(item.group)"
                >
                  <ElIcon><Delete /></ElIcon>
                </button>
              </span>
            </button>
          </div>
        </ElScrollbar>
      </aside>

      <main class="marketing-media-page__content">
        <EaseTablePage
          embedded
          v-model:columns="columnChecks"
          v-model:showSearchBar="showSearchBar"
          :loading="loading"
          :selection-count="selectedFileIds.length"
          @refresh="refreshAll"
        >
          <template #pageActions>
            <ElButton type="primary" @click="openUploadDialog" v-ripple>
              <ElIcon><Upload /></ElIcon>
              上传文件
            </ElButton>
          </template>

          <template #search>
            <EaseTableSearch columns="280px 150px">
              <ElInput
                v-model="searchForm.keyword"
                clearable
                placeholder="搜索文件名"
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <ElIcon><Search /></ElIcon>
                </template>
              </ElInput>

              <ElSelect
                v-model="searchForm.mediaType"
                clearable
                placeholder="文件类型"
                @change="handleSearch"
                @clear="handleSearch"
              >
                <ElOption label="图片" value="IMAGE" />
                <ElOption label="视频" value="VIDEO" />
                <ElOption label="其他" value="OTHER" />
              </ElSelect>
            </EaseTableSearch>
          </template>

          <template #selectionText="{ count }">已选{{ count }}个文件</template>

          <template #selectionActions>
            <ElButton @click="openMoveDialog()" v-ripple>移动分组</ElButton>
            <ElButton type="danger" plain @click="handleBatchDelete" v-ripple>删除</ElButton>
          </template>

          <template #table>
            <ArtTable
              ref="tableRef"
              row-key="id"
              :loading="loading"
              :data="data"
              :columns="columns"
              :pagination="pagination"
              :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
              :show-table-header="false"
              @selection-change="handleSelectionChange"
              @pagination:size-change="handleSizeChange"
              @pagination:current-change="handleCurrentChange"
            />
          </template>
        </EaseTablePage>
      </main>
    </ElCard>

    <ElDialog
      v-model="groupDialogVisible"
      :title="groupDialogMode === 'add' ? '新建分组' : '编辑分组'"
      width="420px"
    >
      <ElForm label-width="80px">
        <ElFormItem label="分组名称" required>
          <ElInput
            v-model="groupForm.name"
            maxlength="30"
            show-word-limit
            placeholder="请输入分组名称"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="groupDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="groupSubmitting" @click="submitGroup">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="uploadDialogVisible" title="上传文件" width="760px">
      <div class="marketing-media-page__upload-dialog">
        <ElForm label-position="top">
          <ElFormItem label="选择文件分组位置">
            <ElSelect v-model="uploadTargetGroupId" class="w-full" placeholder="请选择文件分组">
              <ElOption label="所有文件" :value="0" />
              <ElOption
                v-for="group in mediaGroups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </ElSelect>
          </ElFormItem>
        </ElForm>

        <ElUpload
          class="marketing-media-page__upload-dragger"
          drag
          multiple
          :show-file-list="false"
          :http-request="handleDirectUpload"
          :before-upload="beforeUpload"
          :disabled="uploading"
        >
          <ElIcon class="el-icon--upload"><Plus /></ElIcon>
          <div class="el-upload__text">添加文件（或把文件拖到框内）</div>
        </ElUpload>

        <div class="marketing-media-page__upload-tips">
          <div>视频：支持 .mp4 格式，最大限制20MB</div>
          <div
            >图片：支持 .gif、.pjp、.jpg、.pjpeg、.jpeg、.jfif、.png、.bmp、.webp、.svg、.ico
            格式，最大限制10MB</div
          >
          <div
            >文件：支持 .pdf、.xlsx、.csv、.docx、.ttf、.woff、.woff2、.otf、.txt
            格式，最大限制20MB</div
          >
        </div>
      </div>
    </ElDialog>

    <ElDialog v-model="moveDialogVisible" title="移动分组" width="420px">
      <ElForm label-width="80px">
        <ElFormItem label="目标分组">
          <ElSelect v-model="moveTargetGroupId" class="w-full" placeholder="请选择分组">
            <ElOption
              v-for="group in mediaGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="moveDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="moving" @click="submitMove">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, ref } from 'vue'
  import {
    Delete,
    Document,
    EditPen,
    Picture,
    Plus,
    Search,
    Upload,
    VideoCamera
  } from '@element-plus/icons-vue'
  import {
    ElIcon,
    ElImage,
    ElMessage,
    ElMessageBox,
    ElTag,
    type UploadProps,
    type UploadRequestOptions
  } from 'element-plus'
  import {
    createMediaGroup,
    deleteMediaFile,
    deleteMediaGroup,
    downloadMediaFile,
    fetchMediaGroups,
    fetchMediaPage,
    moveMediaFile,
    updateMediaGroup,
    uploadMedia,
    type MediaFileItem,
    type MediaGroupItem,
    type MediaType
  } from '@/api/media'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import type { ColumnOption } from '@/types/component'
  import { formatDateTime } from '@/utils/date'

  defineOptions({ name: 'MarketingMediaPage' })

  interface MediaSearchForm {
    keyword?: string
    mediaType?: MediaType
  }

  interface GroupNavItem {
    key: string
    label: string
    value?: number
    group?: MediaGroupItem
  }

  const UPLOAD_SIZE_UNIT = 1024 * 1024
  const IMAGE_UPLOAD_EXTENSIONS = [
    'gif',
    'pjp',
    'jpg',
    'pjpeg',
    'jpeg',
    'jfif',
    'png',
    'bmp',
    'webp',
    'svg',
    'ico'
  ]
  const VIDEO_UPLOAD_EXTENSIONS = ['mp4']
  const FILE_UPLOAD_EXTENSIONS = [
    'pdf',
    'xlsx',
    'csv',
    'docx',
    'ttf',
    'woff',
    'woff2',
    'otf',
    'txt'
  ]

  const tableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()

  const showSearchBar = ref(true)
  const activeGroupId = ref<number | undefined>(undefined)
  const mediaGroups = ref<MediaGroupItem[]>([])
  const selectedFileIds = ref<number[]>([])

  const searchForm = ref<MediaSearchForm>({
    keyword: undefined,
    mediaType: undefined
  })

  const groupDialogVisible = ref(false)
  const groupDialogMode = ref<'add' | 'edit'>('add')
  const groupSubmitting = ref(false)
  const editingGroupId = ref<number | null>(null)
  const groupForm = ref({ name: '', sort: 0 })

  const uploadDialogVisible = ref(false)
  const uploadingCount = ref(0)
  const uploadSuccessPending = ref(false)
  const uploadTargetGroupId = ref<number>(0)

  const moveDialogVisible = ref(false)
  const moving = ref(false)
  const movingRows = ref<MediaFileItem[]>([])
  const moveTargetGroupId = ref<number>(0)

  const groupNavItems = computed<GroupNavItem[]>(() => [
    { key: 'all', label: '全部素材', value: undefined },
    ...mediaGroups.value.map((group) => ({
      key: String(group.id),
      label: group.name,
      value: group.id,
      group
    }))
  ])

  const selectedRows = computed(() =>
    data.value.filter((item) => selectedFileIds.value.includes(item.id))
  )
  const uploading = computed(() => uploadingCount.value > 0)

  const buildSearchParams = () => ({
    keyword: searchForm.value.keyword?.trim() || undefined,
    mediaType: searchForm.value.mediaType,
    groupId: activeGroupId.value
  })

  const renderFileInfo = (row: MediaFileItem) =>
    h('div', { class: 'flex items-center gap-3 min-w-0' }, [
      renderFileThumb(row),
      h('div', { class: 'min-w-0 flex-1' }, [
        h(
          'div',
          { class: 'font-medium text-g-900 truncate' },
          row.originalName || `文件 #${row.id}`
        ),
        h('div', { class: 'text-xs text-g-500 truncate' }, row.url || '-')
      ])
    ])

  const renderFileThumb = (row: MediaFileItem) => {
    const src = row.thumbnailUrl || row.url

    if (row.mediaType === 'IMAGE' && src) {
      return h(ElImage, {
        src,
        fit: 'cover',
        class: 'size-10 shrink-0 rounded-lg',
        previewSrcList: [row.url],
        previewTeleported: true
      })
    }

    const icon =
      row.mediaType === 'VIDEO' ? VideoCamera : row.mediaType === 'IMAGE' ? Picture : Document

    return h(
      'div',
      {
        class:
          'size-10 shrink-0 rounded-lg bg-[var(--el-fill-color-light)] text-g-500 flex items-center justify-center'
      },
      [h(ElIcon, { size: 20 }, () => h(icon))]
    )
  }

  const renderMediaType = (row: MediaFileItem) => {
    const labelMap: Record<MediaType, string> = {
      IMAGE: '图片',
      VIDEO: '视频',
      OTHER: '其他'
    }

    const typeMap: Record<MediaType, 'success' | 'warning' | 'info'> = {
      IMAGE: 'success',
      VIDEO: 'warning',
      OTHER: 'info'
    }

    return h(
      ElTag,
      {
        type: typeMap[row.mediaType],
        effect: 'light'
      },
      () => labelMap[row.mediaType]
    )
  }

  const renderOperation = (row: MediaFileItem) =>
    h('div', { class: 'flex items-center gap-1' }, [
      h(ArtButtonTable, {
        icon: 'ri:file-copy-line',
        iconClass: 'ease-table-action',
        onClick: () => copyMediaUrl(row)
      }),
      h(ArtButtonTable, {
        icon: 'ri:download-line',
        iconClass: 'ease-table-action',
        onClick: () => handleDownload(row)
      }),
      h(ArtButtonTable, {
        icon: 'ri:folder-transfer-line',
        iconClass: 'ease-table-action',
        onClick: () => openMoveDialog(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDeleteFile(row)
      })
    ])

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchMediaPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: (): ColumnOption<MediaFileItem>[] => [
        { type: 'selection', width: 56 },
        {
          prop: 'originalName',
          label: '文件',
          minWidth: 320,
          formatter: renderFileInfo
        },
        {
          prop: 'mediaType',
          label: '类型',
          width: 110,
          formatter: renderMediaType
        },
        {
          prop: 'extension',
          label: '格式',
          width: 100,
          formatter: (row) => row.extension || getFileExtension(row.originalName) || '-'
        },
        {
          prop: 'fileSize',
          label: '大小',
          width: 120,
          formatter: (row) => formatBytes(row.fileSize)
        },
        {
          prop: 'createTime',
          label: '上传时间',
          minWidth: 180,
          sortable: true,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 170,
          fixed: 'right',
          formatter: renderOperation
        }
      ]
    }
  })

  function getFileExtension(name?: string) {
    if (!name?.includes('.')) return ''
    return name.split('.').pop()?.toUpperCase() || ''
  }

  function formatBytes(value: number) {
    const size = Number(value || 0)
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / 1024 / 1024).toFixed(1)}MB`
  }

  function clearSelection() {
    selectedFileIds.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
  }

  async function loadGroups() {
    mediaGroups.value = await fetchMediaGroups()
  }

  async function refreshAll() {
    clearSelection()
    await Promise.all([loadGroups(), refreshData()])
  }

  function handleSearch() {
    clearSelection()
    replaceSearchParams(buildSearchParams())
    getData()
  }

  function handleGroupSelect(groupId?: number) {
    activeGroupId.value = groupId
    handleSearch()
  }

  function handleSelectionChange(selection: MediaFileItem[]) {
    selectedFileIds.value = selection.map((item) => item.id)
  }

  function openCreateGroup() {
    groupDialogMode.value = 'add'
    editingGroupId.value = null
    groupForm.value = { name: '', sort: 0 }
    groupDialogVisible.value = true
  }

  function openEditGroup(group: MediaGroupItem) {
    groupDialogMode.value = 'edit'
    editingGroupId.value = group.id
    groupForm.value = { name: group.name, sort: group.sort ?? 0 }
    groupDialogVisible.value = true
  }

  async function submitGroup() {
    const name = groupForm.value.name.trim()
    if (!name) {
      ElMessage.warning('请输入分组名称')
      return
    }

    groupSubmitting.value = true
    try {
      if (groupDialogMode.value === 'edit' && editingGroupId.value) {
        await updateMediaGroup(editingGroupId.value, { name, sort: groupForm.value.sort })
      } else {
        await createMediaGroup({ name, sort: groupForm.value.sort })
      }

      groupDialogVisible.value = false
      await loadGroups()
    } finally {
      groupSubmitting.value = false
    }
  }

  async function handleDeleteGroup(group: MediaGroupItem) {
    await ElMessageBox.confirm('删除分组不会删除素材文件，确定继续吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    await deleteMediaGroup(group.id)

    if (activeGroupId.value === group.id) {
      activeGroupId.value = undefined
      handleSearch()
    }

    await loadGroups()
  }

  function openUploadDialog() {
    uploadTargetGroupId.value = activeGroupId.value ?? 0
    uploadSuccessPending.value = false
    uploadDialogVisible.value = true
  }

  function getUploadExtension(file: File) {
    return file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : ''
  }

  function getUploadLimit(file: File) {
    const extension = getUploadExtension(file)

    if (IMAGE_UPLOAD_EXTENSIONS.includes(extension)) {
      return { maxSize: 10 * UPLOAD_SIZE_UNIT, label: '图片' }
    }

    if (VIDEO_UPLOAD_EXTENSIONS.includes(extension)) {
      return { maxSize: 20 * UPLOAD_SIZE_UNIT, label: '视频' }
    }

    if (FILE_UPLOAD_EXTENSIONS.includes(extension)) {
      return { maxSize: 20 * UPLOAD_SIZE_UNIT, label: '文件' }
    }

    return null
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const rule = getUploadLimit(file)

    if (!rule) {
      ElMessage.warning('当前文件格式不支持')
      return false
    }

    if (file.size > rule.maxSize) {
      ElMessage.warning(`${rule.label}大小不能超过 ${rule.maxSize / UPLOAD_SIZE_UNIT}MB`)
      return false
    }

    return true
  }

  function getUploadGroupId() {
    return uploadTargetGroupId.value > 0 ? uploadTargetGroupId.value : undefined
  }

  async function handleDirectUpload(options: UploadRequestOptions) {
    uploadingCount.value += 1
    try {
      const data = await uploadMedia(options.file as File, getUploadGroupId())
      options.onSuccess?.(data)
      uploadSuccessPending.value = true
      ElMessage.success('文件上传成功')
      await refreshData()
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

      if (uploadingCount.value === 0 && uploadSuccessPending.value) {
        uploadDialogVisible.value = false
        uploadSuccessPending.value = false
      }
    }
  }

  function openMoveDialog(row?: MediaFileItem) {
    movingRows.value = row ? [row] : selectedRows.value

    if (!movingRows.value.length) {
      ElMessage.warning('请选择要移动的文件')
      return
    }

    moveTargetGroupId.value = movingRows.value.length === 1 ? (movingRows.value[0].groupId ?? 0) : 0
    moveDialogVisible.value = true
  }

  async function submitMove() {
    moving.value = true
    try {
      await Promise.all(
        movingRows.value.map((row) => moveMediaFile(row.id, moveTargetGroupId.value))
      )
      moveDialogVisible.value = false
      clearSelection()
      await refreshData()
    } finally {
      moving.value = false
    }
  }

  async function handleDeleteFile(row: MediaFileItem) {
    await ElMessageBox.confirm('此操作无法撤销。确定要删除该文件吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    await deleteMediaFile(row.id)
    clearSelection()
    await refreshData()
  }

  async function handleBatchDelete() {
    if (!selectedRows.value.length) return

    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个文件吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await Promise.all(selectedRows.value.map((row) => deleteMediaFile(row.id)))
    clearSelection()
    await refreshData()
  }

  async function copyMediaUrl(row: MediaFileItem) {
    if (!row.url) {
      ElMessage.warning('当前文件没有可复制链接')
      return
    }

    await navigator.clipboard.writeText(row.url)
    ElMessage.success('链接已复制')
  }

  async function handleDownload(row: MediaFileItem) {
    const blob = await downloadMediaFile(row.id)
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = href
    link.download = row.originalName || `media-${row.id}`
    link.click()

    URL.revokeObjectURL(href)
  }

  onMounted(async () => {
    await Promise.all([loadGroups(), getData()])
  })
</script>

<style scoped lang="scss">
  .marketing-media-page {
    min-height: 0;
  }

  :deep(.marketing-media-page__surface > .el-card__body) {
    display: flex;
    height: 100%;
    min-height: 0;
    padding: 0;
  }

  .marketing-media-page__sidebar {
    display: flex;
    flex: 0 0 260px;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid var(--el-border-color-lighter);
  }

  .marketing-media-page__sidebar-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .marketing-media-page__group-scroll {
    flex: 1;
    min-height: 0;
  }

  .marketing-media-page__group-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px;
  }

  .marketing-media-page__group-item {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 36px;
    padding: 0 10px;
    color: var(--el-text-color-regular);
    text-align: left;
    cursor: pointer;
    border-radius: var(--custom-radius);
  }

  .marketing-media-page__group-item:hover,
  .marketing-media-page__group-item.is-active {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 8%, transparent);
  }

  .marketing-media-page__group-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .marketing-media-page__group-actions {
    display: inline-flex;
    flex-shrink: 0;
    gap: 4px;
    opacity: 0;
  }

  .marketing-media-page__group-item:hover .marketing-media-page__group-actions {
    opacity: 1;
  }

  .marketing-media-page__group-actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .marketing-media-page__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 16px;
  }

  :deep(.marketing-media-page__content > .ease-table-page) {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .marketing-media-page__upload-dialog {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .marketing-media-page__upload-dialog :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .marketing-media-page__upload-dialog :deep(.el-form-item__label) {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .marketing-media-page__upload-dragger :deep(.el-upload) {
    width: 100%;
  }

  .marketing-media-page__upload-dragger :deep(.el-upload-dragger) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    background: var(--el-fill-color-lighter);
    border-color: var(--el-border-color);
  }

  .marketing-media-page__upload-dragger :deep(.el-icon--upload) {
    margin-bottom: 8px;
    font-size: 30px;
    line-height: 1;
    color: var(--el-text-color-regular);
  }

  .marketing-media-page__upload-tips {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  @media (width <= 900px) {
    :deep(.marketing-media-page__surface > .el-card__body) {
      flex-direction: column;
    }

    .marketing-media-page__sidebar {
      flex: none;
      height: 260px;
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
