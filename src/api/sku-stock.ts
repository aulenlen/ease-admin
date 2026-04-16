import request from '@/utils/http'

const STOCK_BASE_PATH = '/api/v1/admin/stocks'
const SKU_BASE_PATH = '/api/v1/admin/skus'

export type InventoryTab = 'all' | 'warning' | 'empty' | 'presale'
export type StockStatus = 0 | 1 | 2

export interface OptionItem {
  value: string | number
  label: string
}

export interface SpecItem {
  attrId?: number
  attrName?: string
  attrValue?: string
}

export interface StockPageQuery {
  current: number
  size: number
  keyword?: string
  brandId?: number
  categoryId?: number
  stockStatus?: StockStatus
  lowStockWarning?: boolean
  tab?: InventoryTab
}

export interface InventoryFilterOptions {
  brands: OptionItem[]
  categories: OptionItem[]
  stockStatuses: OptionItem[]
  tabs: OptionItem[]
}

export interface InventorySkuRow {
  id?: number
  skuId: number
  spuId: number
  spuName: string
  skuCode: string
  pic?: string
  brandId?: number
  brandName?: string
  categoryId?: number
  categoryName?: string
  stock: number
  lockStock: number
  sale: number
  lowStock: number
  stockStatus: StockStatus
  specs: SpecItem[]
}

export interface StockLogItem {
  id: number
  skuId: number
  spuId: number
  spuName?: string
  skuCode: string
  changeType: string
  beforeStock: number
  afterStock: number
  beforeLockStock: number
  afterLockStock: number
  changeQuantity: number
  sourceType?: string
  sourceNo?: string
  remark?: string
  createTime: string
}

export interface SkuCandidate {
  id: number
  spuId: number
  skuCode?: string
  attrValues?: string
  attrValuesObj?: SpecItem[]
  enableStatus?: 0 | 1
}

export interface CreateStockPayload {
  skuId: number
  spuId: number
  stock: number
  lowStock?: number
  stockStatus?: StockStatus
}

export interface UpdateStockPayload extends CreateStockPayload {
  id: number
}

export interface UpdateStockStatusBatchPayload {
  skuIds: number[]
  stockStatus: StockStatus
}

interface PageRespVO<T> {
  pageNum?: number
  pageSize?: number
  totalPage?: number
  total?: number
  list?: T[]
  records?: T[]
}

interface InventorySkuRespVO {
  id?: number
  stockId?: number
  skuId?: number
  spuId?: number
  skuCode?: string
  code?: string
  spuName?: string
  productName?: string
  name?: string
  pic?: string
  skuPic?: string
  spuPic?: string
  brandId?: number
  brandName?: string
  categoryId?: number
  categoryName?: string
  stock?: number
  availableStock?: number
  lockStock?: number
  lockedStock?: number
  sale?: number
  saleStock?: number
  lowStock?: number
  warningStock?: number
  warningValue?: number
  stockStatus?: StockStatus
  attrValues?: string
  attrValuesObj?: SpecItem[]
  specs?: SpecItem[]
  spData?: string
}

interface InventoryFilterOptionsRespVO {
  brands?: OptionItem[]
  categories?: OptionItem[]
  stockStatuses?: OptionItem[]
  tabs?: OptionItem[]
}

interface SkuRespVO {
  id: number
  spuId: number
  skuCode?: string
  attrValues?: string
  attrValuesObj?: SpecItem[]
  enableStatus?: 0 | 1
}

function normalizeSpecs(specs?: string | SpecItem[]): SpecItem[] {
  if (Array.isArray(specs)) {
    return specs.map((item) => ({
      attrId: item.attrId,
      attrName: String(item.attrName || '').trim() || undefined,
      attrValue: String(item.attrValue || '').trim() || undefined
    }))
  }

  const rawText = String(specs || '').trim()
  if (!rawText) return []

  try {
    const parsed = JSON.parse(rawText)
    return Array.isArray(parsed) ? normalizeSpecs(parsed as SpecItem[]) : []
  } catch {
    return [{ attrValue: rawText }]
  }
}

function buildStockQuery(params: StockPageQuery) {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    keyword: String(params.keyword || '').trim() || undefined,
    brandId: params.brandId,
    categoryId: params.categoryId,
    stockStatus: params.stockStatus,
    lowStockWarning: params.lowStockWarning || undefined,
    tab: params.tab || undefined
  }
}

function toInventorySkuRow(item: InventorySkuRespVO): InventorySkuRow {
  const stock = Number(item.stock ?? item.availableStock ?? 0)
  const lowStock = Number(item.lowStock ?? item.warningStock ?? item.warningValue ?? 0)

  return {
    id: item.id ?? item.stockId,
    skuId: Number(item.skuId ?? item.id ?? 0),
    spuId: Number(item.spuId ?? 0),
    spuName: String(item.spuName || item.productName || item.name || '-'),
    skuCode: String(item.skuCode || item.code || item.skuId || item.id || '-'),
    pic: item.pic || item.skuPic || item.spuPic,
    brandId: item.brandId,
    brandName: item.brandName,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    stock,
    lockStock: Number(item.lockStock ?? item.lockedStock ?? 0),
    sale: Number(item.sale ?? item.saleStock ?? 0),
    lowStock,
    stockStatus: Number(item.stockStatus ?? (stock > 0 ? 1 : 0)) as StockStatus,
    specs: normalizeSpecs(item.attrValuesObj || item.specs || item.attrValues || item.spData)
  }
}

export function fetchStockPage(params: StockPageQuery) {
  return request
    .get<PageRespVO<InventorySkuRespVO>>({
      url: STOCK_BASE_PATH,
      params: buildStockQuery(params)
    })
    .then((response) => {
      const list = response.list || response.records || []

      return {
        records: list.map(toInventorySkuRow),
        current: Number(response.pageNum || params.current || 1),
        size: Number(response.pageSize || params.size || 10),
        total: Number(response.total || 0),
        totalPage: Number(response.totalPage || 0)
      }
    })
}

export function fetchStockFilterOptions() {
  return request
    .get<InventoryFilterOptionsRespVO>({
      url: `${STOCK_BASE_PATH}/filter-options`
    })
    .then((response) => ({
      brands: response.brands || [],
      categories: response.categories || [],
      stockStatuses: response.stockStatuses || [],
      tabs: response.tabs || []
    }))
}

export function updateStock(payload: UpdateStockPayload) {
  return request.put<number>({
    url: STOCK_BASE_PATH,
    data: payload,
    showSuccessMessage: true
  })
}

export function updateStockBatch(payload: UpdateStockPayload[]) {
  return request.put<number>({
    url: `${STOCK_BASE_PATH}/batch`,
    data: payload,
    showSuccessMessage: true
  })
}

export function updateStockStatusBatch(payload: UpdateStockStatusBatchPayload) {
  return request.put<number>({
    url: `${STOCK_BASE_PATH}/status`,
    params: {
      skuIds: payload.skuIds,
      stockStatus: payload.stockStatus
    },
    showSuccessMessage: true
  })
}

export function createStock(payload: CreateStockPayload) {
  return request.post<number>({
    url: STOCK_BASE_PATH,
    data: payload,
    showSuccessMessage: true
  })
}

export function fetchStockLogs(skuId: number) {
  return request
    .get<PageRespVO<StockLogItem>>({
      url: `${STOCK_BASE_PATH}/logs`,
      params: {
        pageNum: 1,
        pageSize: 20,
        skuId
      }
    })
    .then((response) => response.list || response.records || [])
}

export function fetchSkuBySpuId(spuId: number) {
  return request
    .get<SkuRespVO[]>({
      url: `${SKU_BASE_PATH}/spus/${spuId}`
    })
    .then((list) =>
      (list || []).map((item) => ({
        id: item.id,
        spuId: item.spuId,
        skuCode: item.skuCode,
        attrValues: item.attrValues,
        attrValuesObj: normalizeSpecs(item.attrValuesObj),
        enableStatus: Number(item.enableStatus ?? 1) as 0 | 1
      }))
    )
}
