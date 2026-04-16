import request from '@/utils/http'

export type FlashRouteType = 0 | 1
export type FlashSessionStatus = 0 | 1

const FLASH_BASE_PATH = '/api/v1/admin/flash'

export interface FlashSessionQueryParams {
  current: number
  size: number
  orderBy?: string
  sort?: string
  name?: string
  sessionStatus?: FlashSessionStatus
  startTimeFrom?: string
  startTimeTo?: string
}

export interface FlashSessionSavePayload {
  id?: number
  name: string
  startTime: string
  endTime: string
  sessionStatus?: FlashSessionStatus
}

export interface FlashSessionItem {
  id: number
  name: string
  startTime: string
  endTime: string
  sessionStatus: FlashSessionStatus
  timeStatus?: number
}

export interface FlashSessionPageResponse extends Api.Common.PaginatedResponse<FlashSessionItem> {
  totalPage?: number
}

export interface FlashProductQueryParams {
  current: number
  size: number
  orderBy?: string
  sort?: string
  sessionId?: number
  keyword?: string
  brandId?: number
  categoryId?: number
  spuId?: number
  skuId?: number
  routeType?: FlashRouteType
}

export interface FlashProductSavePayload {
  id?: number
  flashSessionId: number
  spuId: number
  skuId: number
  flashPrice: number
  flashStock: number
  flashLimit?: number
  routeType?: FlashRouteType
  sort?: number
}

export interface FlashProductItem {
  id: number
  flashSessionId: number
  sessionName?: string
  sessionStartTime?: string
  sessionEndTime?: string
  sessionStatus?: FlashSessionStatus
  timeStatus?: number
  spuId: number
  spuName: string
  spuPic?: string
  skuId: number
  skuPic?: string
  attrValues?: string
  originalPrice: number
  flashPrice: number
  flashStock: number
  flashLimit: number
  routeType?: FlashRouteType | null
  sort?: number
}

export interface FlashProductPageResponse extends Api.Common.PaginatedResponse<FlashProductItem> {
  totalPage?: number
}

interface FlashSessionRespVO {
  id: number
  name?: string
  startTime?: string
  endTime?: string
  sessionStatus?: FlashSessionStatus
  timeStatus?: number
}

interface FlashProductRespVO {
  id: number
  flashSessionId?: number
  sessionName?: string
  sessionStartTime?: string
  sessionEndTime?: string
  sessionStatus?: FlashSessionStatus
  timeStatus?: number
  spuId?: number
  spuName?: string
  spuPic?: string
  skuId?: number
  skuPic?: string
  attrValues?: string
  originalPrice?: number
  flashPrice?: number
  flashStock?: number
  flashLimit?: number
  routeType?: FlashRouteType | null
  sort?: number
}

interface FlashPageRespVO<T> {
  pageNum?: number
  pageSize?: number
  totalPage?: number
  total?: number
  list?: T[]
}

function normalizeText(value?: string | null) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function toFlashSessionItem(item: FlashSessionRespVO): FlashSessionItem {
  return {
    id: Number(item.id || 0),
    name: normalizeText(item.name) || '',
    startTime: normalizeText(item.startTime) || '',
    endTime: normalizeText(item.endTime) || '',
    sessionStatus: Number(item.sessionStatus ?? 0) === 1 ? 1 : 0,
    timeStatus: item.timeStatus
  }
}

function toFlashProductItem(item: FlashProductRespVO): FlashProductItem {
  return {
    id: Number(item.id || 0),
    flashSessionId: Number(item.flashSessionId || 0),
    sessionName: normalizeText(item.sessionName),
    sessionStartTime: normalizeText(item.sessionStartTime),
    sessionEndTime: normalizeText(item.sessionEndTime),
    sessionStatus: item.sessionStatus,
    timeStatus: item.timeStatus,
    spuId: Number(item.spuId || 0),
    spuName: normalizeText(item.spuName) || '',
    spuPic: normalizeText(item.spuPic),
    skuId: Number(item.skuId || 0),
    skuPic: normalizeText(item.skuPic),
    attrValues: normalizeText(item.attrValues),
    originalPrice: Number(item.originalPrice || 0),
    flashPrice: Number(item.flashPrice || 0),
    flashStock: Number(item.flashStock || 0),
    flashLimit: Number(item.flashLimit || 0),
    routeType: item.routeType ?? 0,
    sort: Number(item.sort || 0)
  }
}

function toFlashSessionPageResponse(
  response: FlashPageRespVO<FlashSessionRespVO>
): FlashSessionPageResponse {
  return {
    records: (response.list || []).map(toFlashSessionItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0),
    totalPage: Number(response.totalPage || 0)
  }
}

function toFlashProductPageResponse(
  response: FlashPageRespVO<FlashProductRespVO>
): FlashProductPageResponse {
  return {
    records: (response.list || []).map(toFlashProductItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0),
    totalPage: Number(response.totalPage || 0)
  }
}

function toFlashSessionQueryParams(params: FlashSessionQueryParams) {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    orderBy: normalizeText(params.orderBy),
    sort: normalizeText(params.sort),
    name: normalizeText(params.name),
    sessionStatus: params.sessionStatus,
    startTimeFrom: normalizeText(params.startTimeFrom),
    startTimeTo: normalizeText(params.startTimeTo)
  }
}

function toFlashProductQueryParams(params: FlashProductQueryParams) {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    orderBy: normalizeText(params.orderBy),
    sort: normalizeText(params.sort),
    sessionId: params.sessionId,
    keyword: normalizeText(params.keyword),
    brandId: params.brandId,
    categoryId: params.categoryId,
    spuId: params.spuId,
    skuId: params.skuId,
    routeType: params.routeType
  }
}

function toFlashSessionSavePayload(payload: FlashSessionSavePayload) {
  return {
    id: payload.id,
    name: normalizeText(payload.name) || '',
    startTime: normalizeText(payload.startTime) || '',
    endTime: normalizeText(payload.endTime) || '',
    sessionStatus: Number(payload.sessionStatus ?? 1) === 1 ? 1 : 0
  }
}

function toFlashProductSavePayload(payload: FlashProductSavePayload) {
  return {
    id: payload.id,
    flashSessionId: Number(payload.flashSessionId || 0),
    spuId: Number(payload.spuId || 0),
    skuId: Number(payload.skuId || 0),
    flashPrice: Number(payload.flashPrice || 0),
    flashStock: Number(payload.flashStock || 0),
    flashLimit: Number(payload.flashLimit || 0),
    routeType: payload.routeType ?? 0,
    sort: Number(payload.sort || 0)
  }
}

export function fetchFlashSessionPage(
  params: FlashSessionQueryParams
): Promise<FlashSessionPageResponse> {
  return request
    .get<FlashPageRespVO<FlashSessionRespVO>>({
      url: `${FLASH_BASE_PATH}/sessions`,
      params: toFlashSessionQueryParams(params)
    })
    .then(toFlashSessionPageResponse)
}

export function createFlashSession(payload: FlashSessionSavePayload): Promise<number> {
  return request.post<number>({
    url: `${FLASH_BASE_PATH}/sessions`,
    data: toFlashSessionSavePayload(payload),
    showSuccessMessage: true
  })
}

export function updateFlashSession(payload: FlashSessionSavePayload): Promise<number> {
  return request.put<number>({
    url: `${FLASH_BASE_PATH}/sessions`,
    data: toFlashSessionSavePayload(payload),
    showSuccessMessage: true
  })
}

export function deleteFlashSession(id: number): Promise<number> {
  return request.del<number>({
    url: `${FLASH_BASE_PATH}/sessions/${id}`,
    showSuccessMessage: true
  })
}

export function updateFlashSessionStatusBatch(
  ids: number[],
  sessionStatus: FlashSessionStatus
): Promise<number> {
  return request.put<number>({
    url: `${FLASH_BASE_PATH}/sessions/status`,
    params: { sessionStatus },
    data: ids,
    showSuccessMessage: true
  })
}

export function fetchFlashProductPage(
  params: FlashProductQueryParams
): Promise<FlashProductPageResponse> {
  return request
    .get<FlashPageRespVO<FlashProductRespVO>>({
      url: `${FLASH_BASE_PATH}/products`,
      params: toFlashProductQueryParams(params)
    })
    .then(toFlashProductPageResponse)
}

export function createFlashProductBatch(payload: FlashProductSavePayload[]): Promise<number> {
  return request.post<number>({
    url: `${FLASH_BASE_PATH}/products/batch`,
    data: payload.map(toFlashProductSavePayload),
    showSuccessMessage: true
  })
}

export function updateFlashProduct(payload: FlashProductSavePayload): Promise<number> {
  return request.put<number>({
    url: `${FLASH_BASE_PATH}/products`,
    data: toFlashProductSavePayload(payload),
    showSuccessMessage: true
  })
}

export function deleteFlashProduct(id: number): Promise<number> {
  return request.del<number>({
    url: `${FLASH_BASE_PATH}/products/${id}`,
    showSuccessMessage: true
  })
}

export function deleteFlashProductBatch(ids: number[]): Promise<number> {
  return request.del<number>({
    url: `${FLASH_BASE_PATH}/products/batch`,
    data: ids,
    showSuccessMessage: true
  })
}
