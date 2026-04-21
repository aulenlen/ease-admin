<template>
  <section class="category-column art-card-xs flex min-h-0 flex-col overflow-hidden">
    <header class="category-column__header flex items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="truncate text-base font-semibold text-[var(--el-text-color-primary)]">
          {{ title }}
        </div>
        <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">{{ countLabel }}</div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <ElButton
          type="primary"
          text
          class="category-column__header-btn"
          :disabled="addDisabled"
          @click="$emit('add')"
        >
          <ElIcon><Plus /></ElIcon>
        </ElButton>
      </div>
    </header>

    <div class="border-b border-[var(--el-border-color-lighter)] p-3">
      <div class="flex gap-2">
        <ElInput v-model="searchQuery" clearable placeholder="搜索分类" class="flex-1">
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
        <ElSelect v-model="statusFilter" class="category-column__filter" placeholder="状态">
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </div>
    </div>

    <div v-if="!parentSelected" class="category-column__empty flex-1">
      <ElEmpty :description="emptyText" />
    </div>

    <ElScrollbar v-else class="min-h-0 flex-1">
      <VueDraggable
        v-if="dragEnabled"
        :model-value="filteredItems"
        tag="div"
        class="category-column__list"
        :data-level="level"
        :data-parent-id="parentId"
        handle=".category-column__drag-handle"
        :animation="180"
        ghost-class="category-column__item--ghost"
        chosen-class="category-column__item--chosen"
        drag-class="category-column__item--dragging"
        :on-start="onDragStart"
        :on-end="onDragEnd"
        @update:model-value="handleListUpdate"
      >
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :data-node-id="item.id"
          :class="[
            'category-column__item group flex items-center gap-3',
            {
              'is-active': selectedId === item.id,
              'is-dragging': currentDragId === item.id,
              'is-disabled': Number(item.enableStatus) !== 1
            }
          ]"
          @click="$emit('select', item)"
        >
          <button
            type="button"
            class="category-column__drag-handle"
            aria-label="拖拽排序"
            @click.stop
          >
            <span class="category-column__drag-dots" aria-hidden="true">⋮⋮</span>
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <div
                class="category-column__name truncate font-medium text-[var(--el-text-color-primary)]"
              >
                {{ item.name }}
              </div>
              <div class="category-column__meta-inline truncate">排序 {{ item.sort ?? 0 }}</div>
            </div>
          </div>

          <div class="category-column__actions flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="category-column__action-btn"
              aria-label="分类设置"
              @click.stop="handleOpenDetail(item)"
            >
              <ElIcon><Setting /></ElIcon>
            </button>
            <button
              type="button"
              class="category-column__action-btn"
              :aria-label="Number(item.enableStatus) === 1 ? '停用分类' : '启用分类'"
              @click.stop="$emit('toggle-status', item)"
            >
              <ElIcon>
                <component :is="Number(item.enableStatus) === 1 ? VideoPause : VideoPlay" />
              </ElIcon>
            </button>
            <button
              type="button"
              class="category-column__action-btn is-danger"
              aria-label="删除分类"
              @click.stop="$emit('delete', item)"
            >
              <ElIcon><Delete /></ElIcon>
            </button>
          </div>
        </div>
      </VueDraggable>

      <div v-else class="category-column__list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :class="[
            'category-column__item group flex items-center gap-3',
            {
              'is-active': selectedId === item.id,
              'is-disabled': Number(item.enableStatus) !== 1
            }
          ]"
          @click="$emit('select', item)"
        >
          <span class="category-column__drag-placeholder">
            <span class="category-column__drag-dots" aria-hidden="true">⋮⋮</span>
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <div
                class="category-column__name truncate font-medium text-[var(--el-text-color-primary)]"
              >
                {{ item.name }}
              </div>
              <div class="category-column__meta-inline truncate">排序 {{ item.sort ?? 0 }}</div>
            </div>
          </div>

          <div class="category-column__actions flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="category-column__action-btn"
              aria-label="分类设置"
              @click.stop="handleOpenDetail(item)"
            >
              <ElIcon><Setting /></ElIcon>
            </button>
            <button
              type="button"
              class="category-column__action-btn"
              :aria-label="Number(item.enableStatus) === 1 ? '停用分类' : '启用分类'"
              @click.stop="$emit('toggle-status', item)"
            >
              <ElIcon>
                <component :is="Number(item.enableStatus) === 1 ? VideoPause : VideoPlay" />
              </ElIcon>
            </button>
            <button
              type="button"
              class="category-column__action-btn is-danger"
              aria-label="删除分类"
              @click.stop="$emit('delete', item)"
            >
              <ElIcon><Delete /></ElIcon>
            </button>
          </div>
        </div>
      </div>

      <div v-if="parentSelected && !filteredItems.length" class="category-column__empty flex-1">
        <ElEmpty :description="emptyDescription" />
      </div>
    </ElScrollbar>
  </section>
</template>

<script setup lang="ts">
  import { VueDraggable, type SortableEvent } from 'vue-draggable-plus'
  import { Delete, Plus, Search, Setting, VideoPause, VideoPlay } from '@element-plus/icons-vue'
  import type { CategoryTreeItem } from '@/api/category'

  interface Props {
    title: string
    level: 1 | 2 | 3
    items: CategoryTreeItem[]
    selectedId?: number | null
    parentSelected?: boolean
    parentId?: number
    emptyText?: string
    addDisabled?: boolean
    draggable?: boolean
    currentDragId?: number | null
    onDragStart?: (event: SortableEvent) => void
    onDragEnd?: (event: SortableEvent) => void
  }

  interface Emits {
    (e: 'update:items', value: CategoryTreeItem[]): void
    (e: 'add'): void
    (e: 'select', value: CategoryTreeItem): void
    (e: 'edit', value: CategoryTreeItem): void
    (e: 'toggle-status', value: CategoryTreeItem): void
    (e: 'delete', value: CategoryTreeItem): void
    (e: 'configure', value: CategoryTreeItem): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedId: null,
    parentSelected: true,
    parentId: 0,
    emptyText: '请先选择上级分类',
    addDisabled: false,
    draggable: false,
    currentDragId: null,
    onDragStart: undefined,
    onDragEnd: undefined
  })

  defineOptions({ name: 'CategoryColumnPanel' })

  const emit = defineEmits<Emits>()

  const searchQuery = ref('')
  const statusFilter = ref<'all' | 'enabled' | 'disabled'>('all')

  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '启用', value: 'enabled' },
    { label: '停用', value: 'disabled' }
  ] as const

  const filteredItems = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase()

    return props.items.filter((item) => {
      const statusMatched =
        statusFilter.value === 'all'
          ? true
          : statusFilter.value === 'enabled'
            ? Number(item.enableStatus) === 1
            : Number(item.enableStatus) !== 1

      if (!statusMatched) return false
      if (!keyword) return true

      return `${item.name} ${item.id}`.toLowerCase().includes(keyword)
    })
  })

  const countLabel = computed(() => `共 ${filteredItems.value.length} / ${props.items.length} 项`)
  const isFilterActive = computed(() => !!searchQuery.value.trim() || statusFilter.value !== 'all')
  const dragEnabled = computed(() => props.draggable && !isFilterActive.value)
  const emptyDescription = computed(() => (props.items.length ? '暂无符合条件的分类' : '暂无分类'))

  function handleListUpdate(value: CategoryTreeItem[]) {
    emit('update:items', value)
  }

  function isConfigurable(item: CategoryTreeItem) {
    return !item.children?.length
  }

  function handleOpenDetail(item: CategoryTreeItem) {
    if (isConfigurable(item)) {
      emit('configure', item)
      return
    }

    emit('edit', item)
  }
</script>

<style scoped lang="scss">
  .category-column {
    border: 1px solid var(--art-card-border);
  }

  .category-column__header {
    padding: 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .category-column__header-btn {
    color: var(--el-text-color-secondary);
  }

  .category-column__filter {
    width: 112px;
  }

  .category-column__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100%;
    padding: 12px;
  }

  .category-column__item {
    min-height: 56px;
    padding: 12px 14px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--custom-radius);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease,
      transform 0.18s ease;
  }

  .category-column__item:hover,
  .category-column__item.is-active {
    background: color-mix(in srgb, var(--theme-color) 10%, var(--el-bg-color));
    border-color: color-mix(in srgb, var(--theme-color) 30%, var(--el-border-color));
    box-shadow: 0 10px 24px rgb(15 23 42 / 6%);
  }

  .category-column__item.is-dragging {
    border-style: dashed;
  }

  .category-column__item.is-disabled {
    opacity: 0.76;
  }

  .category-column__item.is-disabled .category-column__name {
    color: var(--el-text-color-secondary);
    text-decoration: line-through;
    text-decoration-thickness: 1.2px;
    text-decoration-color: color-mix(in srgb, var(--el-text-color-secondary) 65%, transparent);
  }

  .category-column__item.is-disabled .category-column__meta-inline {
    color: var(--el-text-color-placeholder);
  }

  .category-column__meta-inline {
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }

  .category-column__drag-handle,
  .category-column__drag-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    user-select: none;
  }

  .category-column__actions {
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .category-column__item:hover .category-column__actions,
  .category-column__item.is-active .category-column__actions {
    pointer-events: auto;
    opacity: 1;
  }

  .category-column__action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: var(--custom-radius);
    transition:
      color 0.18s ease,
      background-color 0.18s ease;
  }

  .category-column__action-btn:hover,
  .category-column__action-btn:focus-visible {
    color: var(--theme-color);
    background: rgb(255 255 255 / 70%);
    outline: none;
  }

  .category-column__action-btn.is-danger:hover,
  .category-column__action-btn.is-danger:focus-visible {
    color: var(--el-color-danger);
  }

  .category-column__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    padding: 12px;
  }

  :deep(.category-column__item--ghost) {
    opacity: 0.28;
  }

  :deep(.category-column__item--chosen) {
    transform: rotate(1deg);
  }

  :deep(.el-empty__description p) {
    color: var(--el-text-color-secondary);
  }
</style>
