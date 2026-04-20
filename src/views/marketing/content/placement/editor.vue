<template>
  <div class="placement-editor flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <ArtIconButton icon="ri:arrow-left-line" @click="handleCancel" />
      <ElButton type="primary" :disabled="!slotInfo" @click="handleAdd" v-ripple>
        新增{{ addButtonLabel }}
      </ElButton>
    </div>

    <EaseTablePage
      v-model:showSearchBar="showSearchBar"
      :loading="isLoading"
      @refresh="refreshItems"
    >
      <template #search>
        <EaseTableSearch columns="240px 140px">
          <ElInput v-model="searchForm.keyword" placeholder="搜索标题/副标题" clearable />

          <ElSelect v-model="searchForm.status" placeholder="状态" clearable>
            <ElOption :value="SLOT_STATUS.ENABLED" label="启用" />
            <ElOption :value="SLOT_STATUS.DISABLED" label="禁用" />
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

      <template #table>
        <ArtTable
          ref="tableRef"
          :loading="isLoading"
          :data="filteredItems"
          :columns="columns"
          :row-class-name="getRowClassName"
          :show-table-header="false"
          :empty-text="emptyText"
          row-key="id"
          @row-click="handleRowClick"
        />
      </template>
    </EaseTablePage>

    <SlotItemDrawer
      :visible="drawerVisible"
      :item-data="editingItem"
      :is-edit="isEditMode"
      :item-index="editingIndex"
      :locked-item-type="lockedItemType"
      @update:visible="drawerVisible = $event"
      @confirm="handleDrawerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { useDraggable } from 'vue-draggable-plus'
  import { ElImage, ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
  import {
    SLOT_ITEM_JUMP_TYPE,
    SLOT_ITEM_TYPE,
    SLOT_STATUS,
    createSlotItem,
    deleteSlotItem,
    fetchSlotItemPage,
    getSlot,
    resolveLockedItemType,
    updateSlotItem,
    updateSlotItemStatus,
    type SlotDetailItem,
    type SlotItem,
    type SlotItemType
  } from '@/api/slot'
  import type { ColumnOption } from '@/types/component'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import SlotItemDrawer from './modules/slot-item-drawer.vue'

  defineOptions({ name: 'MarketingPlacementEditor' })

  interface SlotItemSearchForm {
    keyword?: string
    status?: number | ''
  }

  const route = useRoute()
  const router = useRouter()

  const isLoading = ref(false)
  const showSearchBar = ref(true)
  const slotInfo = ref<SlotDetailItem | null>(null)
  const slotItems = ref<SlotItem[]>([])
  const tableRef = ref<{
    elTableRef?: {
      $el?: HTMLElement
    } | null
  } | null>(null)
  const tbodyRef = ref<HTMLElement | null>(null)

  const drawerVisible = ref(false)
  const isEditMode = ref(false)
  const editingIndex = ref(-1)
  const editingItem = ref<SlotItem | null>(null)
  const toggleLoadingIds = ref<number[]>([])
  const searchForm = ref<SlotItemSearchForm>({ keyword: '', status: '' })

  const placementId = computed(() => Number(route.params.id) || 0)
  const lockedItemType = computed<SlotItemType>(() =>
    resolveLockedItemType(slotInfo.value?.renderType)
  )
  const addButtonLabel = computed(() =>
    lockedItemType.value === SLOT_ITEM_TYPE.ARTICLE ? '文章项' : '卡片项'
  )
  const hasFilter = computed(
    () =>
      !!searchForm.value.keyword?.trim() ||
      (searchForm.value.status !== undefined && searchForm.value.status !== '')
  )
  const filteredItems = computed(() => {
    if (!hasFilter.value) return slotItems.value

    const keyword = String(searchForm.value.keyword || '')
      .trim()
      .toLowerCase()
    const statusFilter = searchForm.value.status

    return slotItems.value.filter((item) => {
      if (statusFilter !== undefined && statusFilter !== '') {
        if (Number(item.status ?? SLOT_STATUS.DISABLED) !== Number(statusFilter)) return false
      }

      if (keyword) {
        const haystack =
          lockedItemType.value === SLOT_ITEM_TYPE.ARTICLE
            ? `文章 ${item.articleId || ''}`.toLowerCase()
            : `${item.title || ''} ${item.subTitle || ''}`.toLowerCase()
        if (!haystack.includes(keyword)) return false
      }

      return true
    })
  })
  const activeFilters = computed(() => {
    const filters: Array<{ key: keyof SlotItemSearchForm; label: string }> = []

    if (searchForm.value.keyword?.trim()) {
      filters.push({
        key: 'keyword',
        label: `关键词：${searchForm.value.keyword.trim()}`
      })
    }

    if (searchForm.value.status !== undefined && searchForm.value.status !== '') {
      filters.push({
        key: 'status',
        label: `状态：${searchForm.value.status === SLOT_STATUS.ENABLED ? '启用' : '禁用'}`
      })
    }

    return filters
  })
  const emptyText = computed(() =>
    hasFilter.value ? '没有符合筛选条件的项' : '暂无投放项，点击右上角添加'
  )

  const columns = computed<ColumnOption<SlotItem>[]>(() => [
    {
      prop: 'drag',
      label: '',
      width: 48,
      align: 'center',
      formatter: () => renderDragHandle()
    },
    {
      prop: 'sort',
      label: '#',
      width: 72,
      align: 'center',
      formatter: (row) => h('span', { class: 'text-xs text-g-500' }, getOriginalIndex(row) + 1)
    },
    {
      prop: 'content',
      label: '内容',
      minWidth: 360,
      formatter: (row) => renderContent(row)
    },
    {
      prop: 'jump',
      label: '跳转',
      minWidth: 180,
      formatter: (row) => h('span', { class: 'text-xs text-g-600' }, getJumpLabel(row))
    },
    {
      prop: 'status',
      label: '状态',
      width: 160,
      formatter: (row) => renderStatus(row)
    },
    {
      prop: 'time',
      label: '时段',
      minWidth: 180,
      formatter: (row) => renderTimeRange(row)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row) => renderOperation(row)
    }
  ])

  const normalizeItems = (items: SlotItem[]) =>
    items.map((item, index) => ({ ...item, sort: index }))

  function removeFilter(key: keyof SlotItemSearchForm) {
    searchForm.value[key] = undefined
  }

  const handleCancel = () => {
    router.push({ name: 'MarketingPlacement' })
  }

  const handleAdd = () => {
    isEditMode.value = false
    editingIndex.value = -1
    editingItem.value = null
    drawerVisible.value = true
  }

  function getOriginalIndex(row: SlotItem) {
    return slotItems.value.findIndex((item) => item.id === row.id)
  }

  function isStatusToggling(id?: number) {
    return id ? toggleLoadingIds.value.includes(id) : false
  }

  function getJumpLabel(row: SlotItem): string {
    if (row.itemType === SLOT_ITEM_TYPE.ARTICLE) return '—'
    switch (row.jumpType) {
      case SLOT_ITEM_JUMP_TYPE.ACTIVITY:
        return `活动 #${row.jumpTargetId || '—'}`
      case SLOT_ITEM_JUMP_TYPE.SPU:
        return `商品 #${row.jumpTargetId || '—'}`
      case SLOT_ITEM_JUMP_TYPE.ARTICLE:
        return `文章 #${row.jumpTargetId || '—'}`
      case SLOT_ITEM_JUMP_TYPE.EXTERNAL:
        return row.url ? '外链' : '外链（未设置）'
      default:
        return '无跳转'
    }
  }

  function renderDragHandle() {
    return h('i', {
      class: ['ri-drag-move-2-line', 'slot-item-drag-handle', { 'is-disabled': hasFilter.value }],
      title: hasFilter.value ? '请清空筛选后调整顺序' : '拖拽调整顺序'
    })
  }

  function renderContent(row: SlotItem) {
    if (row.itemType === SLOT_ITEM_TYPE.ARTICLE) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('i', { class: 'ri-article-line text-base text-g-500' }),
        h('span', { class: 'text-sm truncate' }, `文章 #${row.articleId || '—'}`)
      ])
    }

    return h('div', { class: 'flex items-center gap-3' }, [
      row.pic
        ? h(ElImage, {
            src: row.pic,
            fit: 'cover',
            class: 'h-10 w-10 shrink-0 rounded',
            previewSrcList: [row.pic],
            previewTeleported: true
          })
        : h(
            'div',
            {
              class:
                'h-10 w-10 shrink-0 rounded bg-g-100 flex items-center justify-center text-g-400'
            },
            [h('i', { class: 'ri-image-line' })]
          ),
      h('div', { class: 'min-w-0' }, [
        h('div', { class: 'text-sm font-medium truncate' }, row.title || '未设置标题'),
        row.subTitle ? h('div', { class: 'text-xs text-g-500 truncate' }, row.subTitle) : null
      ])
    ])
  }

  function renderStatus(row: SlotItem) {
    const checked = Number(row.status ?? SLOT_STATUS.DISABLED) === SLOT_STATUS.ENABLED
    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        loading: isStatusToggling(row.id),
        disabled: !row.id || isStatusToggling(row.id),
        inlinePrompt: false,
        beforeChange: () => toggleRowStatus(row)
      }),
      h('span', checked ? '启用' : '禁用')
    ])
  }

  function renderTimeRange(row: SlotItem) {
    if (!row.startTime && !row.endTime) {
      return h('span', { class: 'text-xs text-g-500' }, '—')
    }

    return h('div', { class: 'text-xs text-g-500 leading-tight' }, [
      h('div', row.startTime?.slice(0, 10) || '不限'),
      h('div', `~ ${row.endTime?.slice(0, 10) || '不限'}`)
    ])
  }

  function renderOperation(row: SlotItem) {
    return h('div', { class: 'flex items-center justify-center gap-0.5' }, [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => handleEdit(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleRemove(row)
      })
    ])
  }

  function handleEdit(row: SlotItem) {
    const index = slotItems.value.findIndex((item) => item.id === row.id)
    if (index < 0) return

    isEditMode.value = true
    editingIndex.value = index
    editingItem.value = { ...slotItems.value[index] }
    drawerVisible.value = true
  }

  function getRowClassName() {
    return 'placement-editor__table-row'
  }

  function shouldIgnoreRowClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    return !!target?.closest(
      '.el-switch, .el-checkbox, .el-button, .ease-table-action, .art-button-table, .el-image, .el-image__inner'
    )
  }

  function handleRowClick(row: SlotItem, _column: unknown, event: MouseEvent) {
    if (shouldIgnoreRowClick(event)) return

    if (row.itemType === SLOT_ITEM_TYPE.ARTICLE && row.articleId) {
      router.push({ name: 'MarketingArticleEdit', params: { id: row.articleId } })
      return
    }

    if (row.jumpType === SLOT_ITEM_JUMP_TYPE.ARTICLE && row.jumpTargetId) {
      router.push({ name: 'MarketingArticleEdit', params: { id: row.jumpTargetId } })
      return
    }

    if (row.jumpType === SLOT_ITEM_JUMP_TYPE.SPU && row.jumpTargetId) {
      router.push(`/product/spu/detail/${row.jumpTargetId}`)
      return
    }

    handleEdit(row)
  }

  function handleRemove(row: SlotItem) {
    ElMessageBox.confirm('确定删除该投放项？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
      .then(async () => {
        try {
          if (row.id) {
            await deleteSlotItem(placementId.value, row.id)
          }
          slotItems.value = normalizeItems(slotItems.value.filter((item) => item.id !== row.id))
          await nextTick()
          syncTableBody()
        } catch {
          // 保持当前状态
        }
      })
      .catch(() => {
        // ignore
      })
  }

  async function handleDrawerConfirm(item: SlotItem, index: number) {
    try {
      if (index >= 0 && index < slotItems.value.length) {
        const existing = slotItems.value[index]
        if (!existing.id) return

        const payload: SlotItem = {
          ...existing,
          ...item,
          id: existing.id,
          itemType: lockedItemType.value
        }
        await updateSlotItem(placementId.value, existing.id, payload)

        const next = [...slotItems.value]
        next[index] = payload
        slotItems.value = normalizeItems(next)
      } else {
        const payload: SlotItem = {
          ...item,
          itemType: lockedItemType.value,
          sort: slotItems.value.length
        }
        const newId = await createSlotItem(placementId.value, payload)
        slotItems.value = normalizeItems([...slotItems.value, { ...payload, id: newId }])
      }

      await nextTick()
      syncTableBody()
    } catch {
      // 保持当前状态，允许用户重试
    }
  }

  async function handleReorder() {
    const changed = slotItems.value
      .map((item, idx) => ({ item, newSort: idx }))
      .filter(({ item, newSort }) => item.id && (item.sort ?? newSort) !== newSort)

    if (!changed.length) {
      slotItems.value = normalizeItems(slotItems.value)
      return
    }

    try {
      await Promise.all(
        changed.map(({ item, newSort }) =>
          updateSlotItem(
            placementId.value,
            item.id as number,
            { ...item, sort: newSort },
            { showSuccessMessage: false }
          )
        )
      )
      slotItems.value = normalizeItems(slotItems.value)
      ElMessage.success('排序已保存')
    } catch {
      ElMessage.error('排序保存失败，请刷新重试')
    }
  }

  async function toggleRowStatus(row: SlotItem) {
    if (!row.id) {
      ElMessage.warning('投放项尚未保存，请稍后再试')
      return false
    }

    const nextStatus =
      Number(row.status ?? SLOT_STATUS.DISABLED) === SLOT_STATUS.ENABLED
        ? SLOT_STATUS.DISABLED
        : SLOT_STATUS.ENABLED

    toggleLoadingIds.value.push(row.id)
    try {
      await updateSlotItemStatus(placementId.value, [row.id], nextStatus)
      const target = slotItems.value.find((item) => item.id === row.id)
      if (target) target.status = nextStatus
      return true
    } catch {
      return false
    } finally {
      toggleLoadingIds.value = toggleLoadingIds.value.filter((id) => id !== row.id)
    }
  }

  function syncTableBody() {
    tbodyRef.value =
      (tableRef.value?.elTableRef?.$el?.querySelector(
        '.el-table__body-wrapper tbody'
      ) as HTMLElement | null) || null
  }

  async function refreshItems() {
    if (!placementId.value) return

    try {
      const itemPage = await fetchSlotItemPage(placementId.value, {
        current: 1,
        size: 200,
        orderBy: 'sort',
        sort: 'asc'
      })
      slotItems.value = normalizeItems(itemPage.records || [])
      await nextTick()
      syncTableBody()
    } catch (error) {
      console.error('刷新投放项失败:', error)
      ElMessage.error('刷新投放项失败')
    }
  }

  const loadData = async () => {
    if (!placementId.value) {
      router.replace({ name: 'MarketingPlacement' })
      return
    }

    isLoading.value = true
    try {
      const [slot, itemPage] = await Promise.all([
        getSlot(placementId.value),
        fetchSlotItemPage(placementId.value, {
          current: 1,
          size: 200,
          orderBy: 'sort',
          sort: 'asc'
        })
      ])

      slotInfo.value = slot
      slotItems.value = normalizeItems(itemPage.records || [])
      await nextTick()
      syncTableBody()
    } catch (error) {
      console.error('加载槽位配置失败:', error)
      ElMessage.error('加载槽位配置失败')
      router.push({ name: 'MarketingPlacement' })
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => placementId.value,
    () => {
      void loadData()
    },
    { immediate: true }
  )

  watch(
    () => [filteredItems.value.length, hasFilter.value],
    () => {
      nextTick(() => {
        syncTableBody()
      })
    },
    { flush: 'post' }
  )

  useDraggable(tbodyRef, slotItems, {
    handle: '.slot-item-drag-handle:not(.is-disabled)',
    animation: 180,
    ghostClass: 'slot-item-row--ghost',
    onEnd: () => handleReorder()
  })
</script>

<style scoped lang="scss">
  .slot-item-drag-handle {
    font-size: 16px;
    color: var(--el-text-color-placeholder);
    cursor: grab;
  }

  .slot-item-drag-handle.is-disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .slot-item-drag-handle:active {
    cursor: grabbing;
  }

  :deep(.slot-item-row--ghost) {
    opacity: 0.3;
  }

  :deep(.placement-editor__table-row) {
    cursor: pointer;
  }
</style>
