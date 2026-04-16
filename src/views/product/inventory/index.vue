<template>
  <EaseTablePage
    class="product-inventory-page"
    v-model:columns="columnChecks"
    v-model:showSearchBar="showSearchBar"
    :loading="loading"
    :selection-count="selectedSkuIds.length"
    @refresh="refreshAll"
  >
    <template #toolbarTop>
      <EaseSegmentTabs v-model="activeTab" :items="tabItems" />
    </template>

    <template #search>
      <InventorySearch
        v-model="searchForm"
        class="product-inventory-page__search"
        :brand-options="filterOptions.brands"
        :category-options="categoryTree"
        :stock-status-options="stockStatusOptions"
        @search="handleSearch"
      />
    </template>

    <template #selectionText="{ count }">已选{{ count }}个 SKU</template>

    <template #selectionActions>
      <ElButton
        v-for="action in selectionStatusActions"
        :key="action.value"
        :disabled="statusBatchLoading"
        @click="handleBatchStatusUpdate(action.value)"
        v-ripple
      >
        {{ action.label }}
      </ElButton>
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
        row-key="skuId"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </template>
  </EaseTablePage>

  <InventoryLogDrawer
    v-model="logDrawerVisible"
    :loading="logLoading"
    :sku="activeLogSku"
    :items="logList"
  />
</template>

<script setup lang="ts">
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import {
    fetchStockFilterOptions,
    fetchStockLogs,
    fetchStockPage,
    updateStock,
    updateStockStatusBatch,
    type InventoryFilterOptions,
    type InventorySkuRow,
    type InventoryTab,
    type OptionItem,
    type StockLogItem,
    type StockStatus,
    type UpdateStockPayload
  } from '@/api/sku-stock'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElImage, ElInput, ElMessage, ElMessageBox } from 'element-plus'
  import InventoryLogDrawer from './modules/inventory-log-drawer.vue'
  import InventorySearch, { type InventorySearchForm } from './modules/inventory-search.vue'

  defineOptions({ name: 'ProductInventoryPage' })

  interface InventoryOriginState {
    stock: number
    lowStock: number
    stockStatus: StockStatus
  }

  interface InventoryStatusAction {
    value: StockStatus
    label: string
    confirmTitle: string
  }

  const DEFAULT_TABS: OptionItem[] = [
    { value: 'all', label: '全部库存' },
    { value: 'warning', label: '低库存' },
    { value: 'empty', label: '缺货' },
    { value: 'presale', label: '预售' }
  ]

  const DEFAULT_STOCK_STATUS_OPTIONS: OptionItem[] = [
    { value: 0, label: '无货' },
    { value: 1, label: '有货' },
    { value: 2, label: '预售' }
  ]

  const STATUS_ACTIONS: InventoryStatusAction[] = [
    { value: 1, label: '批量设为有货', confirmTitle: '批量设为有货' },
    { value: 0, label: '批量设为无货', confirmTitle: '批量设为无货' },
    { value: 2, label: '批量设为预售', confirmTitle: '批量设为预售' }
  ]

  const router = useRouter()
  const tableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()
  const numberFormatter = new Intl.NumberFormat('zh-CN')
  const showSearchBar = ref(true)
  const batchSaving = ref(false)
  const statusBatchLoading = ref(false)
  const savingSkuIds = ref<number[]>([])
  const selectedSkuIds = ref<number[]>([])
  const activeTab = ref<InventoryTab>('all')
  const categoryTree = ref<CategoryTreeItem[]>([])
  const filterOptions = ref<InventoryFilterOptions>({
    brands: [],
    categories: [],
    stockStatuses: DEFAULT_STOCK_STATUS_OPTIONS,
    tabs: DEFAULT_TABS
  })
  const searchForm = ref<InventorySearchForm>({
    keyword: undefined,
    brandId: undefined,
    categoryId: undefined,
    stockStatus: undefined,
    lowStockWarning: false
  })
  const originBySkuId = ref(new Map<number, InventoryOriginState>())

  const logDrawerVisible = ref(false)
  const logLoading = ref(false)
  const activeLogSku = ref<(InventorySkuRow & { spuName?: string; brandName?: string }) | null>(
    null
  )
  const logList = ref<StockLogItem[]>([])

  const inventoryRows = computed(() => data.value as InventorySkuRow[])
  const selectedRows = computed(() =>
    inventoryRows.value.filter((item) => selectedSkuIds.value.includes(item.skuId))
  )
  const selectionStatusActions = computed(() => STATUS_ACTIONS)
  const tabItems = computed(() => {
    const tabs = filterOptions.value.tabs.length ? filterOptions.value.tabs : DEFAULT_TABS
    return tabs.map((item) => ({
      value: String(item.value) as InventoryTab,
      label: item.label
    }))
  })
  const stockStatusOptions = computed(() =>
    filterOptions.value.stockStatuses.length
      ? filterOptions.value.stockStatuses
      : DEFAULT_STOCK_STATUS_OPTIONS
  )

  const toOptionalNumber = (value: unknown) => {
    if (value === undefined || value === null || value === '') return undefined
    const next = Number(value)
    return Number.isNaN(next) ? undefined : next
  }

  const formatNumber = (value: number) => numberFormatter.format(value || 0)

  const formatSpecs = (specs: InventorySkuRow['specs']) =>
    specs
      .map((item) => [item.attrName, item.attrValue].filter(Boolean).join('：'))
      .filter(Boolean)
      .join(' · ')

  const normalizeIntegerInput = (value: unknown) => {
    const rawValue = String(value ?? '').trim()
    if (!rawValue) return 0

    const normalized = rawValue.replace(/[^\d]/g, '')
    return normalized ? Number(normalized) : 0
  }

  const buildSearchParams = () => ({
    keyword: searchForm.value.keyword?.trim() || undefined,
    brandId: toOptionalNumber(searchForm.value.brandId),
    categoryId: searchForm.value.categoryId?.length
      ? searchForm.value.categoryId[searchForm.value.categoryId.length - 1]
      : undefined,
    stockStatus: toOptionalNumber(searchForm.value.stockStatus) as StockStatus | undefined,
    lowStockWarning: searchForm.value.lowStockWarning || undefined,
    tab: activeTab.value
  })

  const syncOrigin = (rows: InventorySkuRow[]) => {
    originBySkuId.value = new Map(
      rows.map((row) => [
        row.skuId,
        {
          stock: row.stock,
          lowStock: row.lowStock,
          stockStatus: row.stockStatus
        }
      ])
    )
  }

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
      apiFn: fetchStockPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: () => [
        {
          type: 'selection',
          width: 56
        },
        {
          type: 'index',
          width: 68,
          label: '序号'
        },
        {
          prop: 'spuName',
          label: '商品信息',
          minWidth: 240,
          formatter: (row) => renderProductInfoCell(row)
        },
        {
          prop: 'skuCode',
          label: 'SKU 编码',
          minWidth: 160,
          formatter: (row) => row.skuCode || '-'
        },
        {
          prop: 'sale',
          label: '销量',
          width: 100,
          formatter: (row) => formatNumber(row.sale)
        },
        {
          prop: 'stock',
          label: '可售库存',
          width: 150,
          formatter: (row) => renderStockInput(row)
        },
        {
          prop: 'lockStock',
          label: '锁定库存',
          width: 112,
          formatter: (row) => formatNumber(row.lockStock)
        },
        {
          prop: 'lowStock',
          label: '低库存预警',
          width: 150,
          formatter: (row) => renderLowStockInput(row)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 112,
          fixed: 'right',
          formatter: (row) => renderOperationCell(row)
        }
      ]
    },
    hooks: {
      onSuccess: (rows) => syncOrigin(rows as InventorySkuRow[])
    }
  })

  const isRowDirty = (row: InventorySkuRow) => {
    const origin = originBySkuId.value.get(row.skuId)
    if (!origin) return false
    return (
      origin.stock !== row.stock ||
      origin.lowStock !== row.lowStock ||
      origin.stockStatus !== row.stockStatus
    )
  }

  const isSavingSku = (skuId: number) =>
    batchSaving.value || statusBatchLoading.value || savingSkuIds.value.includes(skuId)

  const markSaving = (skuId: number, saving: boolean) => {
    if (saving) {
      if (!savingSkuIds.value.includes(skuId)) {
        savingSkuIds.value = [...savingSkuIds.value, skuId]
      }
      return
    }

    savingSkuIds.value = savingSkuIds.value.filter((item) => item !== skuId)
  }

  const clearSelection = () => {
    selectedSkuIds.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
  }

  const createUpdatePayload = (row: InventorySkuRow): UpdateStockPayload => ({
    id: Number(row.id || 0),
    skuId: row.skuId,
    spuId: row.spuId,
    stock: row.stock,
    lowStock: row.lowStock,
    stockStatus: row.stockStatus
  })

  function renderProductInfoCell(row: InventorySkuRow) {
    const specsText = formatSpecs(row.specs) || '默认规格'

    return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
      row.pic
        ? h(ElImage, {
            src: row.pic,
            fit: 'cover',
            class: 'size-10 rounded-lg shrink-0',
            previewSrcList: [row.pic],
            previewTeleported: true
          })
        : h(
            'div',
            {
              class:
                'size-10 shrink-0 rounded-lg bg-[var(--el-fill-color-light)] text-xs text-g-500 flex items-center justify-center'
            },
            '暂无图片'
          ),
      h('div', { class: 'min-w-0 flex-1 flex flex-col gap-1' }, [
        h(
          'button',
          {
            type: 'button',
            class: 'min-w-0 cursor-pointer truncate text-left font-medium text-g-900',
            onClick: () => router.push(`/product/spu/detail/${row.spuId}`)
          },
          row.spuName || '-'
        ),
        h(
          'div',
          { class: 'min-w-0 truncate text-xs text-g-500' },
          `${specsText} · ${row.categoryName || '未分类'}`
        )
      ])
    ])
  }

  function handleStockValueChange(row: InventorySkuRow, value: unknown) {
    row.stock = normalizeIntegerInput(value)
    if (row.stock <= 0 && row.stockStatus !== 2) {
      row.stockStatus = 0
    }
    if (row.stock > 0 && row.stockStatus === 0) {
      row.stockStatus = 1
    }
  }

  function renderStockInput(row: InventorySkuRow) {
    return h(ElInput, {
      modelValue: String(row.stock ?? 0),
      class: 'w-full',
      disabled: isSavingSku(row.skuId),
      inputmode: 'numeric',
      'onUpdate:modelValue': (value: unknown) => handleStockValueChange(row, value)
    })
  }

  function renderLowStockInput(row: InventorySkuRow) {
    return h(ElInput, {
      modelValue: String(row.lowStock ?? 0),
      class: 'w-full',
      disabled: isSavingSku(row.skuId),
      inputmode: 'numeric',
      'onUpdate:modelValue': (value: unknown) => {
        row.lowStock = normalizeIntegerInput(value)
      }
    })
  }

  function renderOperationCell(row: InventorySkuRow) {
    return h('div', { class: 'flex items-center gap-2 max-md:gap-1.5' }, [
      h(ArtButtonTable, {
        icon: 'ri:file-list-3-line',
        iconClass: 'ease-table-action ease-table-action--view',
        onClick: () => openLogDrawer(row)
      }),
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: isRowDirty(row)
          ? 'ease-table-action ease-table-action--edit'
          : 'ease-table-action ease-table-action--edit opacity-45',
        onClick: () => handleSaveSku(row)
      })
    ])
  }

  const loadBaseOptions = async () => {
    const [options, categories] = await Promise.all([
      fetchStockFilterOptions(),
      fetchCategoryTree()
    ])
    filterOptions.value = options
    categoryTree.value = categories || []

    const currentTabs = new Set(
      (filterOptions.value.tabs.length ? filterOptions.value.tabs : DEFAULT_TABS).map((item) =>
        String(item.value)
      )
    )

    if (!currentTabs.has(activeTab.value)) {
      activeTab.value = currentTabs.has('all')
        ? 'all'
        : (String((filterOptions.value.tabs[0] || DEFAULT_TABS[0]).value) as InventoryTab)
    }
  }

  const refreshAll = async () => {
    clearSelection()
    await refreshData()
  }

  const handleSearch = async () => {
    clearSelection()
    replaceSearchParams(buildSearchParams())
    await getData()
  }

  const handleSelectionChange = (selection: InventorySkuRow[]) => {
    selectedSkuIds.value = selection.map((item) => item.skuId)
  }

  const getRowClassName = ({ row }: { row: InventorySkuRow }) =>
    selectedSkuIds.value.includes(row.skuId) ? 'product-inventory-page__table-row--selected' : ''

  const openLogDrawer = async (sku: InventorySkuRow) => {
    activeLogSku.value = {
      ...sku,
      spuName: sku.spuName,
      brandName: sku.brandName
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
    if (!isRowDirty(row) || isSavingSku(row.skuId)) return

    markSaving(row.skuId, true)

    try {
      await updateStock(createUpdatePayload(row))
      clearSelection()
      await refreshData()
    } finally {
      markSaving(row.skuId, false)
    }
  }

  const handleBatchStatusUpdate = async (stockStatus: StockStatus) => {
    if (!selectedRows.value.length || statusBatchLoading.value) return

    const action = STATUS_ACTIONS.find((item) => item.value === stockStatus)
    if (!action) return

    await ElMessageBox.confirm(
      `确定将已选中的 ${selectedRows.value.length} 个 SKU ${action.label.replace('批量', '')}吗？`,
      action.confirmTitle,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    statusBatchLoading.value = true

    try {
      await updateStockStatusBatch({
        skuIds: selectedRows.value.map((item) => item.skuId),
        stockStatus
      })
      await refreshAll()
    } finally {
      statusBatchLoading.value = false
    }
  }

  watch(activeTab, async () => {
    clearSelection()
    replaceSearchParams(buildSearchParams())
    await getData()
  })

  onMounted(async () => {
    try {
      await loadBaseOptions()
      replaceSearchParams(buildSearchParams())
      await getData()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '加载库存列表失败')
    }
  })

  onActivated(() => {
    void refreshAll()
  })
</script>
