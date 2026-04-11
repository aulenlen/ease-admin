import request from '@/utils/http'

const STOCK_BASE_PATH = '/api/v1/admin/stocks'
const SKU_BASE_PATH = '/api/v1/admin/skus'

export type InventoryTab = 'all' | 'warning' | 'empty' | 'presale'
export type StockStatus = 0 | 1 | 2

export interface OptionItem {
  value: string
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

export interface InventorySpuRow {
  spuId: number
  spuName: string
  pic?: string
  brandName: string
  categoryName: string
  skuCount: number
  totalAvailableStock: number
  totalLockStock: number
  totalSale: number
  warningSkuCount: number
  emptySkuCount: number
  presaleSkuCount: number
}

export interface InventorySummary {
  spuCount: number
  skuCount: number
  warningSpuCount: number
  emptySpuCount: number
  presaleSpuCount: number
}

export interface InventoryStats {
  summary: InventorySummary
  tabTotals: Record<InventoryTab, number>
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
  skuCode: string
  pic?: string
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

interface PageRespVO<T> {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: T[]
}

interface InventorySpuRespVO {
  spuId: number
  spuName: string
  pic?: string
  brandName?: string
  categoryName?: string
  skuCount?: number
  totalAvailableStock?: number
  totalLockStock?: number
  totalSale?: number
  warningSkuCount?: number
  emptySkuCount?: number
  presaleSkuCount?: number
}

interface InventorySkuRespVO {
  id?: number
  skuId: number
  spuId: number
  skuCode?: string
  pic?: string
  stock?: number
  lockStock?: number
  sale?: number
  lowStock?: number
  stockStatus?: StockStatus
  attrValues?: string
  attrValuesObj?: SpecItem[]
}

interface InventoryStatsRespVO {
  summary?: Partial<InventorySummary>
  tabTotals?: Partial<Record<InventoryTab, number>>
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
      attrName: String(item.attrName || '').trim(),
      attrValue: String(item.attrValue || '').trim()
    }))
  }

  const rawText = String(specs || '').trim()
  if (!rawText) return []

  try {
    const parsed = JSON.parse(rawText)
    return Array.isArray(parsed) ? normalizeSpecs(parsed as SpecItem[]) : []
  } catch {
    return []
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

function toInventorySpuRow(item: InventorySpuRespVO): InventorySpuRow {
  return {
    spuId: item.spuId,
    spuName: String(item.spuName || ''),
    pic: item.pic,
    brandName: String(item.brandName || '-'),
    categoryName: String(item.categoryName || '-'),
    skuCount: Number(item.skuCount || 0),
    totalAvailableStock: Number(item.totalAvailableStock || 0),
    totalLockStock: Number(item.totalLockStock || 0),
    totalSale: Number(item.totalSale || 0),
    warningSkuCount: Number(item.warningSkuCount || 0),
    emptySkuCount: Number(item.emptySkuCount || 0),
    presaleSkuCount: Number(item.presaleSkuCount || 0)
  }
}

function toInventorySkuRow(item: InventorySkuRespVO): InventorySkuRow {
  return {
    id: item.id,
    skuId: item.skuId,
    spuId: item.spuId,
    skuCode: String(item.skuCode || item.skuId),
    pic: item.pic,
    stock: Number(item.stock || 0),
    lockStock: Number(item.lockStock || 0),
    sale: Number(item.sale || 0),
    lowStock: Number(item.lowStock || 0),
    stockStatus: Number(item.stockStatus ?? 0) as StockStatus,
    specs: normalizeSpecs(item.attrValuesObj || item.attrValues)
  }
}

function toInventoryStats(data?: InventoryStatsRespVO): InventoryStats {
  return {
    summary: {
      spuCount: Number(data?.summary?.spuCount || 0),
      skuCount: Number(data?.summary?.skuCount || 0),
      warningSpuCount: Number(data?.summary?.warningSpuCount || 0),
      emptySpuCount: Number(data?.summary?.emptySpuCount || 0),
      presaleSpuCount: Number(data?.summary?.presaleSpuCount || 0)
    },
    tabTotals: {
      all: Number(data?.tabTotals?.all || 0),
      warning: Number(data?.tabTotals?.warning || 0),
      empty: Number(data?.tabTotals?.empty || 0),
      presale: Number(data?.tabTotals?.presale || 0)
    }
  }
}

export function fetchStockPage(params: StockPageQuery) {
  return request
    .get<PageRespVO<InventorySpuRespVO>>({
      url: STOCK_BASE_PATH,
      params: buildStockQuery(params)
    })
    .then((response) => ({
      records: (response.list || []).map(toInventorySpuRow),
      current: Number(response.pageNum || 1),
      size: Number(response.pageSize || 10),
      total: Number(response.total || 0),
      totalPage: Number(response.totalPage || 0)
    }))
}

export function fetchStockStats(params: Partial<StockPageQuery>) {
  return request
    .get<InventoryStatsRespVO>({
      url: `${STOCK_BASE_PATH}/stats`,
      params: buildStockQuery({
        current: Number(params.current || 1),
        size: Number(params.size || 10),
        ...params
      })
    })
    .then(toInventoryStats)
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

export function fetchStockBySpuId(spuId: number) {
  return request
    .get<InventorySkuRespVO[]>({
      url: `${STOCK_BASE_PATH}/by-spu/${spuId}`
    })
    .then((list) => (list || []).map(toInventorySkuRow))
}

export function updateStock(payload: UpdateStockPayload) {
  return request.put<number>({
    url: STOCK_BASE_PATH,
    data: payload,
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
    .then((response) => response.list || [])
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

export function deleteSku(id: number) {
  return request.del<number>({
    url: `${SKU_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}
