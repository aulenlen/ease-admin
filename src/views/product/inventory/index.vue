<template>
  <div class="art-full-height inventory-page">
    <div class="space-y-4">
      <InventorySearch
        v-model="searchForm"
        :brand-options="filterOptions.brands"
        :category-options="filterOptions.categories"
        :stock-status-options="filterOptions.stockStatuses"
        @search="handleSearch"
        @reset="handleResetSearch"
      />

      <ElCard class="art-table-card inventory-page__workbench">
        <div class="mb-3 border-b border-[var(--el-border-color-lighter)] pb-3">
          <InventorySummaryCards :items="summaryCards" />
        </div>

        <div class="mb-3">
          <SpuStatusTabs v-model="activeTab" :items="tabItems" />
        </div>

        <ArtTable
          :loading="loading"
          :data="data"
          row-key="spuId"
          :expand-row-keys="expandedRowKeys"
          :columns="columns"
          :pagination="pagination"
          :pagination-options="{ align: 'right' }"
          @row-click="handleRowClick"
          @expand-change="handleExpandChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>

    <InventoryLogDrawer
      v-model="logDrawerVisible"
      :loading="logLoading"
      :sku="activeLogSku"
      :items="logList"
    />

    <InventoryCreateDialog
      v-model="createDialogVisible"
      :loading="creatingStock"
      :spu="activeCreateSpu"
      :candidates="createSkuCandidates"
      :form="createForm"
      @submit="handleSubmitCreateStock"
      @closed="handleCreateDialogClosed"
    />
  </div>
</template>

<script setup lang="ts">
  import { CircleCloseFilled, Goods, List, WarningFilled } from '@element-plus/icons-vue'
  import { ElImage, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import {
    createStock,
    deleteSku,
    fetchSkuBySpuId,
    fetchStockBySpuId,
    fetchStockFilterOptions,
    fetchStockLogs,
    fetchStockPage,
    fetchStockStats,
    updateStock,
    type CreateStockPayload,
    type InventoryFilterOptions,
    type InventorySkuRow,
    type InventorySpuRow,
    type InventorySummary,
    type InventoryTab,
    type SkuCandidate,
    type StockLogItem
  } from '@/api/sku-stock'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import InventoryCreateDialog, {
    type CreateInventoryForm
  } from './modules/inventory-create-dialog.vue'
  import InventoryLogDrawer from './modules/inventory-log-drawer.vue'
  import InventorySearch, { type InventorySearchForm } from './modules/inventory-search.vue'
  import InventorySpuExpand from './modules/inventory-spu-expand.vue'
  import InventorySummaryCards from './modules/inventory-summary-cards.vue'
  import SpuStatusTabs from '../spu/modules/spu-status-tabs.vue'

  defineOptions({ name: 'ProductInventoryPage' })

  interface InventorySpuRowState extends InventorySpuRow {
    records: InventorySkuRow[]
    recordsLoaded: boolean
    recordsLoading: boolean
  }

  const router = useRouter()
  const numberFormatter = new Intl.NumberFormat('zh-CN')
  const activeTab = ref<InventoryTab>('all')
  const expandedRowKeys = ref<string[]>([])
  const filterOptions = ref<InventoryFilterOptions>({
    brands: [],
    categories: [],
    stockStatuses: [],
    tabs: []
  })
  const summary = ref<InventorySummary>({
    spuCount: 0,
    skuCount: 0,
    warningSpuCount: 0,
    emptySpuCount: 0,
    presaleSpuCount: 0
  })
  const tabTotals = ref<Record<InventoryTab, number>>({
    all: 0,
    warning: 0,
    empty: 0,
    presale: 0
  })
  const searchForm = ref<InventorySearchForm>({
    keyword: undefined,
    brandId: undefined,
    categoryId: undefined,
    stockStatus: undefined,
    lowStockWarning: false
  })
  const originBySkuId = ref(new Map<number, { stock: number; lowStock: number }>())

  const logDrawerVisible = ref(false)
  const logLoading = ref(false)
  const activeLogSku = ref<(InventorySkuRow & { spuName?: string; brandName?: string }) | null>(
    null
  )
  const logList = ref<StockLogItem[]>([])

  const createDialogVisible = ref(false)
  const creatingStock = ref(false)
  const activeCreateSpu = ref<InventorySpuRowState | null>(null)
  const createSkuCandidates = ref<SkuCandidate[]>([])
  const createForm = reactive<CreateInventoryForm>({
    skuId: undefined,
    stock: 0,
    lowStock: 0,
    stockStatus: 0
  })

  const formatNumber = (value: number) => numberFormatter.format(value || 0)
  const rowInlineStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '0'
  } as const
  const expandTriggerBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: '0',
    color: 'var(--el-text-color-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  } as const
  const imageBoxStyle = {
    width: '44px',
    height: '44px',
    flexShrink: '0',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--el-border-color-lighter)',
    background: 'var(--el-fill-color-light)'
  } as const
  const imageFallbackStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    fontSize: '12px',
    color: 'var(--el-text-color-placeholder)',
    background: 'var(--el-fill-color-light)'
  } as const
  const primaryTextStyle = {
    display: 'block',
    minWidth: '0',
    overflow: 'hidden',
    fontWeight: '600',
    color: 'var(--el-text-color-primary)',
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  } as const
  const secondaryTextStyle = {
    display: 'inline-block',
    overflow: 'hidden',
    fontSize: '12px',
    color: 'var(--el-text-color-secondary)',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  } as const

  const renderSpuImageCell = (row: InventorySpuRowState) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      },
      [
        h(
          ElImage,
          {
            src: row.pic,
            fit: 'cover',
            style: imageBoxStyle
          },
          {
            error: () => h('div', { style: imageFallbackStyle }, '暂无'),
            placeholder: () => h('div', { style: imageFallbackStyle }, '加载中')
          }
        )
      ]
    )

  const renderSpuExpandTrigger = (row: InventorySpuRowState) => {
    const expanded = expandedRowKeys.value.includes(String(row.spuId))

    return h(
      'button',
      {
        type: 'button',
        style: {
          ...expandTriggerBaseStyle,
          margin: '0 auto',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
        },
        onClick: async (event: MouseEvent) => {
          event.stopPropagation()
          if (expanded) {
            collapseExpanded(row.spuId)
            return
          }
          await expandSpuRow(row)
        }
      },
      h('span', { style: { fontSize: '16px', lineHeight: '1' } }, '›')
    )
  }

  const renderSpuNameCell = (row: InventorySpuRowState) =>
    h(
      'div',
      {
        style: {
          ...rowInlineStyle,
          gap: '0'
        }
      },
      [h('span', { style: primaryTextStyle }, row.spuName)]
    )

  const renderMetaText = (value?: string) => h('span', { style: secondaryTextStyle }, value || '-')

  const renderStockSummary = (row: InventorySpuRowState) =>
    h('div', { class: 'flex flex-col text-center' }, [
      h('div', formatNumber(row.totalAvailableStock)),
      h('div', { class: 'text-xs text-g-500' }, `锁定 ${formatNumber(row.totalLockStock)}`)
    ])

  const renderIssueSummary = (row: InventorySpuRowState) => {
    const nodes = [
      row.warningSkuCount > 0
        ? h(ElTag, { type: 'warning', effect: 'plain' }, () => `预警 ${row.warningSkuCount}`)
        : null,
      row.emptySkuCount > 0
        ? h(ElTag, { type: 'danger', effect: 'plain' }, () => `缺货 ${row.emptySkuCount}`)
        : null,
      row.presaleSkuCount > 0
        ? h(ElTag, { type: 'success', effect: 'plain' }, () => `预售 ${row.presaleSkuCount}`)
        : null
    ].filter(Boolean)

    if (!nodes.length) {
      return h('span', { class: 'text-xs text-g-500' }, '暂无异常')
    }

    return h('div', { class: 'flex flex-wrap justify-center gap-2' }, nodes)
  }

  const renderOperationCell = (row: InventorySpuRowState) =>
    h('div', { class: 'flex items-center justify-center gap-2' }, [
      h(ArtButtonTable, {
        type: 'add',
        onClick: () => openCreateDialog(row)
      }),
      h(ArtButtonTable, {
        type: 'view',
        onClick: () => router.push(`/product/spu/detail/${row.spuId}`)
      })
    ])

  const buildSearchParams = () => ({
    keyword: searchForm.value.keyword,
    brandId: searchForm.value.brandId,
    categoryId: searchForm.value.categoryId,
    stockStatus: searchForm.value.stockStatus,
    lowStockWarning: searchForm.value.lowStockWarning,
    tab: activeTab.value
  })

  const mapInventorySpuRowState = (row: InventorySpuRow): InventorySpuRowState => ({
    ...row,
    records: [],
    recordsLoaded: false,
    recordsLoading: false
  })

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchStockPage,
      apiParams: {
        current: 1,
        size: 10
      },
      columnsFactory: () => [
        {
          prop: 'expandTrigger',
          label: '',
          width: 56,
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => renderSpuExpandTrigger(row as InventorySpuRowState)
        },
        {
          prop: 'spuImage',
          label: '商品图片',
          width: 96,
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => renderSpuImageCell(row as InventorySpuRowState)
        },
        {
          prop: 'spuInfo',
          label: '商品名称',
          minWidth: 240,
          headerAlign: 'left',
          formatter: (row: any) => renderSpuNameCell(row as InventorySpuRowState)
        },
        {
          prop: 'brandName',
          label: '品牌',
          minWidth: 140,
          headerAlign: 'left',
          formatter: (row: any) => renderMetaText(row.brandName)
        },
        {
          prop: 'categoryName',
          label: '分类',
          minWidth: 140,
          headerAlign: 'left',
          formatter: (row: any) => renderMetaText(row.categoryName)
        },
        {
          prop: 'skuCount',
          label: 'SKU 数',
          width: 100,
          align: 'center',
          headerAlign: 'center'
        },
        {
          prop: 'totalSale',
          label: '销量',
          width: 110,
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => formatNumber(row.totalSale)
        },
        {
          prop: 'stock',
          label: '可售 / 锁定',
          width: 150,
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => renderStockSummary(row as InventorySpuRowState)
        },
        {
          prop: 'issue',
          label: '异常 SKU',
          width: 180,
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => renderIssueSummary(row as InventorySpuRowState)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          align: 'center',
          headerAlign: 'center',
          formatter: (row: any) => renderOperationCell(row as InventorySpuRowState)
        },
        {
          type: 'expand',
          width: 0,
          className: 'inventory-page__expand-holder',
          labelClassName: 'inventory-page__expand-holder',
          formatter: (row: any) =>
            h(InventorySpuExpand, {
              rows: row.records,
              loading: row.recordsLoading,
              isDirty: isRowDirty,
              onStockChange: (sku: InventorySkuRow) => handleSkuStockChange(sku),
              onLog: (sku: InventorySkuRow) => openLogDrawer(sku, row),
              onSave: (sku: InventorySkuRow) => handleSaveSku(sku),
              onDelete: (sku: InventorySkuRow) => handleDeleteSku(sku)
            })
        }
      ]
    },
    transform: {
      dataTransformer: (rows) => rows.map(mapInventorySpuRowState)
    }
  })

  const inventoryRows = computed(() => data.value as InventorySpuRowState[])

  const summaryCards = computed(() => [
    {
      key: 'spu',
      label: '在管商品',
      value: formatNumber(summary.value.spuCount),
      meta: `覆盖 ${formatNumber(summary.value.skuCount)} 个 SKU`,
      tone: 'sky' as const,
      icon: Goods
    },
    {
      key: 'warning',
      label: '低库存商品',
      value: formatNumber(summary.value.warningSpuCount),
      meta: '优先关注补货',
      tone: 'slate' as const,
      icon: List
    },
    {
      key: 'empty',
      label: '缺货商品',
      value: formatNumber(summary.value.emptySpuCount),
      meta: '建议尽快处理',
      tone: 'amber' as const,
      icon: WarningFilled
    },
    {
      key: 'presale',
      label: '预售商品',
      value: formatNumber(summary.value.presaleSpuCount),
      meta: '按页签查看明细',
      tone: 'rose' as const,
      icon: CircleCloseFilled
    }
  ])

  const tabItems = computed(() => {
    const source = filterOptions.value.tabs.length
      ? filterOptions.value.tabs
      : [
          { value: 'all', label: '全部商品' },
          { value: 'warning', label: '低库存商品' },
          { value: 'empty', label: '缺货商品' },
          { value: 'presale', label: '预售商品' }
        ]

    return source.map((item) => ({
      key: item.value as InventoryTab,
      label: item.label,
      count: formatNumber(tabTotals.value[item.value as InventoryTab] || 0)
    }))
  })

  const isRowDirty = (row: InventorySkuRow) => {
    const origin = originBySkuId.value.get(row.skuId)
    if (!origin) return false
    return origin.stock !== row.stock || origin.lowStock !== row.lowStock
  }

  const syncOrigin = () => {
    originBySkuId.value = new Map(
      inventoryRows.value.flatMap((row) =>
        row.records.map(
          (item) =>
            [
              item.skuId,
              {
                stock: item.stock,
                lowStock: item.lowStock
              }
            ] as const
        )
      )
    )
  }

  const loadFilterOptions = async () => {
    filterOptions.value = await fetchStockFilterOptions()
  }

  const loadStats = async () => {
    const stats = await fetchStockStats({
      current: pagination.current,
      size: pagination.size,
      ...buildSearchParams()
    })

    summary.value = stats.summary
    tabTotals.value = stats.tabTotals
  }

  const refreshAll = async () => {
    await Promise.all([refreshData(), loadStats()])
  }

  const handleSearch = async () => {
    replaceSearchParams(buildSearchParams())
    await Promise.all([getData(), loadStats()])
  }

  const handleResetSearch = async () => {
    resetSearchParams()
    searchForm.value = {
      keyword: undefined,
      brandId: undefined,
      categoryId: undefined,
      stockStatus: undefined,
      lowStockWarning: false
    }
    activeTab.value = 'all'
    replaceSearchParams(buildSearchParams())
    await Promise.all([getData(), loadStats()])
  }

  const handleSkuStockChange = (row: InventorySkuRow) => {
    row.stockStatus = row.stock > 0 ? (row.stockStatus === 2 ? 2 : 1) : 0
  }

  const ensureExpanded = (spuId: number) => {
    const key = String(spuId)
    if (expandedRowKeys.value.includes(key)) return
    expandedRowKeys.value = [...expandedRowKeys.value, key]
  }

  const collapseExpanded = (spuId: number) => {
    expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== String(spuId))
  }

  const ensureSpuRecords = async (row: InventorySpuRowState, force = false) => {
    if (!force && (row.recordsLoaded || row.recordsLoading)) return
    row.recordsLoading = true

    try {
      row.records = await fetchStockBySpuId(row.spuId)
      row.recordsLoaded = true
      syncOrigin()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '加载 SKU 库存失败')
    } finally {
      row.recordsLoading = false
    }
  }

  const expandSpuRow = async (row: InventorySpuRowState, force = false) => {
    ensureExpanded(row.spuId)
    await ensureSpuRecords(row, force)
  }

  const reloadSpuRowRecords = async (spuId: number) => {
    const target = inventoryRows.value.find((item) => item.spuId === spuId)
    if (!target) return null

    target.recordsLoaded = false
    target.records = []
    await expandSpuRow(target, true)
    return target
  }

  const handleExpandChange = async (
    row: InventorySpuRowState,
    expandedRows: InventorySpuRowState[]
  ) => {
    const expanded = expandedRows.some((item) => item.spuId === row.spuId)
    if (!expanded) {
      collapseExpanded(row.spuId)
      return
    }

    await expandSpuRow(row)
  }

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return Boolean(
      target.closest(
        'button, a, input, textarea, .el-input-number, .el-input, .el-select, .el-checkbox, .el-table__expand-icon'
      )
    )
  }

  const handleRowClick = async (row: InventorySpuRowState, _column: unknown, event: Event) => {
    if (isInteractiveTarget(event.target)) return
    if (expandedRowKeys.value.includes(String(row.spuId))) {
      collapseExpanded(row.spuId)
      return
    }
    await expandSpuRow(row)
  }

  const openLogDrawer = async (
    sku: InventorySkuRow,
    row?: Pick<InventorySpuRowState, 'spuName' | 'brandName'>
  ) => {
    activeLogSku.value = {
      ...sku,
      spuName: row?.spuName,
      brandName: row?.brandName
    }
    logDrawerVisible.value = true
    logLoading.value = true

    try {
      logList.value = await fetchStockLogs(sku.skuId)
    } finally {
      logLoading.value = false
    }
  }

  const handleSaveSku = async (row: InventorySkuRow) => {
    await updateStock({
      id: Number(row.id || 0),
      skuId: row.skuId,
      spuId: row.spuId,
      stock: row.stock,
      lowStock: row.lowStock,
      stockStatus: row.stockStatus
    })

    await reloadSpuRowRecords(row.spuId)
  }

  const handleDeleteSku = async (row: InventorySkuRow) => {
    await ElMessageBox.confirm(`确定删除 SKU “${row.skuCode}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteSku(row.skuId)
    await reloadSpuRowRecords(row.spuId)
    await refreshAll()
  }

  const resetCreateForm = () => {
    createForm.skuId = undefined
    createForm.stock = 0
    createForm.lowStock = 0
    createForm.stockStatus = 0
  }

  const openCreateDialog = async (row: InventorySpuRowState) => {
    activeCreateSpu.value = row
    createDialogVisible.value = true
    resetCreateForm()

    if (!row.recordsLoaded && !row.recordsLoading) {
      await ensureSpuRecords(row)
    }

    const candidates = await fetchSkuBySpuId(row.spuId)
    const existingIds = new Set(row.records.map((item) => item.skuId))
    createSkuCandidates.value = candidates.filter((item) => !existingIds.has(item.id))
  }

  const handleSubmitCreateStock = async (payload: CreateInventoryForm) => {
    if (!activeCreateSpu.value || !payload.skuId) return

    creatingStock.value = true
    try {
      await createStock({
        skuId: payload.skuId,
        spuId: activeCreateSpu.value.spuId,
        stock: payload.stock,
        lowStock: payload.lowStock,
        stockStatus: payload.stockStatus
      } satisfies CreateStockPayload)

      createDialogVisible.value = false
      await Promise.all([reloadSpuRowRecords(activeCreateSpu.value.spuId), refreshAll()])
    } finally {
      creatingStock.value = false
    }
  }

  const handleCreateDialogClosed = () => {
    activeCreateSpu.value = null
    createSkuCandidates.value = []
    resetCreateForm()
  }

  watch(activeTab, async () => {
    replaceSearchParams(buildSearchParams())
    await Promise.all([getData(), loadStats()])
  })

  watch(
    inventoryRows,
    async (rows) => {
      const expandedRows = rows.filter((row) => expandedRowKeys.value.includes(String(row.spuId)))
      if (!expandedRows.length) return

      for (const row of expandedRows) {
        if (!row.recordsLoaded && !row.recordsLoading) {
          await ensureSpuRecords(row)
        }
      }
    },
    { flush: 'post' }
  )

  onMounted(async () => {
    await loadFilterOptions()
    replaceSearchParams(buildSearchParams())
    await Promise.all([getData(), loadStats()])
  })
</script>

<style scoped lang="scss">
  .inventory-page__workbench {
    :deep(.el-card__body) {
      padding-top: 16px;
    }

    :deep(.inventory-page__expand-holder) {
      width: 0 !important;
      min-width: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    :deep(.inventory-page__expand-holder .cell) {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    :deep(.inventory-page__expand-holder .el-table__expand-icon) {
      display: none !important;
    }

    :deep(.el-table__expanded-cell) {
      padding: 0 !important;
      background: transparent !important;
      border-bottom: 0 !important;
    }
  }
</style>
