import request from '@/utils/http'

export const SLOT_STATUS = {
  DISABLED: 0,
  ENABLED: 1
} as const

export type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS]

export const SLOT_RENDER_TYPE = {
  SWIPER: 'SWIPER',
  ARTICLE_LIST: 'ARTICLE_LIST'
} as const

export type SlotRenderType = (typeof SLOT_RENDER_TYPE)[keyof typeof SLOT_RENDER_TYPE]

export const SLOT_RENDER_TYPE_LABEL: Record<SlotRenderType, string> = {
  SWIPER: '轮播',
  ARTICLE_LIST: '文章列表'
}

export const SLOT_RENDER_TYPE_OPTIONS = [
  { label: SLOT_RENDER_TYPE_LABEL.SWIPER, value: SLOT_RENDER_TYPE.SWIPER },
  { label: SLOT_RENDER_TYPE_LABEL.ARTICLE_LIST, value: SLOT_RENDER_TYPE.ARTICLE_LIST }
]

export function getSlotRenderTypeLabel(value?: string | null): string {
  if (!value) return ''
  return SLOT_RENDER_TYPE_LABEL[value as SlotRenderType] ?? value
}

export const SLOT_ITEM_TYPE = {
  CARD: 'CARD',
  ARTICLE: 'ARTICLE'
} as const

export type SlotItemType = (typeof SLOT_ITEM_TYPE)[keyof typeof SLOT_ITEM_TYPE]

export const RENDER_TYPE_TO_ITEM_TYPE: Record<SlotRenderType, SlotItemType> = {
  SWIPER: SLOT_ITEM_TYPE.CARD,
  ARTICLE_LIST: SLOT_ITEM_TYPE.ARTICLE
}

export function resolveLockedItemType(renderType?: string | null): SlotItemType {
  if (renderType && renderType in RENDER_TYPE_TO_ITEM_TYPE) {
    return RENDER_TYPE_TO_ITEM_TYPE[renderType as SlotRenderType]
  }
  return SLOT_ITEM_TYPE.CARD
}

export const SLOT_ITEM_JUMP_TYPE = {
  NONE: 0,
  ACTIVITY: 1,
  SPU: 2,
  ARTICLE: 3,
  EXTERNAL: 4
} as const

export type SlotItemJumpType = (typeof SLOT_ITEM_JUMP_TYPE)[keyof typeof SLOT_ITEM_JUMP_TYPE]

export interface SlotQueryParams {
  current: number
  size: number
  keyword?: string
  pageCode?: string
  renderType?: string
  status?: SlotStatus | ''
  orderBy?: string
  sort?: string
}

export interface SlotItemQueryParams {
  current: number
  size: number
  itemType?: SlotItemType | ''
  status?: SlotStatus | ''
  orderBy?: string
  sort?: string
}

export interface SlotListItem {
  id: number
  code: string
  name: string
  pageCode: string
  renderType: string
  status: number
  note?: string
  createTime?: string
  updateTime?: string
}

export type SlotDetailItem = SlotListItem

export interface SlotUpdatePayload {
  status?: number
  note?: string
}

export interface SlotItem {
  id?: number
  slotId?: number
  itemType: SlotItemType
  articleId?: number
  title?: string
  subTitle?: string
  pic?: string
  jumpType?: number
  jumpTargetId?: number
  url?: string
  sort?: number
  status?: number
  startTime?: string
  endTime?: string
  note?: string
  createTime?: string
  updateTime?: string
}

export type SlotItemSavePayload = SlotItem

export interface SlotPageResponse extends Api.Common.PaginatedResponse<SlotListItem> {
  totalPage?: number
}

export interface SlotItemPageResponse extends Api.Common.PaginatedResponse<SlotItem> {
  totalPage?: number
}

const SLOT_BASE_PATH = '/api/v1/admin/content/slots'

interface SlotRespVO {
  id: number
  code: string
  name: string
  pageCode: string
  renderType: string
  status: number
  note?: string
  createTime?: string
  updateTime?: string
}

interface PageSlotRespVO {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: SlotRespVO[]
}

interface SlotReqVO {
  status?: number
  note?: string
}

interface StatusBatchReqVO {
  ids: number[]
  status: number
}

interface SlotItemRespVO {
  id?: number
  slotId?: number
  itemType?: string
  articleId?: number
  title?: string
  subTitle?: string
  pic?: string
  jumpType?: number
  jumpTargetId?: number
  url?: string
  sort?: number
  status?: number
  startTime?: string
  endTime?: string
  note?: string
  createTime?: string
  updateTime?: string
}

interface PageSlotItemRespVO {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: SlotItemRespVO[]
}

interface SlotItemReqVO {
  id?: number
  articleId?: number
  title?: string
  subTitle?: string
  pic?: string
  jumpType?: number
  jumpTargetId?: number
  url?: string
  sort?: number
  status?: number
  startTime?: string
  endTime?: string
  note?: string
}

function formatBackendDateTime(value?: string | Date | number | null): string | undefined {
  if (!value) return undefined

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    const matched = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
    if (matched) return `${matched[1]} ${matched[2]}`
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function toSlotListItem(item: SlotRespVO): SlotListItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    pageCode: item.pageCode,
    renderType: item.renderType,
    status: item.status,
    note: item.note,
    createTime: item.createTime,
    updateTime: item.updateTime
  }
}

function toSlotItem(item: SlotItemRespVO): SlotItem {
  return {
    id: item.id,
    slotId: item.slotId,
    itemType:
      item.itemType === SLOT_ITEM_TYPE.ARTICLE ? SLOT_ITEM_TYPE.ARTICLE : SLOT_ITEM_TYPE.CARD,
    articleId: item.articleId,
    title: item.title,
    subTitle: item.subTitle,
    pic: item.pic,
    jumpType: item.jumpType,
    jumpTargetId: item.jumpTargetId,
    url: item.url,
    sort: item.sort,
    status: item.status,
    startTime: item.startTime,
    endTime: item.endTime,
    note: item.note,
    createTime: item.createTime,
    updateTime: item.updateTime
  }
}

function toSlotPageResponse(response: PageSlotRespVO): SlotPageResponse {
  return {
    records: (response.list || []).map(toSlotListItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0,
    totalPage: response.totalPage
  }
}

function toSlotItemPageResponse(response: PageSlotItemRespVO): SlotItemPageResponse {
  return {
    records: (response.list || []).map(toSlotItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0,
    totalPage: response.totalPage
  }
}

function toSlotQueryParams(params: SlotQueryParams) {
  return {
    pageNum: params.current,
    pageSize: params.size,
    keyword: params.keyword || undefined,
    pageCode: params.pageCode || undefined,
    renderType: params.renderType || undefined,
    status: params.status === '' ? undefined : params.status,
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined
  }
}

function toSlotItemQueryParams(params: SlotItemQueryParams) {
  return {
    pageNum: params.current,
    pageSize: params.size,
    itemType: params.itemType === '' ? undefined : params.itemType,
    status: params.status === '' ? undefined : params.status,
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined
  }
}

function normalizeJumpTypePayload(item: SlotItemSavePayload) {
  if (item.itemType !== SLOT_ITEM_TYPE.CARD) {
    return {
      jumpType: undefined,
      jumpTargetId: undefined,
      url: undefined
    }
  }

  const jumpType = item.jumpType
  if (jumpType === SLOT_ITEM_JUMP_TYPE.EXTERNAL) {
    return {
      jumpType,
      jumpTargetId: undefined,
      url: String(item.url || '').trim() || undefined
    }
  }

  if (
    jumpType === SLOT_ITEM_JUMP_TYPE.ACTIVITY ||
    jumpType === SLOT_ITEM_JUMP_TYPE.SPU ||
    jumpType === SLOT_ITEM_JUMP_TYPE.ARTICLE
  ) {
    return {
      jumpType,
      jumpTargetId: item.jumpTargetId,
      url: undefined
    }
  }

  return {
    jumpType: jumpType ?? SLOT_ITEM_JUMP_TYPE.NONE,
    jumpTargetId: undefined,
    url: undefined
  }
}

function toSlotReqVO(payload: SlotUpdatePayload): SlotReqVO {
  return {
    status: payload.status,
    note: String(payload.note || '').trim() || undefined
  }
}

function toStatusBatchReqVO(ids: number[], status: number): StatusBatchReqVO {
  return {
    ids: ids.filter((id) => Number.isFinite(id)),
    status
  }
}

function toSlotItemReqVO(item: SlotItemSavePayload): SlotItemReqVO {
  const jumpPayload = normalizeJumpTypePayload(item)

  if (item.itemType === SLOT_ITEM_TYPE.ARTICLE) {
    return {
      id: item.id,
      articleId: item.articleId,
      sort: item.sort,
      status: item.status,
      startTime: formatBackendDateTime(item.startTime),
      endTime: formatBackendDateTime(item.endTime),
      note: String(item.note || '').trim() || undefined
    }
  }

  return {
    id: item.id,
    title: String(item.title || '').trim() || undefined,
    subTitle: String(item.subTitle || '').trim() || undefined,
    pic: String(item.pic || '').trim() || undefined,
    jumpType: jumpPayload.jumpType,
    jumpTargetId: jumpPayload.jumpTargetId,
    url: jumpPayload.url,
    sort: item.sort,
    status: item.status,
    startTime: formatBackendDateTime(item.startTime),
    endTime: formatBackendDateTime(item.endTime),
    note: String(item.note || '').trim() || undefined
  }
}

export function fetchSlotPage(params: SlotQueryParams) {
  return request
    .get<PageSlotRespVO>({
      url: SLOT_BASE_PATH,
      params: toSlotQueryParams(params)
    })
    .then(toSlotPageResponse)
}

export function getSlot(id: number) {
  return request
    .get<SlotRespVO>({
      url: `${SLOT_BASE_PATH}/${id}`
    })
    .then(toSlotListItem)
}

export function updateSlot(id: number, payload: SlotUpdatePayload) {
  return request.put<number>({
    url: `${SLOT_BASE_PATH}/${id}`,
    data: toSlotReqVO(payload),
    showSuccessMessage: true
  })
}

export function updateSlotStatus(ids: number[], status: number) {
  return request.put<number>({
    url: `${SLOT_BASE_PATH}/status`,
    data: toStatusBatchReqVO(ids, status),
    showSuccessMessage: true
  })
}

export function fetchSlotItemPage(slotId: number, params: SlotItemQueryParams) {
  return request
    .get<PageSlotItemRespVO>({
      url: `${SLOT_BASE_PATH}/${slotId}/items`,
      params: toSlotItemQueryParams(params)
    })
    .then(toSlotItemPageResponse)
}

export function getSlotItem(slotId: number, itemId: number) {
  return request
    .get<SlotItemRespVO>({
      url: `${SLOT_BASE_PATH}/${slotId}/items/${itemId}`
    })
    .then(toSlotItem)
}

export function createSlotItem(
  slotId: number,
  payload: SlotItemSavePayload,
  opts: { showSuccessMessage?: boolean } = {}
) {
  return request.post<number>({
    url: `${SLOT_BASE_PATH}/${slotId}/items`,
    data: toSlotItemReqVO(payload),
    showSuccessMessage: opts.showSuccessMessage ?? true
  })
}

export function updateSlotItem(
  slotId: number,
  itemId: number,
  payload: SlotItemSavePayload,
  opts: { showSuccessMessage?: boolean } = {}
) {
  return request.put<number>({
    url: `${SLOT_BASE_PATH}/${slotId}/items/${itemId}`,
    data: toSlotItemReqVO(payload),
    showSuccessMessage: opts.showSuccessMessage ?? true
  })
}

export function deleteSlotItem(
  slotId: number,
  itemId: number,
  opts: { showSuccessMessage?: boolean } = {}
) {
  return request.del<number>({
    url: `${SLOT_BASE_PATH}/${slotId}/items/${itemId}`,
    showSuccessMessage: opts.showSuccessMessage ?? true
  })
}

export function updateSlotItemStatus(slotId: number, ids: number[], status: number) {
  return request.put<number>({
    url: `${SLOT_BASE_PATH}/${slotId}/items/status`,
    data: toStatusBatchReqVO(ids, status),
    showSuccessMessage: true
  })
}
