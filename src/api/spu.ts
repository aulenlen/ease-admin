import request from '@/utils/http'

export type SpuFlag01 = 0 | 1

const SPU_BASE_PATH = '/api/v1/admin/products'

export interface SpuQueryParams {
  current: number
  size: number
  orderBy?: string
  sort?: string
  keyword?: string
  brandId?: number
  categoryId?: number
  publishStatus?: SpuFlag01
  newStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  verifyStatus?: SpuFlag01
  hasStagedChanges?: SpuFlag01
}

export interface AttrValueItem {
  attrId?: number
  attrName?: string
  attrValue: string
}

export interface SpuSkuItem {
  id?: number
  skuCode?: string
  attrValues: AttrValueItem[]
  pic?: string
  basePrice: number
  compareAtPrice?: number
  enableStatus?: SpuFlag01
  stock?: number
  lowStock?: number
  sale?: number
}

export interface SpuFormSkuItem {
  id?: number
  skuCode?: string
  pic?: string
  price: number
  originalPrice: number
  stock: number
  lowStock: number
  sale?: number
  enableStatus?: SpuFlag01
  spData?: string
}

export interface SpuSavePayload {
  id?: number
  brandId: number
  categoryId: number
  name: string
  description: string
  keywords: string
  subTitle?: string
  pic?: string
  albumPics?: string[]
  unit?: string
  weight?: number
  sort?: number
  publishStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  detailHtml?: string
  detailMobileHtml?: string
  attrValueList?: AttrValueItem[]
  skuList: SpuSkuItem[]
}

export interface SpuListItem {
  id: number
  spuCode?: string
  brandId: number
  brandName?: string
  categoryId: number
  categoryName?: string
  name: string
  pic?: string
  publishStatus: SpuFlag01
  newStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  verifyStatus?: SpuFlag01
  hasStagedChanges?: SpuFlag01
  sort?: number
  sale?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  createTime?: string
  updateTime?: string
}

export interface SpuDetailItem extends Omit<SpuListItem, 'minPrice' | 'maxPrice'> {
  description?: string
  keywords?: string
  subTitle?: string
  unit?: string
  weight?: number
  pic?: string
  albumPics: string[]
  detailHtml?: string
  detailMobileHtml?: string
  attrValueList: AttrValueItem[]
  skuStockList: SpuFormSkuItem[]
}

export interface SpuPageResponse extends Api.Common.PaginatedResponse<SpuListItem> {
  totalPage?: number
}

export interface SpuStatsResponse {
  all: number
  publish: number
  unpublish: number
  verify: number
  staged: number
}

interface SpuPageReqVO {
  pageNum: number
  pageSize: number
  orderBy?: string
  sort?: string
  keyword?: string
  brandId?: number
  categoryId?: number
  publishStatus?: SpuFlag01
  newStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  verifyStatus?: SpuFlag01
  hasStagedChanges?: SpuFlag01
}

interface AttrValueRespVO {
  attrId?: number
  attrName?: string
  attrValue?: string
}

interface SkuRespVO {
  id?: number
  skuCode?: string
  attrValues?: string | AttrValueRespVO[]
  attrValuesObj?: AttrValueRespVO[]
  specValues?: string | AttrValueRespVO[]
  pic?: string
  basePrice?: number
  compareAtPrice?: number
  enableStatus?: SpuFlag01
  stock?: number
  lowStock?: number
  sale?: number
}

interface SpuRespVO {
  id: number
  spuCode?: string
  brandId: number
  brandName?: string
  categoryId: number
  categoryName?: string
  name: string
  description?: string
  keywords?: string
  subTitle?: string
  pic?: string
  albumPics?: string[]
  unit?: string
  weight?: number
  publishStatus?: SpuFlag01
  newStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  verifyStatus?: SpuFlag01
  hasStagedChanges?: SpuFlag01
  sort?: number
  sale?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  createTime?: string
  updateTime?: string
  attrValueList?: AttrValueRespVO[]
  skuList?: SkuRespVO[]
  spuDetail?: {
    detailHtml?: string
    detailMobileHtml?: string
  }
  detailHtml?: string
  detailMobileHtml?: string
}

interface PageSpuRespVO {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: SpuRespVO[]
}

interface SpuStatsRespVO {
  allCount?: number
  publishedCount?: number
  unpublishedCount?: number
  unverifiedCount?: number
  hasStagedChangesCount?: number
}

interface SpuSaveReqVO {
  id?: number
  brandId: number
  categoryId: number
  name: string
  description: string
  keywords: string
  subTitle?: string
  pic?: string
  albumPics?: string[]
  unit?: string
  weight?: number
  sort?: number
  publishStatus?: SpuFlag01
  recommendStatus?: SpuFlag01
  spuDetail?: {
    detailHtml?: string
    detailMobileHtml?: string
  }
  attrValueList?: AttrValueRespVO[]
  skuList: Array<{
    id?: number
    skuCode?: string
    attrValues: AttrValueRespVO[]
    pic?: string
    basePrice: number
    compareAtPrice?: number
    enableStatus?: SpuFlag01
    stock?: number
    lowStock?: number
    sale?: number
  }>
}

function normalizeAttrValueList(input?: string | AttrValueRespVO[]): AttrValueItem[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => ({
        attrId: item.attrId,
        attrName: String(item.attrName || '').trim() || undefined,
        attrValue: String(item.attrValue || '').trim()
      }))
      .filter((item) => item.attrValue)
  }

  const rawText = String(input || '').trim()
  if (!rawText) return []

  try {
    return normalizeAttrValueList(JSON.parse(rawText))
  } catch {
    return []
  }
}

function toSpuListItem(item: SpuRespVO): SpuListItem {
  return {
    id: item.id,
    spuCode: item.spuCode,
    brandId: Number(item.brandId || 0),
    brandName: item.brandName,
    categoryId: Number(item.categoryId || 0),
    categoryName: item.categoryName,
    name: String(item.name || ''),
    pic: item.pic,
    publishStatus: Number(item.publishStatus ?? 0) === 1 ? 1 : 0,
    newStatus: Number(item.newStatus ?? 0) === 1 ? 1 : 0,
    recommendStatus: Number(item.recommendStatus ?? 0) === 1 ? 1 : 0,
    verifyStatus: Number(item.verifyStatus ?? 0) === 1 ? 1 : 0,
    hasStagedChanges: Number(item.hasStagedChanges ?? 0) === 1 ? 1 : 0,
    sort: Number(item.sort ?? 0),
    sale: Number(item.sale ?? 0),
    minPrice: Number(item.minPrice ?? 0),
    maxPrice: Number(item.maxPrice ?? 0),
    inStock: Boolean(item.inStock),
    createTime: item.createTime,
    updateTime: item.updateTime
  }
}

function toSpuFormSkuItem(item: SkuRespVO): SpuFormSkuItem {
  const attrValues = normalizeAttrValueList(
    item.attrValuesObj || item.attrValues || item.specValues
  )
  return {
    id: item.id,
    skuCode: item.skuCode,
    pic: item.pic,
    price: Number(item.basePrice ?? 0),
    originalPrice: Number(item.compareAtPrice ?? 0),
    stock: Number(item.stock ?? 0),
    lowStock: Number(item.lowStock ?? 0),
    sale: Number(item.sale ?? 0),
    enableStatus: Number(item.enableStatus ?? 1) === 1 ? 1 : 0,
    spData: JSON.stringify(attrValues)
  }
}

function toSpuDetailItem(item: SpuRespVO): SpuDetailItem {
  return {
    ...toSpuListItem(item),
    description: item.description,
    keywords: item.keywords,
    subTitle: item.subTitle,
    unit: item.unit,
    weight: Number(item.weight ?? 0),
    pic: item.pic,
    albumPics: Array.isArray(item.albumPics) ? item.albumPics : [],
    detailHtml: item.spuDetail?.detailHtml || item.detailHtml || '',
    detailMobileHtml: item.spuDetail?.detailMobileHtml || item.detailMobileHtml || '',
    attrValueList: normalizeAttrValueList(item.attrValueList),
    skuStockList: Array.isArray(item.skuList) ? item.skuList.map(toSpuFormSkuItem) : []
  }
}

function toSpuPageResponse(response: PageSpuRespVO): SpuPageResponse {
  return {
    records: (response.list || []).map(toSpuListItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0),
    totalPage: Number(response.totalPage || 0)
  }
}

function toSpuStatsResponse(response: SpuStatsRespVO): SpuStatsResponse {
  return {
    all: Number(response.allCount || 0),
    publish: Number(response.publishedCount || 0),
    unpublish: Number(response.unpublishedCount || 0),
    verify: Number(response.unverifiedCount || 0),
    staged: Number(response.hasStagedChangesCount || 0)
  }
}

function buildSpuQueryParams(params: SpuQueryParams): SpuPageReqVO {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined,
    keyword: String(params.keyword || '').trim() || undefined,
    brandId: params.brandId,
    categoryId: params.categoryId,
    publishStatus: params.publishStatus,
    newStatus: params.newStatus,
    recommendStatus: params.recommendStatus,
    verifyStatus: params.verifyStatus,
    hasStagedChanges: params.hasStagedChanges
  }
}

function buildSpuSaveReqVO(payload: SpuSavePayload, id?: number): SpuSaveReqVO {
  return {
    id,
    brandId: Number(payload.brandId || 0),
    categoryId: Number(payload.categoryId || 0),
    name: String(payload.name || '').trim(),
    description: String(payload.description || '').trim(),
    keywords: String(payload.keywords || '').trim(),
    subTitle: String(payload.subTitle || '').trim() || undefined,
    pic: String(payload.pic || '').trim() || undefined,
    albumPics: (payload.albumPics || []).map((item) => String(item || '').trim()).filter(Boolean),
    unit: String(payload.unit || '').trim() || undefined,
    weight: Number(payload.weight ?? 0),
    sort: Number(payload.sort ?? 0),
    publishStatus: Number(payload.publishStatus ?? 0) === 1 ? 1 : 0,
    recommendStatus: Number(payload.recommendStatus ?? 0) === 1 ? 1 : 0,
    spuDetail: {
      detailHtml: String(payload.detailHtml || payload.detailMobileHtml || '').trim(),
      detailMobileHtml: String(payload.detailMobileHtml || payload.detailHtml || '').trim()
    },
    attrValueList: (payload.attrValueList || [])
      .map((item) => ({
        attrId: item.attrId,
        attrName: String(item.attrName || '').trim() || undefined,
        attrValue: String(item.attrValue || '').trim()
      }))
      .filter((item) => item.attrValue),
    skuList: (payload.skuList || []).map((item) => ({
      id: item.id,
      skuCode: String(item.skuCode || '').trim() || undefined,
      attrValues: (item.attrValues || [])
        .map((attr) => ({
          attrId: attr.attrId,
          attrName: String(attr.attrName || '').trim() || undefined,
          attrValue: String(attr.attrValue || '').trim()
        }))
        .filter((attr) => attr.attrValue),
      pic: String(item.pic || '').trim() || undefined,
      basePrice: Number(item.basePrice ?? 0),
      compareAtPrice: Number(item.compareAtPrice ?? 0),
      enableStatus: Number(item.enableStatus ?? 1) === 1 ? 1 : 0,
      stock: Number(item.stock ?? 0),
      lowStock: Number(item.lowStock ?? 0),
      sale: Number(item.sale ?? 0)
    }))
  }
}

export function fetchSpuPage(params: SpuQueryParams) {
  return request
    .get<PageSpuRespVO>({
      url: SPU_BASE_PATH,
      params: buildSpuQueryParams(params)
    })
    .then(toSpuPageResponse)
}

export function fetchSpuStats(params: Partial<SpuQueryParams>) {
  return request
    .get<SpuStatsRespVO>({
      url: `${SPU_BASE_PATH}/stats`,
      params: buildSpuQueryParams({
        current: Number(params.current || 1),
        size: Number(params.size || 10),
        ...params
      })
    })
    .then(toSpuStatsResponse)
}

export function getSpu(id: number) {
  return request
    .get<SpuRespVO>({
      url: `${SPU_BASE_PATH}/${id}`
    })
    .then(toSpuDetailItem)
}

export function createSpu(payload: SpuSavePayload) {
  return request.post<number>({
    url: SPU_BASE_PATH,
    data: buildSpuSaveReqVO(payload, 0),
    showSuccessMessage: true
  })
}

export function updateSpu(id: number, payload: SpuSavePayload) {
  return request.put<number>({
    url: `${SPU_BASE_PATH}/${id}`,
    data: buildSpuSaveReqVO(payload, id),
    showSuccessMessage: true
  })
}

export function deleteSpu(id: number) {
  return request.del<number>({
    url: `${SPU_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function publishSpu(spuIds: number[], publishStatus: SpuFlag01) {
  return request.put<number>({
    url: `${SPU_BASE_PATH}/${publishStatus === 1 ? 'publish' : 'unpublish'}`,
    data: spuIds,
    showSuccessMessage: true
  })
}

export interface SpuSelectorSkuItem {
  id: number
  skuCode?: string
  pic?: string
  price: number
  stock: number
  enableStatus: SpuFlag01
  attrValuesObj: AttrValueItem[]
}

export interface SpuWithSkusItem extends SpuListItem {
  skuList: SpuSelectorSkuItem[]
}

interface SpuWithSkusRespVO extends SpuRespVO {
  skuVOList?: SkuRespVO[]
}

interface PageSpuWithSkusRespVO {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: SpuWithSkusRespVO[]
}

function toSpuSelectorSkuItem(item: SkuRespVO): SpuSelectorSkuItem {
  return {
    id: Number(item.id || 0),
    skuCode: item.skuCode,
    pic: item.pic,
    price: Number(item.basePrice ?? 0),
    stock: Number(item.stock ?? 0),
    enableStatus: Number(item.enableStatus ?? 1) === 1 ? 1 : 0,
    attrValuesObj: normalizeAttrValueList(item.attrValuesObj || item.attrValues || item.specValues)
  }
}

function toSpuWithSkusItem(item: SpuWithSkusRespVO): SpuWithSkusItem {
  return {
    ...toSpuListItem(item),
    skuList: (item.skuVOList || item.skuList || [])
      .map(toSpuSelectorSkuItem)
      .filter((sku) => sku.id > 0)
  }
}

function toSpuWithSkusPageResponse(
  response: PageSpuWithSkusRespVO
): Api.Common.PaginatedResponse<SpuWithSkusItem> {
  return {
    records: (response.list || []).map(toSpuWithSkusItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0)
  }
}

export function fetchSpuWithSkusPage(
  params: SpuQueryParams
): Promise<Api.Common.PaginatedResponse<SpuWithSkusItem>> {
  return request
    .get<PageSpuWithSkusRespVO>({
      url: `${SPU_BASE_PATH}/with-skus`,
      params: buildSpuQueryParams(params)
    })
    .then(toSpuWithSkusPageResponse)
}
