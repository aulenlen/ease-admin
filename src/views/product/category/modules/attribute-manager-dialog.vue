<template>
  <ElDialog
    v-model="visible"
    title="全局属性管理"
    :width="managerDialogWidth"
    top="4vh"
    class="attribute-manager-dialog"
    destroy-on-close
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_144px_auto]">
          <ElInput
            v-model.trim="keyword"
            clearable
            placeholder="搜索属性名称或 ID"
            class="w-full"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <ElSelect v-model="currentType" class="w-full" @change="handleSearch">
            <ElOption label="全部" :value="-1" />
            <ElOption label="规格" :value="1" />
            <ElOption label="参数" :value="0" />
          </ElSelect>
          <ElButton @click="handleSearch">搜索</ElButton>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElButton @click="openEditor()">新增属性</ElButton>
          <ElButton
            type="danger"
            plain
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </ElButton>
        </div>
      </div>

      <ArtTable
        v-loading="loading"
        :data="records"
        row-key="id"
        :show-table-header="false"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="48" />

        <ElTableColumn label="属性" min-width="220">
          <template #default="{ row }">
            <div class="font-medium">{{ row.name }}</div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">#{{ row.id }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="类型" width="90">
          <template #default="{ row }">
            {{ Number(row.type) === 1 ? '规格' : '参数' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="录入方式" width="110">
          <template #default="{ row }">
            {{ Number(row.entryMethod) === 1 ? '预设选项' : '手工录入' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="选项" min-width="220">
          <template #default="{ row }">
            <OptionTagPreview :options="row.optionList" />
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="120" align="center" header-align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex justify-center">
              <ArtButtonTable type="edit" @click="openEditor(row.id)" />
              <ArtButtonTable type="delete" @click="handleDelete(row.id, row.name)" />
            </div>
          </template>
        </ElTableColumn>
      </ArtTable>

      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          已选 {{ selectedIds.length }} 项
        </div>

        <ElPagination
          background
          layout="prev, pager, next"
          :current-page="pagination.current"
          :page-size="pagination.size"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <ElDialog
      v-model="editorVisible"
      :title="editorForm.id ? '编辑属性' : '新增属性'"
      :width="editorDialogWidth"
      append-to-body
      top="8vh"
      destroy-on-close
    >
      <ElForm label-position="top" class="attribute-manager-dialog__editor-form">
        <ElFormItem label="属性名称" required>
          <ElInput v-model.trim="editorForm.name" maxlength="100" class="w-full" />
        </ElFormItem>

        <ElFormItem label="属性类型" required>
          <ElSelect v-model="editorForm.type" class="w-full">
            <ElOption label="规格" :value="1" />
            <ElOption label="参数" :value="0" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="单位">
          <ElInput v-model.trim="editorForm.unit" maxlength="20" class="w-full" />
        </ElFormItem>

        <ElFormItem label="录入方式">
          <ElRadioGroup v-model="editorForm.entryMethod">
            <ElRadio :value="1">预设选项</ElRadio>
            <ElRadio :value="0">手工录入</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <div class="flex flex-wrap gap-8 md:gap-12">
          <ElFormItem label="支持搜索">
            <ElSwitch v-model="searchableValue" />
          </ElFormItem>

          <ElFormItem label="支持筛选">
            <ElSwitch v-model="filterableValue" />
          </ElFormItem>
        </div>

        <ElFormItem v-if="Number(editorForm.entryMethod) === 1" label="预设选项">
          <OptionTagInput
            v-model="editorOptionValues"
            placeholder="每行一个选项，也支持用逗号分隔"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="flex items-center justify-end gap-2 pr-1">
          <ElButton @click="editorVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="editorSubmitting" @click="handleEditorSubmit">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<script setup lang="ts">
  import OptionTagInput from './option-tag-input.vue'
  import OptionTagPreview from './option-tag-preview.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
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
    modelValue: boolean
    presetType?: -1 | CategoryAttributeType
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'changed'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    presetType: -1
  })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })
  const managerDialogWidth = computed(() => `${Math.min(960, Math.max(width.value - 24, 320))}px`)
  const editorDialogWidth = computed(() => `${Math.min(620, Math.max(width.value - 24, 320))}px`)

  const loading = ref(false)
  const keyword = ref('')
  const currentType = ref<-1 | CategoryAttributeType>(-1)
  const records = ref<CategoryAttributePoolItem[]>([])
  const selectedIds = ref<number[]>([])
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const editorVisible = ref(false)
  const editorSubmitting = ref(false)
  const editorOptionsText = ref('')
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

  async function handleSearch() {
    pagination.current = 1
    await loadList()
  }

  async function handlePageChange(page: number) {
    pagination.current = page
    await loadList()
  }

  async function openEditor(id?: number) {
    resetEditorForm()

    if (id) {
      const detail = await getCategoryAttribute(id)
      Object.assign(editorForm, detail)
      editorOptionsText.value = (detail.optionList || []).join('\n')
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
    () => visible.value,
    async (opened) => {
      if (!opened) return
      currentType.value = props.presetType
      keyword.value = ''
      selectedIds.value = []
      pagination.current = 1
      await loadList()
    }
  )
</script>

<style scoped lang="scss">
  :deep(.attribute-manager-dialog) {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 8vh);
    margin-bottom: 4vh;
  }

  :deep(.attribute-manager-dialog .el-dialog__body) {
    overflow: auto;
  }

  .attribute-manager-dialog__editor-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }
</style>
