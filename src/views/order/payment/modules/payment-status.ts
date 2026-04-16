import {
  PAY_CHANNEL_TEXT,
  PAYMENT_STATUS_TEXT,
  type PayChannel,
  type PaymentStatus
} from '@/api/order'

export function getPaymentStatusText(status?: number | null) {
  const normalized = Number(status)
  if (normalized === 1 || normalized === 2 || normalized === 3 || normalized === 4) {
    return PAYMENT_STATUS_TEXT[normalized as PaymentStatus]
  }
  return '-'
}

export function getPayChannelText(payChannel?: number | null) {
  const normalized = Number(payChannel)
  if (normalized === 1 || normalized === 2 || normalized === 9) {
    return PAY_CHANNEL_TEXT[normalized as PayChannel]
  }
  return '-'
}

export function getPaymentTagType(
  status?: PaymentStatus | null
): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  if (status === 2) return 'success'
  if (status === 3) return 'info'
  if (status === 4) return 'danger'
  return 'warning'
}

export function formatMoney(amount?: number | null) {
  return `¥${Number(amount || 0).toFixed(2)}`
}
