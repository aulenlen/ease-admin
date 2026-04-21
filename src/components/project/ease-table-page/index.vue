<!-- 通用表格页壳组件：把“页面操作区 + 表头工具栏 + 可选搜索 + 可选批量操作条 + 表格内容”统一成同一套结构 -->
<template>
  <div
    class="ease-table-page"
    :class="{ 'art-full-height': !embedded, 'ease-table-page--embedded': embedded }"
  >
    <div v-if="$slots.pageActions" class="ease-table-page__page-actions">
      <slot name="pageActions" />
    </div>

    <component
      :is="embedded ? 'div' : ElCard"
      class="ease-table-page__surface"
      :class="
        embedded
          ? ['ease-table-page__embedded', cardClass]
          : ['art-table-card ease-table-page__card', cardClass]
      "
    >
      <!--
        这里把 ElCard body 做成 flex column：
        - 工具区（tabs/search/header/批量条）固定高度
        - 表格区（ArtTable）占满剩余高度
        这样页面就不需要依赖 ArtTable 的 showTableHeader 高度扣减逻辑，避免 tabs/批量条导致高度计算不准。
      -->
      <div class="ease-table-page__toolbar">
        <div v-if="$slots.toolbarTop" class="ease-table-page__topbar">
          <slot name="toolbarTop" />
        </div>

        <ArtTableHeader
          class="ease-table-page__table-header"
          v-model:columns="columns"
          v-model:showSearchBar="showSearchBar"
          :loading="loading"
          :layout="tableHeaderLayout"
          :full-class="tableHeaderFullClass"
          :show-zebra="showZebra"
          :show-border="showBorder"
          :show-header-background="showHeaderBackground"
          @refresh="$emit('refresh')"
          @search="$emit('search')"
        >
          <template #left>
            <slot name="headerLeft" />

            <div
              v-if="selectionCount > 0 || (showSearchContent && $slots.search)"
              class="ease-table-page__switchable-bar"
            >
              <template v-if="selectionCount > 0">
                <div class="ease-table-page__selection-inline">
                  <span class="ease-table-page__selection-text">
                    <slot name="selectionText" :count="selectionCount">
                      已选{{ selectionCount }}条
                    </slot>
                  </span>

                  <ElSpace wrap class="ease-table-page__batch-actions">
                    <slot name="selectionActions" :count="selectionCount" />
                  </ElSpace>
                </div>
              </template>

              <div v-else class="ease-table-page__search-inline">
                <slot name="search" />
              </div>
            </div>
          </template>

          <template #right>
            <slot name="headerRight" />
          </template>
        </ArtTableHeader>
      </div>

      <div class="ease-table-page__table">
        <slot name="table" />
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
  import { ElCard } from 'element-plus'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'EaseTablePage' })

  interface Props {
    loading?: boolean
    /** ArtTableHeader 的 layout 字符串 */
    tableHeaderLayout?: string
    /** ArtTableHeader 全屏时的容器 class */
    tableHeaderFullClass?: string
    showZebra?: boolean
    showBorder?: boolean
    showHeaderBackground?: boolean

    /** 选中数量（>0 时显示批量操作条） */
    selectionCount?: number

    /** 透传给 ElCard 的 class */
    cardClass?: string | string[] | Record<string, boolean>
    /** 嵌入现有卡片/弹窗时，不再额外渲染 ElCard 外壳 */
    embedded?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    selectionCount: 0,
    tableHeaderLayout: undefined,
    tableHeaderFullClass: 'art-page-view',
    showZebra: true,
    showBorder: true,
    showHeaderBackground: true,
    cardClass: undefined,
    embedded: false
  })

  defineEmits<{
    (e: 'refresh'): void
    (e: 'search'): void
  }>()

  const columns = defineModel<ColumnOption[]>('columns', { default: () => [] })
  const showSearchBar = defineModel<boolean | undefined>('showSearchBar', { default: undefined })

  // 当前页壳只负责”搜索区 / 批量条”的切换结构，不再负责隐藏表头。
  const showSearchContent = computed(
    () => showSearchBar.value !== false && props.selectionCount === 0
  )

  const {
    loading,
    tableHeaderLayout,
    tableHeaderFullClass,
    showZebra,
    showBorder,
    showHeaderBackground,
    selectionCount,
    cardClass,
    embedded
  } = toRefs(props)
</script>

<style scoped lang="scss">
  /* 这里只保留结构：
   - 顶部 pageActions 区
   - toolbarTop 扩展区
   - search / selection 共用切换区
   - table 内容区
   不再承担按钮、卡片、表头等视觉皮肤。 */
  :deep(.ease-table-page__card > .el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .ease-table-page__embedded {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .ease-table-page__page-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 6px;
  }

  :deep(.ease-table-page__table-header) {
    align-items: flex-start;
  }

  :deep(.ease-table-page__table-header > .flex-wrap) {
    flex: 0 0 auto;
    width: auto;
    min-width: 0;
  }

  :deep(.ease-table-page__table-header > div:last-child) {
    align-items: center;
    min-height: 32px;
    margin-top: 0;
  }

  .ease-table-page__toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 2px 0 14px;
  }

  .ease-table-page__topbar {
    display: flex;
    gap: 6px;
    align-items: center;
    padding-bottom: 6px;
  }

  .ease-table-page__switchable-bar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    min-height: 32px;
  }

  .ease-table-page__search-inline {
    display: flex;
    flex: 0 0 auto;
    gap: 10px;
    align-items: center;
    min-height: 32px;
  }

  .ease-table-page__selection-inline {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    align-items: center;
    min-height: 32px;
  }

  .ease-table-page__selection-text {
    min-width: 0;
    font-size: 14px;
  }

  :deep(.ease-table-page__batch-actions) {
    row-gap: 8px;
  }

  .ease-table-page__table {
    flex: 1;
    min-height: 0;
  }

  /* 表格在页壳里要紧贴工具区，不要沿用 ArtTable 默认的 10px top margin。 */
  :deep(.ease-table-page__table .art-table .el-table) {
    margin-top: 0 !important;
  }

  /* 分页紧贴表格，不额外堆 margin；同时用 padding 保证呼吸感一致。 */
  :deep(.ease-table-page__table .art-table .pagination) {
    padding: 14px 0 16px;
    margin-top: 0 !important;
  }

  @media (width <= 768px) {
    .ease-table-page__page-actions {
      justify-content: flex-start;
      margin-bottom: 4px;
    }

    .ease-table-page__toolbar {
      padding: 4px 0 8px;
    }

    :deep(.ease-table-page__table-header) {
      display: flex;
      gap: 10px;
      justify-content: stretch;
    }

    :deep(.ease-table-page__table-header > div) {
      width: 100%;
    }

    :deep(.ease-table-page__table-header > div:last-child) {
      gap: 8px;
      margin-top: 10px;
    }

    .ease-table-page__switchable-bar,
    .ease-table-page__search-inline,
    .ease-table-page__selection-inline {
      align-items: start;
      height: auto;
    }

    .ease-table-page__switchable-bar,
    .ease-table-page__search-inline {
      width: 100%;
      min-width: 0;
    }

    :deep(.ease-table-page__search-inline > *) {
      width: 100%;
      min-width: 0;
    }

    :deep(.ease-table-page__batch-actions.el-space) {
      width: 100%;
    }

    :deep(.ease-table-page__batch-actions .el-space__item) {
      flex: 1 1 0;
      min-width: 0;
    }

    :deep(.ease-table-page__batch-actions .el-button) {
      width: 100%;
    }

    :deep(.ease-table-page__table .art-table .pagination) {
      padding: 12px 0;
    }
  }
</style>
