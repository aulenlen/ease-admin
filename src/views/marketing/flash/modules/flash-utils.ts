import type { FlashProductItem, FlashRouteType, FlashSessionItem } from '@/api/flash'
import { formatDateTime } from '@/utils/date'

export interface FlashAttrValueItem {
  attrId?: number
  attrName?: string
  attrValue?: string
}

export interface SelectedFlashSku {
  skuId: number
  spuId: number
  spuName: string
  spuPic?: string
  categoryName?: string
  skuCode?: string
  attrValues?: string
  attrValuesObj: FlashAttrValueItem[]
  pic?: string
  price: number
  stock: number
  enableStatus?: number
}

export interface FlashSkuConfig {
  skuId: number
  spuId: number
  spuName: string
  spuPic?: string
  skuCode?: string
  attrValuesObj: FlashAttrValueItem[]
  price: number
  availableStock: number | null
  flashPrice: number
  flashStock: number
  flashLimit: number
  routeType: FlashRouteType
  sort: number
  flashProductId?: number
}

function toDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeFlashRouteType(value?: number | null): FlashRouteType {
  return Number(value || 0) === 1 ? 1 : 0
}

export function getFlashRouteTypeText(value?: number | null) {
  return normalizeFlashRouteType(value) === 1 ? '热点商品' : '普通商品'
}

export function getFlashRouteTagType(
  value?: number | null
): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  return normalizeFlashRouteType(value) === 1 ? 'warning' : 'info'
}

export function parseFlashAttrValues(attrValues?: string | null): FlashAttrValueItem[] {
  const rawText = String(attrValues || '').trim()
  if (!rawText) return []

  try {
    const parsed = JSON.parse(rawText) as FlashAttrValueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatFlashAttrValues(attrValues?: string | null) {
  const parsed = parseFlashAttrValues(attrValues)
  if (!parsed.length) {
    return String(attrValues || '').trim() || '-'
  }

  return parsed
    .map((item) => [item.attrName, item.attrValue].filter(Boolean).join('：'))
    .filter(Boolean)
    .join(' · ')
}

export function formatFlashSessionRange(
  session?: Pick<FlashSessionItem, 'startTime' | 'endTime'> | null
) {
  if (!session) return '-'
  return `${formatDateTime(session.startTime)} 至 ${formatDateTime(session.endTime)}`
}

export function getFlashSessionRuntimeText(
  session?: Pick<FlashSessionItem, 'startTime' | 'endTime' | 'sessionStatus'> | null
) {
  if (!session) return '未知'
  if (Number(session.sessionStatus ?? 0) !== 1) return '已禁用'

  const now = new Date()
  const start = toDate(session.startTime)
  const end = toDate(session.endTime)

  if (!start || !end) return '待校验'
  if (now < start) return '未开始'
  if (now > end) return '已结束'
  return '进行中'
}

export function getFlashRuntimeTagType(
  statusText: string
): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  if (statusText === '进行中') return 'success'
  if (statusText === '未开始') return 'warning'
  if (statusText === '已禁用' || statusText === '已售罄') return 'danger'
  return 'info'
}

export function getFlashProductRuntimeText(product: FlashProductItem) {
  if (Number(product.sessionStatus ?? 1) !== 1) return '已禁用'
  if (Number(product.flashStock || 0) <= 0) return '已售罄'
  if (product.timeStatus === 0) return '未开始'
  if (product.timeStatus === 1) return '进行中'
  if (product.timeStatus === 2) return '已结束'

  return getFlashSessionRuntimeText({
    startTime: product.sessionStartTime || '',
    endTime: product.sessionEndTime || '',
    sessionStatus: product.sessionStatus ?? 1
  })
}
