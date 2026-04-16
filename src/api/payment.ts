import request from '@/utils/http'
import { type PayChannel, type PaymentInfo, type PaymentStatus } from './order'

const PAYMENT_BASE_PATH = '/api/v1/admin/payments'

export interface PaymentQueryParams {
  current: number
  size: number
  orderBy?: string
  sort?: string
  paymentNo?: string
  orderNo?: string
  payChannel?: PayChannel
  status?: PaymentStatus
  createTimeStart?: string
  createTimeEnd?: string
}

export interface PaymentPageResponse extends Api.Common.PaginatedResponse<PaymentListItem> {
  totalPage?: number
}

export type PaymentListItem = PaymentInfo
export type PaymentDetailItem = PaymentInfo

interface PaymentRespVO {
  paymentNo?: string
  orderNo?: string
  payAmount?: number
  payChannel?: PayChannel
  status?: PaymentStatus
  expireTime?: string | null
  paidTime?: string | null
  createTime?: string
  payForm?: string | null
}

interface PagePaymentRespVO {
  pageNum?: number
  pageSize?: number
  totalPage?: number
  total?: number
  list?: PaymentRespVO[]
}

function normalizeText(value?: string | null) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function toPaymentItem(item: PaymentRespVO): PaymentListItem {
  return {
    paymentNo: normalizeText(item.paymentNo) || '',
    orderNo: normalizeText(item.orderNo) || '',
    payAmount: Number(item.payAmount || 0),
    payChannel: item.payChannel,
    status: item.status,
    expireTime: item.expireTime || null,
    paidTime: item.paidTime || null,
    createTime: item.createTime,
    payForm: item.payForm || null
  }
}

function toPaymentPageResponse(response: PagePaymentRespVO): PaymentPageResponse {
  return {
    records: (response.list || []).map(toPaymentItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0),
    totalPage: Number(response.totalPage || 0)
  }
}

function toPaymentQueryParams(params: PaymentQueryParams) {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    orderBy: normalizeText(params.orderBy),
    sort: normalizeText(params.sort),
    paymentNo: normalizeText(params.paymentNo),
    orderNo: normalizeText(params.orderNo),
    payChannel: params.payChannel,
    status: params.status,
    createTimeStart: normalizeText(params.createTimeStart),
    createTimeEnd: normalizeText(params.createTimeEnd)
  }
}

export function fetchPaymentPage(params: PaymentQueryParams): Promise<PaymentPageResponse> {
  return request
    .get<PagePaymentRespVO>({
      url: PAYMENT_BASE_PATH,
      params: toPaymentQueryParams(params)
    })
    .then(toPaymentPageResponse)
}

export function fetchPaymentDetail(paymentNo: string): Promise<PaymentDetailItem> {
  return request
    .get<PaymentRespVO>({
      url: `${PAYMENT_BASE_PATH}/${encodeURIComponent(paymentNo)}`
    })
    .then(toPaymentItem)
}
