<template>
  <div class="attribute-manager-content">
    <EaseTablePage
      :embedded="embedded"
      v-model:columns="columnChecks"
      :loading="loading"
      :selection-count="selectedIds.length"
      table-header-layout="refresh,size,fullscreen,columns,settings"
      @refresh="handleRefresh"
    >
      <template #pageActions>
        <ElButton type="primary" @click="openEditor()">新增属性</ElButton>
      </template>

      <template #search>
        <EaseTableSearch columns="268px 140px">
          <ElInput
            v-model.trim="keyword"
            placeholder="搜索属性名称或 ID"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <span class="ease-table-search__keyword-suffix">
                <ElIcon
                  v-if="keyword"
                  class="ease-table-search__keyword-icon"
                  @mousedown.prevent
                  @click="clearKeywordAndSearch"
                >
                  <CircleCloseFilled />
                </ElIcon>
                <ElIcon
                  class="ease-table-search__keyword-icon"
                  @mousedown.prevent
                  @click="handleSearch"
                >
                  <Search />
                </ElIcon>
              </span>
            </template>
          </ElInput>
          <ElSelect v-model="currentType" @change="handleSearch">
            <ElOption label="全部" :value="-1" />
            <ElOption label="规格" :value="1" />
            <ElOption label="参数" :value="0" />
          </ElSelect>

          <template v-if="activeFilters.length" #filters>
            <ElTag
              v-for="filter in activeFilters"
              :key="filter.key"
              closable
              effect="light"
              @close="removeFilter(filter.key)"
            >
              {{ filter.label }}
            </ElTag>
          </template>
        </EaseTableSearch>
      </template>

      <template #selectionText="{ count }">已选 {{ count }} 项</template>

      <template #selectionActions>
        <ElButton type="danger" @click="handleBatchDelete">删除</ElButton>
      </template>

      <template #table>
        <ArtTable
          ref="tableRef"
          :loading="loading"
          :data="records"
          row-key="id"
          :columns="columns"
          :pagination="pagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handlePageChange"
        />
      </template>
    </EaseTablePage>

    <ElDialog
      v-model="editorVisible"
      :title="editorForm.id ? '编辑属性' : '新增属性'"
      :width="editorDialogWidth"
      append-to-body
      top="6vh"
      modal-class="attribute-editor-modal"
      destroy-on-close
    >
      <div class="max-h-[72vh] overflow-y-auto pr-1">
        <ElForm label-position="top" class="space-y-3">
          <div
            class="rounded-[var(--custom-radius)] border border-[var(--art-card-border)] px-5 py-4"
          >
            <section class="space-y-4">
              <div class="font-medium text-[var(--el-text-color-primary)]">基础信息</div>

              <ElFormItem label="属性名称" required>
                <ElInput v-model.trim="editorForm.name" maxlength="100" class="w-full" />
              </ElFormItem>

              <ElRow :gutter="16">
                <ElCol :xs="24" :md="12">
                  <ElFormItem label="属性类型" required>
                    <ElSelect v-model="editorForm.type" class="w-full">
                      <ElOption label="规格" :value="1" />
                      <ElOption label="参数" :value="0" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :md="12">
                  <ElFormItem label="单位">
                    <ElInput v-model.trim="editorForm.unit" maxlength="20" class="w-full" />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-[var(--el-text-color-primary)]">支持搜索</span>
                <ElSwitch v-model="searchableValue" />
              </div>

              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-[var(--el-text-color-primary)]">支持筛选</span>
                <ElSwitch v-model="filterableValue" />
              </div>
            </section>

            <ElFormItem label="录入方式" class="mb-0">
              <ElRadioGroup v-model="editorForm.entryMethod">
                <ElRadio :value="1">预设选项</ElRadio>
                <ElRadio :value="0">手工录入</ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <section v-if="Number(editorForm.entryMethod) === 1" class="mt-6 space-y-4">
              <div class="font-medium text-[var(--el-text-color-primary)]">预设选项</div>

              <ElFormItem class="mb-0">
                <OptionTagInput
                  v-model="editorOptionValues"
                  placeholder="每行一个选项，也支持用逗号分隔"
                />
              </ElFormItem>
            </section>
          </div>
        </ElForm>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="editorVisible = false">取消</ElButton>
          <ElButton @click="handleEditorReset">重置</ElButton>
          <ElButton type="primary" :loading="editorSubmitting" @click="handleEditorSubmit">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import OptionTagInput from './option-tag-input.vue'
  import OptionTagPreview from './option-tag-preview.vue'
  import { CircleCloseFilled, Search } from '@element-plus/icons-vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    createCategoryAttribute,
    deleteCategoryAttribute,
    deleteCategoryAttributeBatch,
    fetchCategoryAttributePool,
    getCategoryAttribute,
    updateCategoryAttribute,
    type CategoryAttributePoolItem,
    type CategoryAttributeSavePayload,
    type CategoryAttributeType
  } from '@/api/category-attribute'
  import { useWindowSize } from '@vueuse/core'
  import { ElMessageBox } from 'element-plus'

  interface Props {
    presetType?: -1 | CategoryAttributeType
    embedded?: boolean
  }

  interface Emits {
    (e: 'changed'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    presetType: -1,
    embedded: true
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const editorDialogWidth = computed(() => (width.value < 768 ? 'calc(100vw - 24px)' : '760px'))
  const loading = ref(false)
  const keyword = ref('')
  const currentType = ref<-1 | CategoryAttributeType>(-1)
  const records = ref<CategoryAttributePoolItem[]>([])
  const selectedIds = ref<number[]>([])
  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const editorVisible = ref(false)
  const editorSubmitting = ref(false)
  const editorOptionsText = ref('')
  const editorSnapshot = ref<CategoryAttributeSavePayload>({
    id: undefined,
    name: '',
    type: 1,
    unit: '',
    entryMethod: 1,
    searchable: 1,
    filterable: 1,
    optionList: []
  })
  const editorForm = reactive<CategoryAttributeSavePayload>({
    id: undefined,
    name: '',
    type: 1,
    unit: '',
    entryMethod: 1,
    searchable: 1,
    filterable: 1,
    optionList: []
  })

  const searchableValue = computed({
    get: () => Number(editorForm.searchable ?? 0) === 1,
    set: (value: boolean) => {
      editorForm.searchable = value ? 1 : 0
    }
  })

  const filterableValue = computed({
    get: () => Number(editorForm.filterable ?? 0) === 1,
    set: (value: boolean) => {
      editorForm.filterable = value ? 1 : 0
    }
  })

  const editorOptionValues = computed({
    get: () => parseOptionText(editorOptionsText.value),
    set: (value: string[]) => {
      editorOptionsText.value = value.join('\n')
    }
  })

  const renderAttributeName = (row: CategoryAttributePoolItem) =>
    h('div', [
      h('div', { class: 'font-medium' }, row.name),
      h('div', { class: 'mt-1 text-xs text-[var(--el-text-color-secondary)]' }, `#${row.id}`)
    ])

  const renderTypeText = (row: CategoryAttributePoolItem) =>
    Number(row.type) === 1 ? '规格' : '参数'

  const renderEntryMethodText = (row: CategoryAttributePoolItem) =>
    Number(row.entryMethod) === 1 ? '预设选项' : '手工录入'

  const renderOptions = (row: CategoryAttributePoolItem) =>
    h(OptionTagPreview, { options: row.optionList })

  const renderOperation = (row: CategoryAttributePoolItem) =>
    h('div', { class: 'flex justify-center' }, [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => openEditor(row.id)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDelete(row.id, row.name)
      })
    ])

  const { columns, columnChecks } = useTableColumns<CategoryAttributePoolItem>(() => [
    {
      type: 'selection',
      width: 56
    },
    {
      prop: 'name',
      label: '属性',
      minWidth: 220,
      formatter: (row) => renderAttributeName(row)
    },
    {
      prop: 'type',
      label: '类型',
      width: 90,
      formatter: (row) => renderTypeText(row)
    },
    {
      prop: 'entryMethod',
      label: '录入方式',
      width: 110,
      formatter: (row) => renderEntryMethodText(row)
    },
    {
      prop: 'optionList',
      label: '选项',
      minWidth: 220,
      formatter: (row) => renderOptions(row)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      fixed: 'right',
      formatter: (row) => renderOperation(row)
    }
  ])

  function parseOptionText(rawText?: string): string[] {
    return String(rawText || '')
      .split(/[\n,，;；/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function resetEditorForm() {
    Object.assign(editorForm, {
      id: undefined,
      name: '',
      type: currentType.value === -1 ? 1 : currentType.value,
      unit: '',
      entryMethod: 1,
      searchable: 1,
      filterable: 1,
      optionList: []
    })
    editorOptionsText.value = ''
  }

  function syncEditorSnapshot() {
    editorSnapshot.value = {
      id: editorForm.id,
      name: String(editorForm.name || '').trim(),
      type: Number(editorForm.type ?? 1) === 0 ? 0 : 1,
      unit: String(editorForm.unit || '').trim(),
      entryMethod: Number(editorForm.entryMethod ?? 1) === 0 ? 0 : 1,
      searchable: Number(editorForm.searchable ?? 0) === 1 ? 1 : 0,
      filterable: Number(editorForm.filterable ?? 0) === 1 ? 1 : 0,
      optionList: [...parseOptionText(editorOptionsText.value)]
    }
  }

  function resetToEditorSnapshot() {
    Object.assign(editorForm, {
      ...editorSnapshot.value,
      optionList: [...(editorSnapshot.value.optionList || [])]
    })
    editorOptionsText.value = (editorSnapshot.value.optionList || []).join('\n')
  }

  function handleEditorReset() {
    resetToEditorSnapshot()
  }

  async function loadList() {
    loading.value = true
    try {
      const data = await fetchCategoryAttributePool({
        current: pagination.current,
        size: pagination.size,
        keyword: keyword.value || undefined,
        type: currentType.value === -1 ? undefined : currentType.value
      })
      records.value = data.records
      pagination.current = data.current
      pagination.size = data.size
      pagination.total = data.total
    } finally {
      loading.value = false
    }
  }

  function handleSelectionChange(rows: CategoryAttributePoolItem[]) {
    selectedIds.value = Array.isArray(rows) ? rows.map((item) => item.id) : []
  }

  function clearKeywordAndSearch() {
    keyword.value = ''
    handleSearch()
  }

  async function handleSearch() {
    pagination.current = 1
    selectedIds.value = []
    await loadList()
  }

  async function handlePageChange(page: number) {
    pagination.current = page
    selectedIds.value = []
    await loadList()
  }

  async function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    selectedIds.value = []
    await loadList()
  }

  async function openEditor(id?: number) {
    resetEditorForm()
    syncEditorSnapshot()

    if (id) {
      const detail = await getCategoryAttribute(id)
      Object.assign(editorForm, detail)
      editorOptionsText.value = (detail.optionList || []).join('\n')
      syncEditorSnapshot()
    }

    editorVisible.value = true
  }

  async function handleDelete(id: number, name: string) {
    try {
      await ElMessageBox.confirm(`确认删除属性「${name}」？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    await deleteCategoryAttribute(id)
    await loadList()
    emit('changed')
  }

  async function handleBatchDelete() {
    if (!selectedIds.value.length) return

    try {
      await ElMessageBox.confirm(`确认批量删除 ${selectedIds.value.length} 个属性？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    await deleteCategoryAttributeBatch(selectedIds.value)
    selectedIds.value = []
    await loadList()
    emit('changed')
  }

  const typeLabels = new Map<number, string>([
    [1, '规格'],
    [0, '参数']
  ])

  const activeFilters = computed(() => {
    const filters: Array<{ key: string; label: string }> = []

    if (keyword.value) {
      filters.push({ key: 'keyword', label: `关键词：${keyword.value}` })
    }

    if (currentType.value !== -1) {
      filters.push({
        key: 'type',
        label: `类型：${typeLabels.get(currentType.value) || '-'}`
      })
    }

    return filters
  })

  function removeFilter(key: string) {
    if (key === 'keyword') {
      keyword.value = ''
    } else if (key === 'type') {
      currentType.value = -1
    }
    handleSearch()
  }

  async function handleRefresh() {
    selectedIds.value = []
    await loadList()
  }

  async function handleEditorSubmit() {
    if (!String(editorForm.name || '').trim()) return

    const optionList =
      Number(editorForm.entryMethod) === 1 ? parseOptionText(editorOptionsText.value) : []
    if (Number(editorForm.entryMethod) === 1 && optionList.length === 0) return

    editorSubmitting.value = true
    try {
      if (editorForm.id) {
        await updateCategoryAttribute({
          ...editorForm,
          optionList
        })
      } else {
        await createCategoryAttribute({
          ...editorForm,
          optionList
        })
      }

      editorVisible.value = false
      await loadList()
      emit('changed')
    } finally {
      editorSubmitting.value = false
    }
  }

  watch(
    () => props.presetType,
    async (presetType) => {
      currentType.value = presetType
      keyword.value = ''
      selectedIds.value = []
      pagination.current = 1
      await loadList()
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  :deep(.attribute-editor-modal .el-overlay-dialog) {
    overflow: hidden;
  }
</style>
