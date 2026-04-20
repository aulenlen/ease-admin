<template>
  <ElDialog
    v-model="visible"
    title="选择秒杀商品"
    :width="dialogWidth"
    top="6vh"
    modal-class="flash-product-selector-modal"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="max-h-[72vh] overflow-y-auto pr-1">
      <EaseTableSearch columns="220px 280px">
        <ElCascader
          v-model="queryForm.categoryId"
          :options="categoryOptions"
          :props="categoryCascaderProps"
          clearable
          placeholder="选择商品分类"
        />

        <ElInput v-model="queryForm.keyword" placeholder="搜索商品名称" @keyup.enter="handleSearch">
          <template #suffix>
            <span class="ease-table-search__keyword-suffix">
              <ElIcon
                v-if="queryForm.keyword"
                class="ease-table-search__keyword-icon"
                @mousedown.prevent
                @click="clearKeyword"
              >
                <CircleCloseFilled />
              </ElIcon>
              <ElIcon
                class="ease-table-search__keyword-icon"
                @mousedown.prevent
                @click="handleSearch"
              >
                <Search />
              </ElIcon>
            </span>
          </template>
        </ElInput>
      </EaseTableSearch>

      <div class="mt-4">
        <ArtTable
          :loading="loading"
          :data="flatRows"
          :columns="tableColumns"
          :span-method="spanMethod"
          :row-class-name="rowClassName"
          :show-table-header="false"
          row-key="_key"
          @row-click="handleRowClick"
        >
          <template #check-header>
            <ElCheckbox
              :model-value="isAllSelected"
              :indeterminate="isPartiallySelected"
              @change="(checked) => toggleAllSelection(Boolean(checked))"
            />
          </template>

          <template #check="{ row }">
            <div :class="row._type === 'sku' ? 'selector-sku-indent' : ''">
              <ElCheckbox
                v-if="row._type === 'spu'"
                :model-value="isSpuFullySelected(row.spu.id)"
                :indeterminate="isSpuPartiallySelected(row.spu.id)"
                @click.stop
                @change="(checked) => toggleSpuSelection(row.spu, Boolean(checked))"
              />
              <ElCheckbox
                v-else
                :model-value="selectedSkuMap.has(row.sku.id)"
                @click.stop
                @change="() => toggleSkuSelection(row.spu, row.sku)"
              />
            </div>
          </template>

          <template #product="{ row }">
            <div v-if="row._type === 'spu'" class="flex items-center gap-3">
              <ElImage
                v-if="row.spu.pic"
                :src="row.spu.pic"
                fit="cover"
                class="size-11 rounded-lg shrink-0"
                :preview-src-list="[row.spu.pic]"
                preview-teleported
              />
              <div
                v-else
                class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--el-fill-color-light)] text-xs text-g-500"
              >
                暂无图片
              </div>
              <span class="truncate font-medium text-g-900">{{ row.spu.name }}</span>
            </div>
            <span v-else class="pl-10 text-g-700">
              {{ formatSkuSpecs(row.sku.attrValuesObj) }}
            </span>
          </template>
        </ArtTable>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-g-600">
          已选择 <span class="font-medium text-g-900">{{ selectedSkus.length }}</span> 个 SKU
        </div>

        <ElPagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="pagination.current"
          :page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :disabled="!selectedSkus.length" @click="handleConfirm">
        确认选择
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import { CircleCloseFilled, Search } from '@element-plus/icons-vue'
  import { ElMessage, type CascaderProps } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import {
    fetchSpuWithSkusPage,
    type AttrValueItem,
    type SpuSelectorSkuItem,
    type SpuWithSkusItem
  } from '@/api/spu'
  import EaseTableSearch from '@/components/project/ease-table-search/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { formatFlashAttrValueList, type SelectedFlashSku } from './flash-utils'

  interface Props {
    modelValue: boolean
  }

  interface FlatRow {
    _type: 'spu' | 'sku'
    _key: string
    spu: SpuWithSkusItem
    sku?: SpuSelectorSkuItem
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', value: SelectedFlashSku[]): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
  })

  const { width } = useWindowSize()

  const dialogWidth = computed(() => {
    if (width.value < 768) return 'calc(100vw - 24px)'
    if (width.value < 1280) return 'calc(100vw - 48px)'
    return '1080px'
  })

  const categoryCascaderProps: CascaderProps = {
    value: 'id',
    label: 'name',
    children: 'children',
    emitPath: false,
    checkStrictly: true
  }

  const categoryOptions = ref<CategoryTreeItem[]>([])
  const loading = ref(false)
  const spuList = ref<SpuWithSkusItem[]>([])
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })
  const queryForm = reactive<{
    categoryId?: number
    keyword?: string
  }>({
    categoryId: undefined,
    keyword: undefined
  })

  const selectedSkuMap = reactive(new Map<number, SelectedFlashSku>())
  const selectedSkus = computed(() => Array.from(selectedSkuMap.values()))

  const tableColumns = computed<ColumnOption<FlatRow>[]>(() => [
    {
      prop: 'check',
      width: 72,
      className: 'selector-check-col',
      useHeaderSlot: true,
      useSlot: true
    },
    {
      prop: 'product',
      label: '商品/款式',
      minWidth: 280,
      useSlot: true
    },
    {
      prop: 'stock',
      label: '库存',
      minWidth: 120,
      align: 'center',
      formatter: (row) => row.sku?.stock ?? ''
    },
    {
      prop: 'price',
      label: '价格',
      minWidth: 140,
      align: 'center',
      formatter: (row) => (row.sku ? formatMoney(row.sku.price) : '')
    }
  ])

  // 将 SPU + SKU 拍平为单层数组供 ElTable 渲染
  const flatRows = computed<FlatRow[]>(() =>
    spuList.value.flatMap((spu) => [
      { _type: 'spu' as const, _key: `spu-${spu.id}`, spu },
      ...spu.skuList.map((sku) => ({
        _type: 'sku' as const,
        _key: `sku-${sku.id}`,
        spu,
        sku
      }))
    ])
  )

  const allSkuIds = computed(() => spuList.value.flatMap((spu) => spu.skuList.map((sku) => sku.id)))

  const isAllSelected = computed(() => {
    const ids = allSkuIds.value
    return ids.length > 0 && ids.every((id) => selectedSkuMap.has(id))
  })

  const isPartiallySelected = computed(() => {
    const ids = allSkuIds.value
    if (!ids.length) return false
    const count = ids.filter((id) => selectedSkuMap.has(id)).length
    return count > 0 && count < ids.length
  })

  const formatMoney = (value: number) => `¥${Number(value || 0).toFixed(2)}`

  const formatSkuSpecs = (list: AttrValueItem[]) => formatFlashAttrValueList(list)

  const isSpuFullySelected = (spuId: number) => {
    const spu = spuList.value.find((item) => item.id === spuId)
    if (!spu?.skuList.length) return false
    return spu.skuList.every((sku) => selectedSkuMap.has(sku.id))
  }

  const isSpuPartiallySelected = (spuId: number) => {
    const spu = spuList.value.find((item) => item.id === spuId)
    if (!spu?.skuList.length) return false
    const count = spu.skuList.filter((sku) => selectedSkuMap.has(sku.id)).length
    return count > 0 && count < spu.skuList.length
  }

  const toSelectedSku = (spu: SpuWithSkusItem, sku: SpuSelectorSkuItem): SelectedFlashSku => ({
    skuId: sku.id,
    spuId: spu.id,
    spuName: spu.name,
    spuPic: sku.pic || spu.pic,
    categoryName: spu.categoryName,
    skuCode: sku.skuCode,
    attrValues: JSON.stringify(sku.attrValuesObj),
    attrValuesObj: sku.attrValuesObj,
    pic: sku.pic || spu.pic,
    price: sku.price,
    stock: sku.stock,
    enableStatus: sku.enableStatus
  })

  const toggleSpuSelection = (spu: SpuWithSkusItem, checked: boolean) => {
    spu.skuList.forEach((sku) => {
      if (checked) {
        selectedSkuMap.set(sku.id, toSelectedSku(spu, sku))
      } else {
        selectedSkuMap.delete(sku.id)
      }
    })
  }

  const toggleSkuSelection = (spu: SpuWithSkusItem, sku: SpuSelectorSkuItem) => {
    if (selectedSkuMap.has(sku.id)) {
      selectedSkuMap.delete(sku.id)
    } else {
      selectedSkuMap.set(sku.id, toSelectedSku(spu, sku))
    }
  }

  const toggleAllSelection = (checked: boolean) => {
    spuList.value.forEach((spu) => toggleSpuSelection(spu, checked))
  }

  // SPU 行：「商品/款式」列横跨库存 + 价格列
  const spanMethod = ({ row, columnIndex }: { row: any; columnIndex: number }) => {
    if (row._type === 'spu') {
      if (columnIndex === 1) return { rowspan: 1, colspan: 3 }
      if (columnIndex >= 2) return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: 1, colspan: 1 }
  }

  const rowClassName = ({ row }: { row: any }) => {
    return row._type === 'spu' ? 'selector-spu-row' : ''
  }

  const handleRowClick = (row: any, _column: unknown, event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('.el-checkbox, .el-image-viewer__wrapper, .el-image__preview')) return

    if (row._type === 'spu') {
      toggleSpuSelection(row.spu, !isSpuFullySelected(row.spu.id))
    } else if (row.sku) {
      toggleSkuSelection(row.spu, row.sku)
    }
  }

  const clearKeyword = () => {
    queryForm.keyword = undefined
    void handleSearch()
  }

  const clearLocalState = () => {
    queryForm.categoryId = undefined
    queryForm.keyword = undefined
    pagination.current = 1
    pagination.size = 10
    pagination.total = 0
    spuList.value = []
    selectedSkuMap.clear()
  }

  const handleSearch = async () => {
    loading.value = true

    try {
      const response = await fetchSpuWithSkusPage({
        current: pagination.current,
        size: pagination.size,
        keyword: String(queryForm.keyword || '').trim() || undefined,
        categoryId: queryForm.categoryId,
        publishStatus: 1
      })

      spuList.value = response.records || []
      pagination.total = Number(response.total || 0)
      pagination.current = Number(response.current || pagination.current)
      pagination.size = Number(response.size || pagination.size)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '加载商品列表失败')
    } finally {
      loading.value = false
    }
  }

  const handleCurrentChange = async (current: number) => {
    pagination.current = current
    await handleSearch()
  }

  const handleSizeChange = async (size: number) => {
    pagination.size = size
    pagination.current = 1
    await handleSearch()
  }

  const handleConfirm = () => {
    emit('confirm', selectedSkus.value)
    visible.value = false
  }

  const loadCategoryOptions = async () => {
    if (categoryOptions.value.length) return

    try {
      categoryOptions.value = await fetchCategoryTree()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '加载分类失败')
    }
  }

  watch(
    () => props.modelValue,
    async (visible) => {
      if (!visible) return

      clearLocalState()
      await loadCategoryOptions()
      await handleSearch()
    }
  )
</script>

<style scoped lang="scss">
  :deep(.flash-product-selector-modal .el-overlay-dialog) {
    overflow: hidden;
  }

  :deep(.selector-check-col) {
    padding-left: 16px;
    text-align: left;
  }

  .selector-sku-indent {
    padding-left: 20px;
  }

  :deep(.selector-spu-row) {
    background-color: var(--el-fill-color-lighter);

    &:hover > td.el-table__cell {
      background-color: var(--el-fill-color-light);
    }
  }
</style>
