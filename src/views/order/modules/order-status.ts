import {
  ORDER_STATUS_TEXT,
  PAYMENT_STATUS_TEXT,
  SHIPMENT_STATUS_TEXT,
  type OrderListItem,
  type OrderStatus
} from '@/api/order'

export type OrderTabKey =
  | 'all'
  | 'pendingPay'
  | 'paid'
  | 'pendingShip'
  | 'pendingReceive'
  | 'finished'
  | 'canceled'

export const TAB_TO_STATUS: Record<OrderTabKey, OrderStatus | null> = {
  all: null,
  pendingPay: 5,
  paid: 6,
  pendingShip: 1,
  pendingReceive: 2,
  finished: 3,
  canceled: 4
}

export const normalizeOrderStatus = (status: unknown): number | null => {
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status
  }

  if (typeof status === 'string') {
    const trimmed = status.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const isOrderReadyToShip = (status: unknown, statusDesc?: string | null) => {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 1) return true

  const normalizedDesc = String(statusDesc || '').trim()
  return normalizedDesc === '待发货' || normalizedDesc.includes('待发货')
}

export const canForceCancelOrder = (status: unknown) => {
  const normalized = normalizeOrderStatus(status)
  return normalized !== null && [2, 5, 6].includes(normalized)
}

export const getOrderTagType = (status: unknown) => {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 3) return 'success'
  if (normalized === 4) return 'danger'
  if (normalized === 1 || normalized === 2) return 'warning'
  return 'info'
}

export const formatMoney = (value: number) => `￥${Number(value || 0).toFixed(2)}`

export const getOrderStatusText = (status: unknown, statusDesc?: string | null) => {
  const normalized = Number(status)
  if (normalized && ORDER_STATUS_TEXT[normalized as OrderStatus]) {
    return statusDesc || ORDER_STATUS_TEXT[normalized as OrderStatus]
  }
  return statusDesc || '未知状态'
}

export const getPaymentStatusText = (row?: OrderListItem | null) => {
  const status = row?.payment?.status
  if (!status) return '未付款'
  return PAYMENT_STATUS_TEXT[status] || '未付款'
}

export const getPaymentTagType = (row?: OrderListItem | null) => {
  const status = Number(row?.payment?.status || 1)
  if (status === 2) return 'success'
  if (status === 4) return 'danger'
  if (status === 3) return 'info'
  return 'warning'
}

export const getShipmentStatusText = (row?: OrderListItem | null) => {
  const status = row?.shipment?.status
  if (status === null || status === undefined) {
    return isOrderReadyToShip(row?.status, row?.statusDesc) ? '待发货' : '未发货'
  }
  return SHIPMENT_STATUS_TEXT[status] || '未发货'
}

export const getShipmentTagType = (row?: OrderListItem | null) => {
  const status = row?.shipment?.status
  if (status === 2) return 'success'
  if (status === 1) return 'warning'
  if (status === 0) return 'info'
  return isOrderReadyToShip(row?.status, row?.statusDesc) ? 'warning' : 'info'
}
