<template>
  <div class="category-page art-full-height">
    <div class="grid h-full min-h-0 gap-4 max-xl:grid-cols-1 xl:grid-cols-3">
      <CategoryColumnPanel
        title="一级分类"
        :level="1"
        :items="level1Items"
        :selected-id="selectedLevel1Id"
        :draggable="!sortSaving"
        :current-drag-id="currentDragId"
        :on-drag-start="handleDragStart"
        :on-drag-end="handleDragEnd"
        @update:items="handleLevel1Update"
        @add="openCreateRoot"
        @select="handleSelectLevel1"
        @edit="openEdit"
        @toggle-status="toggleEnableStatus"
        @delete="handleDelete"
        @configure="openConfigDrawer"
      />

      <CategoryColumnPanel
        title="二级分类"
        :level="2"
        :items="level2Items"
        :selected-id="selectedLevel2Id"
        :draggable="!!selectedLevel1Id && !sortSaving"
        :parent-selected="!!selectedLevel1Id"
        :parent-id="selectedLevel1Id || 0"
        :add-disabled="!selectedLevel1Id"
        :current-drag-id="currentDragId"
        :on-drag-start="handleDragStart"
        :on-drag-end="handleDragEnd"
        @update:items="handleLevel2Update"
        @add="openCreateLevel2"
        @select="handleSelectLevel2"
        @edit="openEdit"
        @toggle-status="toggleEnableStatus"
        @delete="handleDelete"
        @configure="openConfigDrawer"
      />

      <CategoryColumnPanel
        title="三级分类"
        :level="3"
        :items="level3Items"
        :selected-id="selectedLevel3Id"
        :draggable="!!selectedLevel2Id && !sortSaving"
        :parent-selected="!!selectedLevel2Id"
        :parent-id="selectedLevel2Id || 0"
        :add-disabled="!selectedLevel2Id"
        :current-drag-id="currentDragId"
        :on-drag-start="handleDragStart"
        :on-drag-end="handleDragEnd"
        @update:items="handleLevel3Update"
        @add="openCreateLevel3"
        @select="handleSelectLevel3"
        @edit="openEdit"
        @toggle-status="toggleEnableStatus"
        @delete="handleDelete"
        @configure="openConfigDrawer"
      />
    </div>

    <CategoryDetailDrawer
      v-model="detailDrawerVisible"
      :mode="detailDrawerMode"
      :category-data="detailDrawerData"
      :tree-data="categoryTree"
      :breadcrumb="detailDrawerBreadcrumb"
      :initial-tab="detailDrawerInitialTab"
      @success="handleDrawerSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { type SortableEvent } from 'vue-draggable-plus'
  import { ElMessageBox } from 'element-plus'
  import {
    deleteCategory,
    fetchCategoryTree,
    updateCategoryEnableStatus,
    updateCategorySort,
    type CategoryFlag01,
    type CategoryTreeItem
  } from '@/api/category'
  import CategoryColumnPanel from './modules/category-column-panel.vue'
  import CategoryDetailDrawer from './modules/category-detail-drawer.vue'

  defineOptions({ name: 'ProductCategoryPage' })

  type CategorySelectionLevel = 1 | 2 | 3
  interface DragContext {
    parentId: number
    level: CategorySelectionLevel
    itemIds: number[]
  }

  const categoryTree = ref<CategoryTreeItem[]>([])
  const selectedLevel1Id = ref<number | null>(null)
  const selectedLevel2Id = ref<number | null>(null)
  const selectedLevel3Id = ref<number | null>(null)
  const currentDragId = ref<number | null>(null)
  const dragTreeSnapshot = ref<CategoryTreeItem[] | null>(null)
  const dragContext = ref<DragContext | null>(null)
  const sortSaving = ref(false)

  const detailDrawerVisible = ref(false)
  const detailDrawerMode = ref<'add' | 'edit'>('edit')
  const detailDrawerData = ref<Partial<CategoryTreeItem> | null>(null)
  const detailDrawerInitialTab = ref<'basic' | 'spec' | 'param' | 'brand'>('basic')

  const level1Source = computed(() => categoryTree.value)

  const selectedLevel1Node = computed(() =>
    selectedLevel1Id.value ? findNodeById(categoryTree.value, selectedLevel1Id.value) : null
  )

  const selectedLevel2Node = computed(() =>
    selectedLevel2Id.value ? findNodeById(categoryTree.value, selectedLevel2Id.value) : null
  )

  const level2Source = computed(() => selectedLevel1Node.value?.children || [])
  const level3Source = computed(() => selectedLevel2Node.value?.children || [])

  const level1Items = computed(() => level1Source.value)
  const level2Items = computed(() => level2Source.value)
  const level3Items = computed(() => level3Source.value)

  const detailDrawerCategoryId = computed(() => Number(detailDrawerData.value?.id || 0) || null)
  const detailDrawerBreadcrumb = computed(() => {
    if (detailDrawerMode.value === 'edit' && detailDrawerCategoryId.value) {
      return findPathLabels(categoryTree.value, detailDrawerCategoryId.value)
    }

    const parentId = Number(detailDrawerData.value?.parentId || 0)
    return parentId ? findPathLabels(categoryTree.value, parentId) : []
  })

  function cloneTree(nodes: CategoryTreeItem[]): CategoryTreeItem[] {
    return (nodes || []).map((node) => ({
      ...node,
      children: node.children?.length ? cloneTree(node.children) : undefined
    }))
  }

  function findNodeById(nodes: CategoryTreeItem[], id: number): CategoryTreeItem | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children?.length) {
        const matched = findNodeById(node.children, id)
        if (matched) return matched
      }
    }
    return null
  }

  function findPathById(
    nodes: CategoryTreeItem[],
    id: number,
    parentPath: CategoryTreeItem[] = []
  ): CategoryTreeItem[] {
    for (const node of nodes) {
      const nextPath = [...parentPath, node]
      if (node.id === id) return nextPath
      if (node.children?.length) {
        const matched = findPathById(node.children, id, nextPath)
        if (matched.length) return matched
      }
    }
    return []
  }

  function findPathLabels(nodes: CategoryTreeItem[], id: number) {
    return findPathById(nodes, id).map((item) => item.name)
  }

  function normalizeTree(
    nodes: CategoryTreeItem[],
    parentId = 0,
    level: CategorySelectionLevel = 1
  ): boolean {
    if (level > 3) return false

    nodes.forEach((node, index) => {
      node.parentId = parentId
      node.level = level
      node.sort = index

      if (node.children?.length) {
        const nextLevel = (level + 1) as CategorySelectionLevel
        if (!normalizeTree(node.children, node.id, nextLevel)) {
          throw new Error('分类层级不能超过三级')
        }
      } else {
        node.children = undefined
      }
    })

    return true
  }

  function syncSelection(preferredId?: number | null) {
    const candidates = Array.from(
      new Set(
        [
          preferredId,
          selectedLevel3Id.value,
          selectedLevel2Id.value,
          selectedLevel1Id.value
        ].filter((value): value is number => Number.isFinite(value))
      )
    )

    for (const id of candidates) {
      const path = findPathById(categoryTree.value, id)
      if (!path.length) continue

      selectedLevel1Id.value = path[0]?.id ?? null
      selectedLevel2Id.value = path[1]?.id ?? null
      selectedLevel3Id.value = path[2]?.id ?? null
      return
    }

    selectedLevel1Id.value = null
    selectedLevel2Id.value = null
    selectedLevel3Id.value = null
  }

  function restoreDragState() {
    categoryTree.value = cloneTree(dragTreeSnapshot.value || [])
    syncSelection(currentDragId.value)
  }

  function getSiblingItemsByDragContext(context: Pick<DragContext, 'level' | 'parentId'>) {
    if (context.level === 1) return categoryTree.value
    return findNodeById(categoryTree.value, context.parentId)?.children || []
  }

  function hasDragOrderChanged(context: DragContext) {
    const siblings = getSiblingItemsByDragContext(context)
    return siblings.some((item, index) => item.id !== context.itemIds[index])
  }

  function handleDragStart(event: SortableEvent) {
    currentDragId.value = Number((event.item as HTMLElement).dataset.nodeId || 0) || null
    dragTreeSnapshot.value = cloneTree(categoryTree.value)
    const fromElement = event.from as HTMLElement
    const parentId = Number(fromElement.dataset.parentId || 0)
    const level = Number(fromElement.dataset.level || 1) as CategorySelectionLevel
    const siblings = getSiblingItemsByDragContext({ level, parentId })
    dragContext.value = {
      parentId,
      level,
      itemIds: siblings.map((item) => item.id)
    }
  }

  async function handleDragEnd() {
    const draggedId = currentDragId.value
    const context = dragContext.value

    try {
      if (!context || !hasDragOrderChanged(context)) {
        syncSelection(draggedId)
        return
      }

      normalizeTree(categoryTree.value)
      syncSelection(draggedId)
      if (
        detailDrawerCategoryId.value &&
        !findNodeById(categoryTree.value, detailDrawerCategoryId.value)
      ) {
        detailDrawerVisible.value = false
        detailDrawerData.value = null
      }

      const sortItems = getSiblingItemsByDragContext(context).map((item, index) => ({
        id: item.id,
        sort: index
      }))

      sortSaving.value = true
      try {
        await updateCategorySort({
          parentId: context.parentId,
          items: sortItems
        })
      } catch {
        restoreDragState()
        ElMessage.error('排序保存失败，已撤销本次拖拽')
        return
      }

      ElMessage.success('排序已保存')
      try {
        await loadCategoryTree(draggedId || undefined)
      } catch {
        ElMessage.warning('排序已保存，刷新分类树失败')
      }
    } catch {
      restoreDragState()
      ElMessage.warning('排序预览失败，已撤销本次拖拽')
    } finally {
      currentDragId.value = null
      dragTreeSnapshot.value = null
      dragContext.value = null
      sortSaving.value = false
    }
  }

  function handleSelectLevel1(node: CategoryTreeItem) {
    selectedLevel1Id.value = node.id
    selectedLevel2Id.value = null
    selectedLevel3Id.value = null
  }

  function handleSelectLevel2(node: CategoryTreeItem) {
    const path = findPathById(categoryTree.value, node.id)
    selectedLevel1Id.value = path[0]?.id ?? null
    selectedLevel2Id.value = node.id
    selectedLevel3Id.value = null
  }

  function handleSelectLevel3(node: CategoryTreeItem) {
    const path = findPathById(categoryTree.value, node.id)
    selectedLevel1Id.value = path[0]?.id ?? null
    selectedLevel2Id.value = path[1]?.id ?? null
    selectedLevel3Id.value = node.id
  }

  function handleLevel2Update(value: CategoryTreeItem[]) {
    if (!selectedLevel1Node.value) return
    selectedLevel1Node.value.children = value
  }

  function handleLevel1Update(value: CategoryTreeItem[]) {
    categoryTree.value = value
  }

  function handleLevel3Update(value: CategoryTreeItem[]) {
    if (!selectedLevel2Node.value) return
    selectedLevel2Node.value.children = value
  }

  function openCreateRoot() {
    detailDrawerMode.value = 'add'
    detailDrawerData.value = { parentId: 0 }
    detailDrawerInitialTab.value = 'basic'
    detailDrawerVisible.value = true
  }

  function openCreateLevel2() {
    if (!selectedLevel1Id.value) return
    detailDrawerMode.value = 'add'
    detailDrawerData.value = { parentId: selectedLevel1Id.value }
    detailDrawerInitialTab.value = 'basic'
    detailDrawerVisible.value = true
  }

  function openCreateLevel3() {
    if (!selectedLevel2Id.value) return
    detailDrawerMode.value = 'add'
    detailDrawerData.value = { parentId: selectedLevel2Id.value }
    detailDrawerInitialTab.value = 'basic'
    detailDrawerVisible.value = true
  }

  function openEdit(node: CategoryTreeItem) {
    detailDrawerMode.value = 'edit'
    detailDrawerData.value = node
    detailDrawerInitialTab.value = 'basic'
    detailDrawerVisible.value = true
  }

  function openConfigDrawer(node: CategoryTreeItem) {
    if (node.children?.length) {
      ElMessage.info('只有末级分类支持属性配置')
      return
    }

    detailDrawerMode.value = 'edit'
    detailDrawerData.value = node
    detailDrawerInitialTab.value = 'basic'
    detailDrawerVisible.value = true
  }

  async function toggleEnableStatus(node: CategoryTreeItem) {
    const nextStatus: CategoryFlag01 = Number(node.enableStatus) === 1 ? 0 : 1
    const confirmText = nextStatus === 1 ? '确认启用该分类？' : '确认停用该分类？'

    await ElMessageBox.confirm(confirmText, '分类状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateCategoryEnableStatus(node.id, nextStatus)
    await loadCategoryTree(node.id)
  }

  async function handleDelete(node: CategoryTreeItem) {
    await ElMessageBox.confirm('确认删除该分类？如果存在子分类将无法删除。', '删除分类', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCategory(node.id)

    if (detailDrawerCategoryId.value === node.id) {
      detailDrawerVisible.value = false
      detailDrawerData.value = null
    }

    await loadCategoryTree()
  }

  async function handleDrawerSuccess(categoryId?: number) {
    await loadCategoryTree(categoryId || undefined)
  }

  async function loadCategoryTree(preferredId?: number) {
    const tree = await fetchCategoryTree()

    categoryTree.value = cloneTree(tree)
    currentDragId.value = null

    syncSelection(preferredId)

    if (
      detailDrawerCategoryId.value &&
      !findNodeById(categoryTree.value, detailDrawerCategoryId.value)
    ) {
      detailDrawerVisible.value = false
      detailDrawerData.value = null
    }
  }

  onMounted(async () => {
    await loadCategoryTree()
  })
</script>

<style scoped lang="scss">
  @media (width <= 1279px) {
    .category-page {
      height: auto;
      min-height: 100%;
    }
  }
</style>
