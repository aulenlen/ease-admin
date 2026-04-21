<template>
  <div class="flash-editor art-full-height flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <ArtIconButton icon="ri:arrow-left-line" @click="handleCancel" />
        <div class="min-w-0">
          <div class="truncate text-base font-semibold text-[var(--el-text-color-primary)]">
            {{ sessionTitle }}
          </div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            {{ sessionRangeText }}
          </div>
        </div>
      </div>

      <ElButton type="primary" @click="openProductSelector" v-ripple>添加商品</ElButton>
    </div>

    <EaseTablePage
      v-model:columns="columnChecks"
      v-model:showSearchBar="showSearchBar"
      :loading="loading"
      :selection-count="selectedProductIds.length"
      @refresh="refreshData"
    >
      <template #search>
        <EaseTableSearch columns="280px">
          <ElInput
            v-model.trim="searchForm.keyword"
            placeholder="搜索商品关键词"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </EaseTableSearch>
      </template>

      <template #selectionText="{ count }">已选{{ count }}个商品</template>

      <template #selectionActions>
        <ElButton :disabled="batchDeleting" @click="handleBatchDeleteProducts" v-ripple>
          批量删除
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
          row-key="id"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </template>
    </EaseTablePage>

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
  import { ElImage, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import {
    createFlashProductBatch,
    deleteFlashProduct,
    deleteFlashProductBatch,
    fetchFlashProductPage,
    updateFlashProduct,
    type FlashProductItem,
    type FlashProductQueryParams,
    type FlashProductSavePayload
  } from '@/api/flash'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { formatDateTime } from '@/utils/date'
  import FlashConfigDialog from './modules/flash-config-dialog.vue'
  import FlashProductSelector from './modules/flash-product-selector.vue'
  import {
    formatFlashAttrValues,
    getFlashProductRuntimeText,
    getFlashRouteTagType,
    getFlashRouteTypeText,
    getFlashRuntimeTagType,
    type FlashSkuConfig,
    type SelectedFlashSku
  } from './modules/flash-utils'

  defineOptions({ name: 'MarketingFlashEditorPage' })

  interface FlashProductSearchForm {
    keyword?: string
  }

  interface FlashSessionRouteInfo {
    name?: string
    startTime?: string
    endTime?: string
    sessionStatus?: number
  }

  const route = useRoute()
  const router = useRouter()
  const tableRef = ref<{
    elTableRef?: { clearSelection: () => void }
  }>()

  const showSearchBar = ref(true)
  const selectedProductIds = ref<number[]>([])
  const batchDeleting = ref(false)

  const selectorVisible = ref(false)
  const configVisible = ref(false)
  const configSelection = ref<SelectedFlashSku[]>([])
  const editingProduct = ref<FlashProductItem | null>(null)
  const configSubmitting = ref(false)

  const searchForm = ref<FlashProductSearchForm>({
    keyword: undefined
  })

  const sessionId = computed(() => Number(route.params.id || 0))

  const sessionInfo = computed<FlashSessionRouteInfo>(() => ({
    name: String(route.query.name || '').trim() || undefined,
    startTime: String(route.query.startTime || '').trim() || undefined,
    endTime: String(route.query.endTime || '').trim() || undefined,
    sessionStatus:
      route.query.sessionStatus !== undefined ? Number(route.query.sessionStatus || 0) : undefined
  }))

  const sessionTitle = computed(
    () => sessionInfo.value.name || (sessionId.value ? `场次 #${sessionId.value}` : '秒杀配置')
  )

  const sessionRangeText = computed(() => {
    if (sessionInfo.value.startTime || sessionInfo.value.endTime) {
      return `${formatDateTime(sessionInfo.value.startTime)} - ${formatDateTime(sessionInfo.value.endTime)}`
    }
    return sessionId.value ? `场次 ID：${sessionId.value}` : '缺少场次信息'
  })

  const formatMoney = (value: number) => `¥${Number(value || 0).toFixed(2)}`

  const createFilters = (form: FlashProductSearchForm = searchForm.value) => {
    return {
      sessionId: sessionId.value || undefined,
      keyword: String(form.keyword || '').trim() || undefined
    } satisfies Partial<FlashProductQueryParams>
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
    refreshData,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchFlashProductPage,
      apiParams: {
        current: 1,
        size: 20,
        sessionId: sessionId.value || undefined
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
        h('div', { class: 'truncate font-medium text-g-900' }, row.spuName || `SPU-${row.spuId}`),
        h('span', { class: 'truncate text-xs text-g-500' }, formatFlashAttrValues(row.attrValues)),
        h('span', { class: 'text-xs text-g-500' }, `SKU：${row.skuId}`)
      ])
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

  function shouldIgnoreRowClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null

    return !!target?.closest(
      '.el-checkbox, .el-button, .ease-table-action, .art-button-table, .el-image, .el-image__inner'
    )
  }

  function getRowClassName() {
    return 'flash-editor__table-row'
  }

  function clearSelection() {
    selectedProductIds.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
  }

  function handleCancel() {
    router.push({ name: 'MarketingFlash' })
  }

  function handleSelectionChange(selection: FlashProductItem[]) {
    selectedProductIds.value = selection.map((item) => item.id)
  }

  async function handleSearch() {
    clearSelection()
    replaceSearchParams(createFilters(searchForm.value))
    await getData()
  }

  function handleRowClick(row: FlashProductItem, _column: unknown, event: MouseEvent) {
    if (shouldIgnoreRowClick(event)) return

    router.push({
      name: 'ProductSpuDetail',
      params: { id: row.spuId }
    })
  }

  function openProductSelector() {
    if (!sessionId.value) {
      ElMessage.warning('缺少场次信息，无法添加商品')
      return
    }

    selectorVisible.value = true
  }

  function handleProductSelectorConfirm(selection: SelectedFlashSku[]) {
    editingProduct.value = null
    configSelection.value = selection
    configVisible.value = true
  }

  function handleEditProduct(row: FlashProductItem) {
    editingProduct.value = row
    configSelection.value = []
    configVisible.value = true
  }

  function buildFlashSavePayload(row: FlashSkuConfig, id?: number): FlashProductSavePayload {
    return {
      id,
      flashSessionId: sessionId.value,
      spuId: row.spuId,
      skuId: row.skuId,
      flashPrice: row.flashPrice,
      flashStock: row.flashStock,
      flashLimit: row.flashLimit,
      routeType: row.routeType,
      sort: row.sort
    }
  }

  async function handleConfigConfirm(rows: FlashSkuConfig[]) {
    if (!sessionId.value) {
      ElMessage.warning('缺少秒杀场次，无法保存配置')
      return
    }

    configSubmitting.value = true

    try {
      if (editingProduct.value) {
        await updateFlashProduct(buildFlashSavePayload(rows[0], editingProduct.value.id))
        configVisible.value = false
        await refreshUpdate()
      } else {
        await createFlashProductBatch(rows.map((item) => buildFlashSavePayload(item)))
        configVisible.value = false
        await refreshData()
      }
    } finally {
      configSubmitting.value = false
    }
  }

  async function handleDeleteProduct(row: FlashProductItem) {
    await ElMessageBox.confirm('确认删除该秒杀商品吗？', '删除商品', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await deleteFlashProduct(row.id)
    clearSelection()
    await refreshRemove()
  }

  async function handleBatchDeleteProducts() {
    if (!selectedProductIds.value.length || batchDeleting.value) return

    await ElMessageBox.confirm(
      `确认删除已选中的 ${selectedProductIds.value.length} 个商品吗？`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    batchDeleting.value = true

    try {
      await deleteFlashProductBatch(selectedProductIds.value)
      clearSelection()
      await refreshRemove()
    } finally {
      batchDeleting.value = false
    }
  }

  watch(configVisible, (visible) => {
    if (!visible) {
      configSelection.value = []
      editingProduct.value = null
      configSubmitting.value = false
    }
  })

  watch(
    () => sessionId.value,
    async (value) => {
      if (!value) {
        router.replace({ name: 'MarketingFlash' })
        return
      }

      replaceSearchParams(createFilters(searchForm.value))
      clearSelection()
      await getData()
    },
    { immediate: true }
  )

  onActivated(() => {
    void refreshData()
  })
</script>

<style scoped lang="scss">
  .flash-editor {
    min-height: 0;
  }

  :deep(.flash-editor > .ease-table-page) {
    flex: 1;
    height: auto;
    min-height: 0;
  }

  :deep(.flash-editor__table-row) {
    cursor: pointer;
  }
</style>
