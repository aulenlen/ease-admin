<template>
  <div class="marketing-flash-page art-full-height">
    <EaseTablePage
      v-model:columns="activeColumnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="activeLoading"
      :selection-count="activeSelectionCount"
      @refresh="handleRefresh"
    >
      <template #pageActions>
        <ElButton
          v-if="activeTab === 'sessions'"
          type="primary"
          @click="openSessionDialog()"
          v-ripple
        >
          新建场次
        </ElButton>
        <ElButton v-else type="primary" @click="openProductSelector" v-ripple>添加商品</ElButton>
      </template>

      <template #toolbarTop>
        <EaseSegmentTabs v-model="activeTab" :items="tabItems" />
      </template>

      <template #search>
        <FlashSessionSearch
          v-if="activeTab === 'sessions'"
          v-model="sessionSearchForm"
          @search="handleSessionSearch"
        />
        <FlashProductSearch v-else v-model="productSearchForm" @search="handleProductSearch" />
      </template>

      <template #selectionText="{ count }">
        {{ activeTab === 'sessions' ? `已选${count}个场次` : `已选${count}个商品` }}
      </template>

      <template #selectionActions>
        <template v-if="activeTab === 'sessions'">
          <ElButton :disabled="sessionBatchLoading" @click="handleBatchSessionStatus(1)" v-ripple>
            启用
          </ElButton>
          <ElButton :disabled="sessionBatchLoading" @click="handleBatchSessionStatus(0)" v-ripple>
            禁用
          </ElButton>
        </template>

        <template v-else>
          <ElButton :disabled="productBatchDeleting" @click="handleBatchDeleteProducts" v-ripple>
            批量删除
          </ElButton>
        </template>
      </template>

      <template #table>
        <ArtTable
          v-if="activeTab === 'sessions'"
          ref="sessionTableRef"
          :loading="sessionLoading"
          :data="sessionData"
          :columns="sessionColumns"
          :pagination="sessionPagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          row-key="id"
          @selection-change="handleSessionSelectionChange"
          @pagination:size-change="handleSessionSizeChange"
          @pagination:current-change="handleSessionCurrentChange"
        />

        <ArtTable
          v-else
          ref="productTableRef"
          :loading="productLoading"
          :data="productData"
          :columns="productColumns"
          :pagination="productPagination"
          :pagination-options="{ hideOnSinglePage: false, align: 'right' }"
          :show-table-header="false"
          row-key="id"
          @selection-change="handleProductSelectionChange"
          @pagination:size-change="handleProductSizeChange"
          @pagination:current-change="handleProductCurrentChange"
        />
      </template>
    </EaseTablePage>

    <FlashSessionDialog
      v-model="sessionDialogVisible"
      :session="currentSession"
      :submitting="sessionSubmitting"
      @submit="handleSessionSubmit"
    />

    <FlashProductSelector v-model="selectorVisible" @confirm="handleProductSelectorConfirm" />

    <FlashConfigDialog
      v-model="configVisible"
      :selection="configSelection"
      :editing-product="editingProduct"
      :submitting="configSubmitting"
      @confirm="handleConfigConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElImage, ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import {
    createFlashProductBatch,
    createFlashSession,
    deleteFlashProduct,
    deleteFlashProductBatch,
    deleteFlashSession,
    fetchFlashProductPage,
    fetchFlashSessionPage,
    updateFlashProduct,
    updateFlashSession,
    updateFlashSessionStatusBatch,
    type FlashProductItem,
    type FlashProductQueryParams,
    type FlashProductSavePayload,
    type FlashSessionItem,
    type FlashSessionQueryParams,
    type FlashSessionSavePayload,
    type FlashSessionStatus
  } from '@/api/flash'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import FlashConfigDialog from './modules/flash-config-dialog.vue'
  import FlashProductSearch, {
    type FlashProductSearchForm
  } from './modules/flash-product-search.vue'
  import FlashProductSelector from './modules/flash-product-selector.vue'
  import FlashSessionDialog from './modules/flash-session-dialog.vue'
  import FlashSessionSearch, {
    type FlashSessionSearchForm
  } from './modules/flash-session-search.vue'
  import {
    formatFlashAttrValues,
    formatFlashSessionRange,
    getFlashProductRuntimeText,
    getFlashRouteTagType,
    getFlashRouteTypeText,
    getFlashRuntimeTagType,
    getFlashSessionRuntimeText,
    type FlashSkuConfig,
    type SelectedFlashSku
  } from './modules/flash-utils'

  defineOptions({ name: 'MarketingFlashPage' })

  type FlashPageTab = 'sessions' | 'products'

  const router = useRouter()
  const showSearchBar = ref(true)
  const activeTab = ref<FlashPageTab>('sessions')
  const sessionTableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()
  const productTableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()

  const sessionSearchForm = ref<FlashSessionSearchForm>({
    name: undefined,
    sessionStatus: undefined,
    timeRange: []
  })
  const productSearchForm = ref<FlashProductSearchForm>({
    sessionId: undefined,
    keyword: undefined,
    brandId: undefined,
    categoryId: undefined,
    spuId: undefined,
    skuId: undefined,
    routeType: undefined
  })

  const selectedSessionIds = ref<number[]>([])
  const selectedProductIds = ref<number[]>([])
  const switchingSessionIds = ref<number[]>([])
  const sessionBatchLoading = ref(false)
  const productBatchDeleting = ref(false)

  const sessionDialogVisible = ref(false)
  const currentSession = ref<FlashSessionItem | null>(null)
  const sessionSubmitting = ref(false)

  const selectorVisible = ref(false)
  const configVisible = ref(false)
  const configSelection = ref<SelectedFlashSku[]>([])
  const editingProduct = ref<FlashProductItem | null>(null)
  const configSubmitting = ref(false)

  const formatMoney = (value: number) => `¥${Number(value || 0).toFixed(2)}`

  const createSessionFilters = (form: FlashSessionSearchForm = sessionSearchForm.value) => {
    const [startTimeFrom, startTimeTo] = form.timeRange || []

    return {
      name: String(form.name || '').trim() || undefined,
      sessionStatus: form.sessionStatus ?? undefined,
      startTimeFrom: startTimeFrom || undefined,
      startTimeTo: startTimeTo || undefined
    } satisfies Partial<FlashSessionQueryParams>
  }

  const createProductFilters = (form: FlashProductSearchForm = productSearchForm.value) =>
    ({
      sessionId: form.sessionId,
      keyword: String(form.keyword || '').trim() || undefined,
      brandId: form.brandId,
      categoryId: form.categoryId,
      spuId: form.spuId,
      skuId: form.skuId,
      routeType: form.routeType ?? undefined
    }) satisfies Partial<FlashProductQueryParams>

  const {
    columns: sessionColumns,
    columnChecks: sessionColumnChecks,
    data: sessionData,
    loading: sessionLoading,
    pagination: sessionPagination,
    getData: getSessionData,
    replaceSearchParams: replaceSessionSearchParams,
    handleSizeChange: handleSessionSizeChange,
    handleCurrentChange: handleSessionCurrentChange,
    refreshData: refreshSessionData,
    refreshCreate: refreshSessionCreate,
    refreshUpdate: refreshSessionUpdate,
    refreshRemove: refreshSessionRemove
  } = useTable({
    core: {
      apiFn: fetchFlashSessionPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: (): ColumnOption<FlashSessionItem>[] => [
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
          prop: 'name',
          label: '场次信息',
          minWidth: 220,
          formatter: (row) => renderSessionInfo(row)
        },
        {
          prop: 'timeRange',
          label: '场次时间',
          minWidth: 280,
          formatter: (row) => formatFlashSessionRange(row)
        },
        {
          prop: 'runtime',
          label: '运行状态',
          width: 110,
          formatter: (row) => renderSessionRuntime(row)
        },
        {
          prop: 'sessionStatus',
          label: '启用状态',
          width: 132,
          formatter: (row) => renderSessionStatus(row)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 136,
          fixed: 'right',
          formatter: (row) => renderSessionOperation(row)
        }
      ]
    }
  })

  const {
    columns: productColumns,
    columnChecks: productColumnChecks,
    data: productData,
    loading: productLoading,
    pagination: productPagination,
    getData: getProductData,
    replaceSearchParams: replaceProductSearchParams,
    handleSizeChange: handleProductSizeChange,
    handleCurrentChange: handleProductCurrentChange,
    refreshData: refreshProductData,
    refreshUpdate: refreshProductUpdate,
    refreshRemove: refreshProductRemove
  } = useTable({
    core: {
      apiFn: fetchFlashProductPage,
      apiParams: {
        current: 1,
        size: 20
      },
      immediate: false,
      columnsFactory: (): ColumnOption<FlashProductItem>[] => [
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
          minWidth: 280,
          formatter: (row) => renderProductInfo(row)
        },
        {
          prop: 'sessionName',
          label: '所属场次',
          minWidth: 220,
          formatter: (row) => renderProductSession(row)
        },
        {
          prop: 'flashPrice',
          label: '秒杀价格',
          width: 130,
          formatter: (row) => renderProductPrice(row)
        },
        {
          prop: 'flashStock',
          label: '库存/限购',
          width: 128,
          formatter: (row) => renderProductStock(row)
        },
        {
          prop: 'routeType',
          label: '商品类型',
          width: 110,
          formatter: (row) => renderProductRouteType(row)
        },
        {
          prop: 'runtime',
          label: '运行状态',
          width: 110,
          formatter: (row) => renderProductRuntime(row)
        },
        {
          prop: 'sort',
          label: '排序',
          width: 92
        },
        {
          prop: 'operation',
          label: '操作',
          width: 104,
          fixed: 'right',
          formatter: (row) => renderProductOperation(row)
        }
      ]
    }
  })

  const tabItems = computed(() => [
    {
      value: 'sessions' as const,
      label: '场次管理',
      count: sessionPagination.total
    },
    {
      value: 'products' as const,
      label: '秒杀商品',
      count: productPagination.total
    }
  ])

  const activeLoading = computed(() =>
    activeTab.value === 'sessions' ? sessionLoading.value : productLoading.value
  )

  const activeSelectionCount = computed(() =>
    activeTab.value === 'sessions'
      ? selectedSessionIds.value.length
      : selectedProductIds.value.length
  )

  const activeColumnChecks = computed<ColumnOption[]>({
    get() {
      return activeTab.value === 'sessions' ? sessionColumnChecks.value : productColumnChecks.value
    },
    set(value) {
      if (activeTab.value === 'sessions') {
        sessionColumnChecks.value = value
        return
      }

      productColumnChecks.value = value
    }
  })

  const clearSessionSelection = () => {
    selectedSessionIds.value = []
    sessionTableRef.value?.elTableRef?.clearSelection?.()
  }

  const clearProductSelection = () => {
    selectedProductIds.value = []
    productTableRef.value?.elTableRef?.clearSelection?.()
  }

  const isSessionSwitching = (id: number) => switchingSessionIds.value.includes(id)

  const toggleSessionSwitching = (id: number, loadingValue: boolean) => {
    if (loadingValue) {
      if (!switchingSessionIds.value.includes(id)) {
        switchingSessionIds.value = [...switchingSessionIds.value, id]
      }
      return
    }

    switchingSessionIds.value = switchingSessionIds.value.filter((item) => item !== id)
  }

  function renderSessionInfo(row: FlashSessionItem) {
    return h('div', { class: 'flex flex-col gap-1' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'cursor-pointer text-left font-medium text-g-900',
          onClick: () => handleOpenSessionProducts(row)
        },
        row.name || `场次 #${row.id}`
      ),
      h('span', { class: 'text-xs text-g-500' }, `ID：${row.id}`)
    ])
  }

  function renderSessionRuntime(row: FlashSessionItem) {
    const text = getFlashSessionRuntimeText(row)

    return h(
      ElTag,
      {
        type: getFlashRuntimeTagType(text),
        effect: 'light',
        round: true
      },
      () => text
    )
  }

  function renderSessionStatus(row: FlashSessionItem) {
    const checked = Number(row.sessionStatus ?? 0) === 1

    return h('div', { class: 'flex items-center gap-2 text-[12px] text-g-700' }, [
      h(ElSwitch, {
        modelValue: checked,
        loading: isSessionSwitching(row.id),
        disabled: isSessionSwitching(row.id),
        inlinePrompt: false,
        beforeChange: () => handleToggleSessionStatus(row)
      }),
      h('span', checked ? '启用' : '禁用')
    ])
  }

  function renderSessionOperation(row: FlashSessionItem) {
    return h('div', { class: 'flex items-center' }, [
      h(ArtButtonTable, {
        type: 'view',
        iconClass: 'ease-table-action ease-table-action--view',
        onClick: () => handleOpenSessionProducts(row)
      }),
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => openSessionDialog(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDeleteSession(row)
      })
    ])
  }

  function renderProductInfo(row: FlashProductItem) {
    const previewSrc = row.spuPic || row.skuPic || ''

    return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
      previewSrc
        ? h(ElImage, {
            src: previewSrc,
            fit: 'cover',
            class: 'size-11 rounded-lg shrink-0',
            previewSrcList: [previewSrc],
            previewTeleported: true
          })
        : h(
            'div',
            {
              class:
                'flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--el-fill-color-light)] text-xs text-g-500'
            },
            '暂无图片'
          ),
      h('div', { class: 'min-w-0 flex-1 flex flex-col gap-1' }, [
        h(
          'button',
          {
            type: 'button',
            class: 'truncate text-left font-medium text-g-900',
            onClick: () =>
              router.push({
                name: 'ProductSpuDetail',
                params: { id: row.spuId }
              })
          },
          row.spuName || `SPU-${row.spuId}`
        ),
        h('span', { class: 'truncate text-xs text-g-500' }, formatFlashAttrValues(row.attrValues)),
        h('span', { class: 'text-xs text-g-500' }, `SKU：${row.skuId}`)
      ])
    ])
  }

  function renderProductSession(row: FlashProductItem) {
    return h('div', { class: 'flex flex-col gap-1' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'cursor-pointer text-left font-medium text-g-900',
          onClick: () =>
            handleProductSearch({
              sessionId: row.flashSessionId,
              keyword: undefined,
              brandId: undefined,
              categoryId: undefined,
              spuId: undefined,
              skuId: undefined,
              routeType: undefined
            })
        },
        row.sessionName || `场次 #${row.flashSessionId}`
      ),
      h(
        'span',
        { class: 'text-xs text-g-500' },
        `${formatDateTime(row.sessionStartTime)} - ${formatDateTime(row.sessionEndTime)}`
      )
    ])
  }

  function renderProductPrice(row: FlashProductItem) {
    return h('div', { class: 'flex flex-col gap-1 text-left' }, [
      h('span', { class: 'font-medium text-g-900' }, formatMoney(row.flashPrice)),
      h('span', { class: 'text-xs text-g-500 line-through' }, formatMoney(row.originalPrice))
    ])
  }

  function renderProductStock(row: FlashProductItem) {
    return h('div', { class: 'flex flex-col gap-1 text-xs text-g-600' }, [
      h('span', `秒杀库存：${row.flashStock}`),
      h('span', `单人限购：${row.flashLimit}`)
    ])
  }

  function renderProductRouteType(row: FlashProductItem) {
    return h(
      ElTag,
      {
        type: getFlashRouteTagType(row.routeType),
        effect: 'light',
        round: true
      },
      () => getFlashRouteTypeText(row.routeType)
    )
  }

  function renderProductRuntime(row: FlashProductItem) {
    const text = getFlashProductRuntimeText(row)

    return h(
      ElTag,
      {
        type: getFlashRuntimeTagType(text),
        effect: 'light',
        round: true
      },
      () => text
    )
  }

  function renderProductOperation(row: FlashProductItem) {
    return h('div', { class: 'flex items-center' }, [
      h(ArtButtonTable, {
        type: 'edit',
        iconClass: 'ease-table-action ease-table-action--edit',
        onClick: () => handleEditProduct(row)
      }),
      h(ArtButtonTable, {
        type: 'delete',
        iconClass: 'ease-table-action ease-table-action--delete',
        onClick: () => handleDeleteProduct(row)
      })
    ])
  }

  const handleSessionSelectionChange = (selection: FlashSessionItem[]) => {
    selectedSessionIds.value = selection.map((item) => item.id)
  }

  const handleProductSelectionChange = (selection: FlashProductItem[]) => {
    selectedProductIds.value = selection.map((item) => item.id)
  }

  const handleSessionSearch = async (params: FlashSessionSearchForm) => {
    sessionSearchForm.value = {
      name: params.name ?? undefined,
      sessionStatus: params.sessionStatus ?? undefined,
      timeRange: params.timeRange?.length ? [...params.timeRange] : []
    }

    clearSessionSelection()
    replaceSessionSearchParams(createSessionFilters(sessionSearchForm.value))
    await getSessionData()
  }

  const handleProductSearch = async (params: FlashProductSearchForm) => {
    productSearchForm.value = {
      sessionId: params.sessionId,
      keyword: params.keyword ?? undefined,
      brandId: params.brandId,
      categoryId: params.categoryId,
      spuId: params.spuId,
      skuId: params.skuId,
      routeType: params.routeType ?? undefined
    }

    clearProductSelection()
    replaceProductSearchParams(createProductFilters(productSearchForm.value))
    await getProductData()
  }

  const handleRefresh = async () => {
    if (activeTab.value === 'sessions') {
      clearSessionSelection()
      await refreshSessionData()
      return
    }

    clearProductSelection()
    await refreshProductData()
  }

  const handleToggleSessionStatus = async (row: FlashSessionItem) => {
    const nextStatus: FlashSessionStatus = Number(row.sessionStatus ?? 0) === 1 ? 0 : 1

    toggleSessionSwitching(row.id, true)

    try {
      await updateFlashSessionStatusBatch([row.id], nextStatus)
      await refreshSessionData()
      return true
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '更新场次状态失败')
      return false
    } finally {
      toggleSessionSwitching(row.id, false)
    }
  }

  const handleBatchSessionStatus = async (status: FlashSessionStatus) => {
    if (!selectedSessionIds.value.length || sessionBatchLoading.value) return

    sessionBatchLoading.value = true

    try {
      await updateFlashSessionStatusBatch(selectedSessionIds.value, status)
      clearSessionSelection()
      await refreshSessionData()
    } finally {
      sessionBatchLoading.value = false
    }
  }

  const openSessionDialog = (session?: FlashSessionItem | null) => {
    currentSession.value = session || null
    sessionDialogVisible.value = true
  }

  const handleSessionSubmit = async (payload: FlashSessionSavePayload) => {
    sessionSubmitting.value = true

    try {
      if (payload.id) {
        await updateFlashSession(payload)
        sessionDialogVisible.value = false
        await refreshSessionUpdate()
      } else {
        await createFlashSession(payload)
        sessionDialogVisible.value = false
        await refreshSessionCreate()
      }
    } finally {
      sessionSubmitting.value = false
    }
  }

  const handleDeleteSession = async (row: FlashSessionItem) => {
    await ElMessageBox.confirm(`确认删除场次“${row.name}”吗？`, '删除场次', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await deleteFlashSession(row.id)

    if (productSearchForm.value.sessionId === row.id) {
      productSearchForm.value = {
        ...productSearchForm.value,
        sessionId: undefined
      }
      replaceProductSearchParams(createProductFilters(productSearchForm.value))
      clearProductSelection()
      await refreshProductData()
    }

    clearSessionSelection()
    await refreshSessionRemove()
  }

  const handleOpenSessionProducts = async (row: FlashSessionItem) => {
    activeTab.value = 'products'
    await handleProductSearch({
      sessionId: row.id,
      keyword: undefined,
      brandId: undefined,
      categoryId: undefined,
      spuId: undefined,
      skuId: undefined,
      routeType: undefined
    })
  }

  const openProductSelector = () => {
    if (!productSearchForm.value.sessionId) {
      ElMessage.warning('请先按场次筛选，再添加秒杀商品')
      return
    }

    selectorVisible.value = true
  }

  const handleProductSelectorConfirm = (selection: SelectedFlashSku[]) => {
    editingProduct.value = null
    configSelection.value = selection
    configVisible.value = true
  }

  const handleEditProduct = (row: FlashProductItem) => {
    editingProduct.value = row
    configSelection.value = []
    configVisible.value = true
  }

  const buildFlashSavePayload = (
    sessionId: number,
    row: FlashSkuConfig,
    id?: number
  ): FlashProductSavePayload => ({
    id,
    flashSessionId: sessionId,
    spuId: row.spuId,
    skuId: row.skuId,
    flashPrice: row.flashPrice,
    flashStock: row.flashStock,
    flashLimit: row.flashLimit,
    routeType: row.routeType,
    sort: row.sort
  })

  const handleConfigConfirm = async (rows: FlashSkuConfig[]) => {
    const sessionId = editingProduct.value?.flashSessionId || productSearchForm.value.sessionId
    if (!sessionId) {
      ElMessage.warning('缺少秒杀场次，无法保存配置')
      return
    }

    configSubmitting.value = true

    try {
      if (editingProduct.value) {
        await updateFlashProduct(buildFlashSavePayload(sessionId, rows[0], editingProduct.value.id))
        configVisible.value = false
        await refreshProductUpdate()
      } else {
        await createFlashProductBatch(rows.map((item) => buildFlashSavePayload(sessionId, item)))
        configVisible.value = false
        await refreshProductData()
      }
    } finally {
      configSubmitting.value = false
    }
  }

  const handleDeleteProduct = async (row: FlashProductItem) => {
    await ElMessageBox.confirm('确认删除该秒杀商品吗？', '删除商品', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await deleteFlashProduct(row.id)
    clearProductSelection()
    await refreshProductRemove()
  }

  const handleBatchDeleteProducts = async () => {
    if (!selectedProductIds.value.length || productBatchDeleting.value) return

    await ElMessageBox.confirm(
      `确认删除已选中的 ${selectedProductIds.value.length} 个商品吗？`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    productBatchDeleting.value = true

    try {
      await deleteFlashProductBatch(selectedProductIds.value)
      clearProductSelection()
      await refreshProductRemove()
    } finally {
      productBatchDeleting.value = false
    }
  }

  watch(activeTab, () => {
    clearSessionSelection()
    clearProductSelection()
  })

  watch(configVisible, (visible) => {
    if (!visible) {
      configSelection.value = []
      editingProduct.value = null
      configSubmitting.value = false
    }
  })

  watch(sessionDialogVisible, (visible) => {
    if (!visible) {
      currentSession.value = null
    }
  })

  onMounted(async () => {
    replaceSessionSearchParams(createSessionFilters())
    replaceProductSearchParams(createProductFilters())

    await Promise.all([getSessionData(), getProductData()])
  })

  onActivated(() => {
    void handleRefresh()
  })
</script>
