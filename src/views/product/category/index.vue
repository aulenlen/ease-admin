<template>
  <div class="category-page art-full-height">
    <div class="grid h-full gap-4 max-lg:h-auto lg:grid-cols-[240px_minmax(0,1fr)]">
      <ElCard class="art-card-xs flex min-h-0 flex-col overflow-hidden" shadow="never">
        <EaseSegmentTabs
          v-model="treeStatusFilter"
          :items="treeStatusOptions"
          class="mb-3"
          @change="handleTreeStatusFilterChange"
        />

        <EaseTableSearch class="mb-3" columns="minmax(0, 1fr)">
          <ElInput v-model.trim="treeKeyword" clearable placeholder="搜索分类" />
        </EaseTableSearch>

        <ElScrollbar class="category-page__tree-scroll">
          <ElTree
            ref="treeRef"
            :data="filteredTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            highlight-current
            :expand-on-click-node="true"
            :filter-node-method="filterTreeNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="category-page__tree-node flex w-full items-center justify-between gap-2">
                <ElTooltip :content="data.name" placement="top" :show-after="400">
                  <span class="truncate">{{ data.name }}</span>
                </ElTooltip>
                <div class="category-page__tree-node-actions flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="category-page__tree-action-btn"
                    aria-label="新增子类"
                    @click.stop="openCreateChild(data)"
                  >
                    <ElIcon class="text-base"><Plus /></ElIcon>
                  </button>
                  <button
                    type="button"
                    class="category-page__tree-action-btn"
                    aria-label="编辑分类"
                    @click.stop="openEdit(data)"
                  >
                    <ElIcon class="text-base"><Edit /></ElIcon>
                  </button>
                </div>
              </div>
            </template>
          </ElTree>
        </ElScrollbar>
      </ElCard>

      <div class="min-h-0 overflow-hidden" v-loading="detailLoading">
        <ElEmpty v-if="!currentCategory" description="请选择左侧分类" />

        <ElScrollbar v-else class="h-full min-h-0">
          <CategoryWorkbench
            :category="currentCategory"
            @create-child="openCreateChild"
            @edit="openEdit"
            @toggle-status="toggleEnableStatus"
            @delete="handleDelete"
          />
        </ElScrollbar>
      </div>
    </div>

    <CategoryDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :category-data="dialogCategoryData"
      :tree-data="treeData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    deleteCategory,
    fetchCategoryTree,
    getCategory,
    updateCategoryEnableStatus,
    type CategoryDetailItem,
    type CategoryFlag01,
    type CategoryTreeItem
  } from '@/api/category'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import { Edit, Plus } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import CategoryDialog from './modules/category-dialog.vue'
  import CategoryWorkbench from './modules/category-workbench.vue'

  defineOptions({ name: 'ProductCategoryPage' })

  const treeRef = ref()
  const treeData = ref<CategoryTreeItem[]>([])
  const treeKeyword = ref('')
  const treeStatusFilter = ref<-1 | 0 | 1>(-1)
  const detailLoading = ref(false)
  const currentCategory = ref<CategoryDetailItem | null>(null)
  const currentCategoryId = ref<number | null>(null)

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const dialogCategoryData = ref<Partial<CategoryTreeItem> | null>(null)
  const treeStatusOptions = [
    { label: '全部', value: -1 },
    { label: '已启用', value: 1 },
    { label: '未启用', value: 0 }
  ] as const

  function cloneTree(nodes: CategoryTreeItem[]): CategoryTreeItem[] {
    return (nodes || []).map((node) => ({
      ...node,
      children: node.children?.length ? cloneTree(node.children) : undefined
    }))
  }

  function filterTreeNode(keyword: string, data: any) {
    if (!keyword) return true
    return String(data.name || '')
      .toLowerCase()
      .includes(String(keyword || '').toLowerCase())
  }

  const filteredTree = computed(() => cloneTree(treeData.value))

  function collectExpandedKeys(
    nodes: CategoryTreeItem[],
    keyword: string,
    keys = new Set<number>()
  ) {
    const lowerKeyword = String(keyword || '').toLowerCase()

    nodes.forEach((node) => {
      const selfMatched = String(node.name || '')
        .toLowerCase()
        .includes(lowerKeyword)
      const hasChildren = Array.isArray(node.children) && node.children.length > 0

      if (hasChildren) {
        collectExpandedKeys(node.children!, keyword, keys)
        const childMatched = node.children!.some((child) => keys.has(child.id))
        if (selfMatched || childMatched) {
          keys.add(node.id)
        }
        return
      }

      if (selfMatched) {
        keys.add(node.id)
      }
    })

    return keys
  }

  async function loadCategoryTree() {
    treeData.value = await fetchCategoryTree(
      treeStatusFilter.value === -1 ? undefined : { enableStatus: treeStatusFilter.value }
    )

    const ids = new Set<number>()
    const walk = (nodes: CategoryTreeItem[]) => {
      nodes.forEach((node) => {
        ids.add(node.id)
        if (node.children?.length) walk(node.children)
      })
    }
    walk(treeData.value)

    if (currentCategoryId.value && !ids.has(currentCategoryId.value)) {
      currentCategoryId.value = null
      currentCategory.value = null
    }
  }

  async function loadCategoryDetail(id: number) {
    detailLoading.value = true
    try {
      currentCategory.value = await getCategory(id)
      currentCategoryId.value = id
    } finally {
      detailLoading.value = false
    }
  }

  function handleNodeClick(node: CategoryTreeItem) {
    loadCategoryDetail(node.id)
  }

  function openCreateChild(node: CategoryTreeItem) {
    dialogType.value = 'add'
    dialogCategoryData.value = { parentId: node.id }
    dialogVisible.value = true
  }

  function openEdit(node: CategoryTreeItem) {
    dialogType.value = 'edit'
    dialogCategoryData.value = node
    dialogVisible.value = true
  }

  async function handleTreeStatusFilterChange(value: string | number) {
    treeStatusFilter.value = value as -1 | 0 | 1
    await loadCategoryTree()
  }

  async function toggleEnableStatus(node: CategoryTreeItem | CategoryDetailItem) {
    const nextStatus: CategoryFlag01 = Number(node.enableStatus) === 1 ? 0 : 1
    const confirmText = nextStatus === 1 ? '确认启用该分类？' : '确认停用该分类？'

    await ElMessageBox.confirm(confirmText, '分类状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateCategoryEnableStatus(node.id, nextStatus)
    await loadCategoryTree()

    if (currentCategoryId.value) {
      await loadCategoryDetail(currentCategoryId.value)
    }
  }

  async function handleDelete(node: CategoryTreeItem | CategoryDetailItem) {
    await ElMessageBox.confirm('确认删除该分类？如果存在子分类将无法删除。', '删除分类', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCategory(node.id)
    currentCategory.value = null
    currentCategoryId.value = null
    await loadCategoryTree()
  }

  async function handleDialogSuccess(categoryId?: number) {
    await loadCategoryTree()
    if (categoryId) {
      await loadCategoryDetail(categoryId)
    } else if (currentCategoryId.value) {
      await loadCategoryDetail(currentCategoryId.value)
    }
  }

  onMounted(async () => {
    await loadCategoryTree()
  })

  watch(treeKeyword, async (value) => {
    await nextTick()
    treeRef.value?.filter?.(value)

    if (!value) {
      const nodesMap = treeRef.value?.store?.nodesMap
      if (nodesMap) {
        Object.values(nodesMap).forEach((node: any) => {
          if (node.level > 0) node.expanded = false
        })
      }
      return
    }

    const expandedKeys = Array.from(collectExpandedKeys(treeData.value, value))
    expandedKeys.forEach((key) => {
      treeRef.value?.store?.nodesMap?.[key]?.expand?.()
    })
  })
</script>

<style scoped lang="scss">
  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
  }

  :deep(.el-tree-node__children) {
    overflow: hidden;
  }

  .category-page__tree-scroll {
    height: calc(100vh - 260px);
  }

  .category-page__tree-node-actions {
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .category-page__tree-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--theme-color);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 0;
    transition: color 0.18s ease;
  }

  .category-page__tree-action-btn:hover,
  .category-page__tree-action-btn:focus-visible {
    color: var(--el-color-primary-dark-2);
    outline: none;
  }

  :deep(.el-tree-node__content:hover .category-page__tree-node-actions),
  :deep(.el-tree-node.is-current > .el-tree-node__content .category-page__tree-node-actions) {
    pointer-events: auto;
    opacity: 1;
  }

  @media (width <= 1024px) {
    .category-page__tree-scroll {
      height: min(46vh, 380px);
    }
  }
</style>
