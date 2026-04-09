import request from '@/utils/http'

export type BrandFlag01 = 0 | 1

const BRAND_BASE_PATH = '/api/v1/admin/brands'

export interface BrandQueryParams {
  keyword?: string
  current: number
  size: number
  orderBy?: string
  sort?: string
  firstLetter?: string
  factoryStatus?: BrandFlag01
  showStatus?: BrandFlag01
}

export interface BrandSavePayload {
  id?: number
  name: string
  firstLetter?: string
  sort?: number
  factoryStatus?: BrandFlag01
  showStatus?: BrandFlag01
  logo?: string
  bigPic?: string
  brandStory?: string
}

export interface BrandListItem extends BrandSavePayload {
  id: number
  spuCount?: number
  spuCommentCount?: number
  createTime?: string
  updateTime?: string
}

export interface BrandDetailItem extends BrandListItem {
  creator?: string
  updater?: string
}

interface LegacyBrandPageResponse {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: BrandListItem[]
}

export interface BrandPageResponse extends Api.Common.PaginatedResponse<BrandListItem> {
  totalPage?: number
}

function buildStatusQuery(
  ids: number | number[],
  field: 'showStatus' | 'factoryStatus',
  value: BrandFlag01
) {
  const normalizedIds = Array.isArray(ids) ? ids.join(',') : String(ids)
  return `${BRAND_BASE_PATH}/${field === 'showStatus' ? 'show-status' : 'factory-status'}?ids=${encodeURIComponent(
    normalizedIds
  )}&${field}=${value}`
}

function normalizeBrandPageResponse(response: LegacyBrandPageResponse): BrandPageResponse {
  return {
    records: response.list || [],
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0,
    totalPage: response.totalPage
  }
}

function normalizeQueryParams(params: BrandQueryParams) {
  return {
    keyword: params.keyword || undefined,
    pageNum: params.current,
    pageSize: params.size,
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined,
    firstLetter: params.firstLetter || undefined,
    factoryStatus: params.factoryStatus,
    showStatus: params.showStatus
  }
}

export function fetchBrandPage(params: BrandQueryParams) {
  return request
    .get<LegacyBrandPageResponse>({
      url: BRAND_BASE_PATH,
      params: normalizeQueryParams(params)
    })
    .then(normalizeBrandPageResponse)
}

export function getBrand(id: number) {
  return request.get<BrandDetailItem>({
    url: `${BRAND_BASE_PATH}/${id}`
  })
}

export function createBrand(payload: BrandSavePayload) {
  return request.post<number>({
    url: BRAND_BASE_PATH,
    data: payload,
    showSuccessMessage: true
  })
}

export function updateBrand(id: number, payload: BrandSavePayload) {
  return request.put<number>({
    url: `${BRAND_BASE_PATH}/${id}`,
    data: {
      ...payload,
      id
    },
    showSuccessMessage: true
  })
}

export function deleteBrand(id: number) {
  return request.del<number>({
    url: `${BRAND_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function updateShowStatus(ids: number | number[], showStatus: BrandFlag01) {
  return request.request<number>({
    url: buildStatusQuery(ids, 'showStatus', showStatus),
    method: 'PUT',
    showSuccessMessage: true
  })
}

export function updateFactoryStatus(ids: number | number[], factoryStatus: BrandFlag01) {
  return request.request<number>({
    url: buildStatusQuery(ids, 'factoryStatus', factoryStatus),
    method: 'PUT',
    showSuccessMessage: true
  })
}
