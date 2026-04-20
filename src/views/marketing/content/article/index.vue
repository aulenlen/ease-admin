<template>
  <div class="marketing-article-page art-full-height">
    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedIds.length"
      @refresh="refreshData"
    >
      <template #pageActions>
        <ElButton type="primary" @click="handleCreate" v-ripple>新建文章</ElButton>
      </template>

      <template #search>
        <ArticleSearch v-model="searchForm" @search="handleSearch" />
      </template>

      <template #selectionText="{ count }">已选{{ count }}篇文章</template>

      <template #selectionActions>
        <ElButton @click="handleBatchStatus(ARTICLE_STATUS.PUBLISHED)" v-ripple>发布</ElButton>
        <ElButton @click="handleBatchStatus(ARTICLE_STATUS.UNPUBLISHED)" v-ripple> 下架 </ElButton>
      </template>

      <template #table>
        <ArtTable
          ref="tableRef"
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :row-class-name="getRowClassName"
          :show-table-header="false"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchArticlePage,
    deleteArticle,
    updateArticleStatus,
    ARTICLE_STATUS,
    type ArticleListItem
  } from '@/api/article'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import ArticleSearch, { type ArticleSearchForm } from './modules/article-search.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { ElImage, ElMessageBox, ElTag } from 'element-plus'

  defineOptions({ name: 'MarketingArticlePage' })

  const router = useRouter()

  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const showSearchBar = ref(true)
  const selectedIds = ref<number[]>([])
  const searchForm = ref<ArticleSearchForm>({
    keyword: undefined,
    status: undefined
  })

  const getStatusLabel = (status: number) => {
    switch (status) {
      case ARTICLE_STATUS.PUBLISHED:
        return '已发布'
      case ARTICLE_STATUS.DRAFT:
        return '草稿'
      case ARTICLE_STATUS.UNPUBLISHED:
        return '已下架'
      default:
        return '未知'
    }
  }

  const renderCover = (row: ArticleListItem) =>
    row.coverPic
      ? h(ElImage, {
          src: row.coverPic,
          fit: 'cover',
          class: 'size-10 rounded-lg',
          previewSrcList: [row.coverPic],
          previewTeleported: true
        })
      : h('div', { class: 'text-xs text-g-500' }, '暂无封面')

  const renderTitle = (row: ArticleListItem) =>
    h('div', { class: 'flex flex-col gap-1' }, [
      h('div', { class: 'font-medium text-g-900 truncate' }, row.title || '无标题'),
      h('div', { class: 'text-xs text-g-500 truncate' }, row.subTitle || '—')
    ])

  const renderStatus = (row: ArticleListItem) =>
    h(
      ElTag,
      {
        size: 'small',
        effect: 'light',
        type:
          row.status === ARTICLE_STATUS.PUBLISHED
            ? 'success'
            : row.status === ARTICLE_STATUS.UNPUBLISHED
              ? 'danger'
              : 'warning'
      },
      () => getStatusLabel(row.status)
    )

  const renderOperation = (row: ArticleListItem) =>
    h('div', { class: 'flex items-center gap-1' }, [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => handleEdit(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDelete(row)
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
      apiFn: fetchArticlePage,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection', width: 56 },
        { type: 'index', width: 70, label: '序号' },
        {
          prop: 'coverPic',
          label: '封面',
          width: 100,
          formatter: (row) => renderCover(row)
        },
        {
          prop: 'title',
          label: '文章信息',
          minWidth: 240,
          formatter: (row) => renderTitle(row)
        },
        {
          prop: 'categoryLabel',
          label: '分类',
          width: 120,
          formatter: (row) => row.categoryLabel || '-'
        },
        {
          prop: 'author',
          label: '作者',
          width: 120,
          formatter: (row) => row.author || '-'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) => renderStatus(row)
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          sortable: true,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row) => renderOperation(row)
        }
      ]
    }
  })

  const handleSearch = (params: ArticleSearchForm) => {
    selectedIds.value = []
    replaceSearchParams(params)
    getData()
  }

  const handleSelectionChange = (selection: ArticleListItem[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  const handleCreate = () => {
    router.push({ name: 'MarketingArticleCreate' })
  }

  const handleEdit = (row: ArticleListItem) => {
    router.push({ name: 'MarketingArticleEdit', params: { id: row.id } })
  }

  const shouldIgnoreRowClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    return !!target?.closest(
      '.el-checkbox, .el-button, .ease-table-action, .art-button-table, .el-image, .el-image__inner'
    )
  }

  const getRowClassName = () => 'marketing-article-page__table-row'

  const handleRowClick = (row: ArticleListItem, _column: unknown, event: MouseEvent) => {
    if (shouldIgnoreRowClick(event)) return
    handleEdit(row)
  }

  const handleDelete = async (row: ArticleListItem) => {
    try {
      await ElMessageBox.confirm('此操作无法撤销。确定要删除该文章吗？', '确认删除', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
      await deleteArticle(row.id)
      refreshData()
    } catch {
      // ignore
    }
  }

  const handleBatchStatus = async (status: number) => {
    if (!selectedIds.value.length) return

    const label = status === ARTICLE_STATUS.PUBLISHED ? '发布' : '下架'

    try {
      await ElMessageBox.confirm(
        `确定要${label}选中的 ${selectedIds.value.length} 篇文章吗？`,
        '提示',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
      )
      await updateArticleStatus(selectedIds.value, status)
      selectedIds.value = []
      refreshData()
    } catch {
      // ignore
    }
  }
</script>

<style scoped lang="scss">
  :deep(.marketing-article-page__table-row) {
    cursor: pointer;
  }
</style>
