import request from '@/utils/http'

export type OrderStatus = 1 | 2 | 3 | 4 | 5 | 6
export type PaymentStatus = 1 | 2 | 3 | 4
export type PayChannel = 1 | 2 | 9
export type ShipmentStatus = 0 | 1 | 2
export type OperationType = 1 | 2 | 3 | 4 | 5 | 6

const ORDER_BASE_PATH = '/api/v1/admin/orders'

export interface OrderQueryParams {
  current: number
  size: number
  orderBy?: string
  sort?: string
  orderNo?: string
  userId?: number
  receiverPhone?: string
  status?: OrderStatus
  payChannel?: PayChannel
  paymentStatus?: PaymentStatus
  createTimeStart?: string
  createTimeEnd?: string
  payAmountMin?: number
  payAmountMax?: number
}

export interface OrderItem {
  id: number
  spuId: number
  skuId: number
  spuName: string
  skuPic?: string | null
  skuAttrs?: string | null
  price: number
  quantity: number
  subtotal: number
}

export interface PaymentInfo {
  paymentNo: string
  orderNo: string
  payAmount: number
  payChannel?: PayChannel
  status?: PaymentStatus
  expireTime?: string | null
  paidTime?: string | null
  createTime?: string
  payForm?: string | null
}

export interface OrderShipmentInfo {
  logisticsCompany?: string | null
  logisticsCode?: string | null
  logisticsNo?: string | null
  shipperName?: string | null
  shipTime?: string | null
  receiveTime?: string | null
  status?: ShipmentStatus | null
  logisticsInfo?: string | null
}

export interface OrderOperationLog {
  id: number
  orderNo: string
  operatorId?: number | null
  operatorName?: string | null
  operationType: number
  detail?: string | null
  createTime?: string
}

export interface OrderListItem {
  id: number
  orderNo: string
  userId: number
  receiverName: string
  receiverPhone: string
  receiverProvince?: string | null
  receiverCity?: string | null
  receiverDistrict?: string | null
  receiverAddress?: string | null
  totalAmount: number
  freightAmount: number
  discountAmount: number
  payAmount: number
  status: OrderStatus
  statusDesc?: string | null
  remark?: string | null
  createTime?: string
  updateTime?: string
  items?: OrderItem[]
  payment?: PaymentInfo | null
  shipment?: OrderShipmentInfo | null
}

export type OrderDetailItem = OrderListItem

export interface OrderPageResponse extends Api.Common.PaginatedResponse<OrderListItem> {
  totalPage?: number
}

export interface OrderStatusDistributionItem {
  status: number
  statusDesc?: string | null
  count: number
}

export interface OrderShipPayload {
  orderNo: string
  logisticsCompany: string
  logisticsCode?: string | null
  logisticsNo: string
}

export interface OrderAddressPayload {
  orderNo: string
  receiverName?: string | null
  receiverPhone?: string | null
  receiverProvince?: string | null
  receiverCity?: string | null
  receiverDistrict?: string | null
  receiverAddress?: string | null
}

export interface OrderRemarkPayload {
  orderNo: string
  remark?: string | null
}

export interface OrderAmountPayload {
  orderNo: string
  payAmount: number
}

interface OrderItemRespVO {
  id: number
  spuId: number
  skuId: number
  spuName: string
  skuPic?: string | null
  skuAttrs?: string | null
  price?: number
  quantity?: number
  subtotal?: number
}

interface PaymentRespVO {
  paymentNo: string
  orderNo: string
  payAmount?: number
  payChannel?: PayChannel
  status?: PaymentStatus
  expireTime?: string | null
  paidTime?: string | null
  createTime?: string
  payForm?: string | null
}

interface OrderShipmentRespVO {
  logisticsCompany?: string | null
  logisticsCode?: string | null
  logisticsNo?: string | null
  shipperName?: string | null
  shipTime?: string | null
  receiveTime?: string | null
  status?: ShipmentStatus | null
  logisticsInfo?: string | null
}

interface OrderOperationLogRespVO {
  id: number
  orderNo: string
  operatorId?: number | null
  operatorName?: string | null
  operationType?: number
  detail?: string | null
  createTime?: string
}

interface OrderRespVO {
  id: number
  orderNo: string
  userId: number
  receiverName?: string
  receiverPhone?: string
  receiverProvince?: string | null
  receiverCity?: string | null
  receiverDistrict?: string | null
  receiverAddress?: string | null
  totalAmount?: number
  freightAmount?: number
  discountAmount?: number
  payAmount?: number
  status?: OrderStatus
  statusDesc?: string | null
  remark?: string | null
  createTime?: string
  updateTime?: string
  items?: OrderItemRespVO[]
  payment?: PaymentRespVO | null
  shipment?: OrderShipmentRespVO | null
}

interface PageOrderRespVO {
  pageNum?: number
  pageSize?: number
  totalPage?: number
  total?: number
  list?: OrderRespVO[]
}

interface OrderStatusDistributionRespVO {
  status?: number
  statusDesc?: string | null
  count?: number
}

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
  5: '待支付',
  6: '已支付'
}

export const PAYMENT_STATUS_TEXT: Record<PaymentStatus, string> = {
  1: '待支付',
  2: '支付成功',
  3: '已关闭',
  4: '支付失败'
}

export const PAY_CHANNEL_TEXT: Record<PayChannel, string> = {
  1: '支付宝',
  2: '微信支付',
  9: '模拟支付'
}

export const SHIPMENT_STATUS_TEXT: Record<ShipmentStatus, string> = {
  0: '已发货',
  1: '运输中',
  2: '已签收'
}

export const OPERATION_TYPE_TEXT: Record<OperationType, string> = {
  1: '发货',
  2: '强制取消',
  3: '修改地址',
  4: '修改备注',
  5: '调整金额',
  6: '退款'
}

function normalizeText(value?: string | null) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function toOrderItem(item: OrderItemRespVO): OrderItem {
  return {
    id: item.id,
    spuId: item.spuId,
    skuId: item.skuId,
    spuName: String(item.spuName || '').trim(),
    skuPic: item.skuPic || null,
    skuAttrs: item.skuAttrs || null,
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    subtotal: Number(item.subtotal || 0)
  }
}

function toPaymentInfo(item?: PaymentRespVO | null): PaymentInfo | null {
  if (!item?.paymentNo) return null
  return {
    paymentNo: item.paymentNo,
    orderNo: item.orderNo,
    payAmount: Number(item.payAmount || 0),
    payChannel: item.payChannel,
    status: item.status,
    expireTime: item.expireTime || null,
    paidTime: item.paidTime || null,
    createTime: item.createTime,
    payForm: item.payForm || null
  }
}

function toShipmentInfo(item?: OrderShipmentRespVO | null): OrderShipmentInfo | null {
  if (!item) return null
  return {
    logisticsCompany: item.logisticsCompany || null,
    logisticsCode: item.logisticsCode || null,
    logisticsNo: item.logisticsNo || null,
    shipperName: item.shipperName || null,
    shipTime: item.shipTime || null,
    receiveTime: item.receiveTime || null,
    status: item.status ?? null,
    logisticsInfo: item.logisticsInfo || null
  }
}

function toOrderListItem(item: OrderRespVO): OrderListItem {
  return {
    id: item.id,
    orderNo: item.orderNo,
    userId: Number(item.userId || 0),
    receiverName: String(item.receiverName || '').trim(),
    receiverPhone: String(item.receiverPhone || '').trim(),
    receiverProvince: item.receiverProvince || null,
    receiverCity: item.receiverCity || null,
    receiverDistrict: item.receiverDistrict || null,
    receiverAddress: item.receiverAddress || null,
    totalAmount: Number(item.totalAmount || 0),
    freightAmount: Number(item.freightAmount || 0),
    discountAmount: Number(item.discountAmount || 0),
    payAmount: Number(item.payAmount || 0),
    status: Number(item.status || 5) as OrderStatus,
    statusDesc: item.statusDesc || null,
    remark: item.remark || null,
    createTime: item.createTime,
    updateTime: item.updateTime,
    items: (item.items || []).map(toOrderItem),
    payment: toPaymentInfo(item.payment),
    shipment: toShipmentInfo(item.shipment)
  }
}

function toOrderOperationLog(item: OrderOperationLogRespVO): OrderOperationLog {
  return {
    id: item.id,
    orderNo: item.orderNo,
    operatorId: item.operatorId ?? null,
    operatorName: item.operatorName || null,
    operationType: Number(item.operationType || 0),
    detail: item.detail || null,
    createTime: item.createTime
  }
}

function toOrderPageResponse(response: PageOrderRespVO): OrderPageResponse {
  return {
    records: (response.list || []).map(toOrderListItem),
    current: Number(response.pageNum || 1),
    size: Number(response.pageSize || 10),
    total: Number(response.total || 0),
    totalPage: Number(response.totalPage || 0)
  }
}

function toOrderStatusDistributionItem(
  item: OrderStatusDistributionRespVO
): OrderStatusDistributionItem {
  return {
    status: Number(item.status || 0),
    statusDesc: item.statusDesc || null,
    count: Number(item.count || 0)
  }
}

function toOrderQueryParams(params: OrderQueryParams) {
  return {
    pageNum: Number(params.current || 1),
    pageSize: Number(params.size || 10),
    orderBy: normalizeText(params.orderBy),
    sort: normalizeText(params.sort),
    orderNo: normalizeText(params.orderNo),
    userId: params.userId,
    receiverPhone: normalizeText(params.receiverPhone),
    status: params.status,
    payChannel: params.payChannel,
    paymentStatus: params.paymentStatus,
    createTimeStart: normalizeText(params.createTimeStart),
    createTimeEnd: normalizeText(params.createTimeEnd),
    payAmountMin: params.payAmountMin,
    payAmountMax: params.payAmountMax
  }
}

export function fetchOrderPage(params: OrderQueryParams): Promise<OrderPageResponse> {
  return request
    .get<PageOrderRespVO>({
      url: ORDER_BASE_PATH,
      params: toOrderQueryParams(params)
    })
    .then(toOrderPageResponse)
}

export function fetchOrderStatusDistributionStats(
  params?: Partial<OrderQueryParams>
): Promise<OrderStatusDistributionItem[]> {
  return request
    .get<OrderStatusDistributionRespVO[]>({
      url: `${ORDER_BASE_PATH}/stats/status-distribution`,
      params: params
        ? {
            orderNo: normalizeText(params.orderNo),
            userId: params.userId,
            receiverPhone: normalizeText(params.receiverPhone),
            payChannel: params.payChannel,
            paymentStatus: params.paymentStatus,
            createTimeStart: normalizeText(params.createTimeStart),
            createTimeEnd: normalizeText(params.createTimeEnd),
            payAmountMin: params.payAmountMin,
            payAmountMax: params.payAmountMax
          }
        : undefined
    })
    .then((list) => (list || []).map(toOrderStatusDistributionItem))
}

export function fetchOrderDetail(orderNo: string): Promise<OrderDetailItem> {
  return request
    .get<OrderRespVO>({
      url: `${ORDER_BASE_PATH}/${encodeURIComponent(orderNo)}`
    })
    .then(toOrderListItem)
}

export function fetchOrderOperationLogs(orderNo: string): Promise<OrderOperationLog[]> {
  return request
    .get<OrderOperationLogRespVO[]>({
      url: `${ORDER_BASE_PATH}/${encodeURIComponent(orderNo)}/operation-logs`
    })
    .then((list) => (list || []).map(toOrderOperationLog))
}

export function fetchOrderShipment(orderNo: string): Promise<OrderShipmentInfo | null> {
  return request
    .get<OrderShipmentRespVO>({
      url: `${ORDER_BASE_PATH}/${encodeURIComponent(orderNo)}/shipment`
    })
    .then((data) => toShipmentInfo(data))
}

export function forceCancelOrder(orderNo: string): Promise<number> {
  return request.post<number>({
    url: `${ORDER_BASE_PATH}/${encodeURIComponent(orderNo)}/force-cancel`,
    showSuccessMessage: true
  })
}

export function shipOrder(payload: OrderShipPayload): Promise<number> {
  return request.post<number>({
    url: `${ORDER_BASE_PATH}/shipments`,
    data: {
      orderNo: payload.orderNo,
      logisticsCompany: normalizeText(payload.logisticsCompany),
      logisticsCode: normalizeText(payload.logisticsCode),
      logisticsNo: normalizeText(payload.logisticsNo)
    },
    showSuccessMessage: true
  })
}

export function updateOrderRemark(payload: OrderRemarkPayload): Promise<number> {
  return request.put<number>({
    url: `${ORDER_BASE_PATH}/remark`,
    data: {
      orderNo: payload.orderNo,
      remark: normalizeText(payload.remark) || null
    },
    showSuccessMessage: true
  })
}

export function updateOrderAddress(payload: OrderAddressPayload): Promise<number> {
  return request.put<number>({
    url: `${ORDER_BASE_PATH}/address`,
    data: {
      orderNo: payload.orderNo,
      receiverName: normalizeText(payload.receiverName) || null,
      receiverPhone: normalizeText(payload.receiverPhone) || null,
      receiverProvince: normalizeText(payload.receiverProvince) || null,
      receiverCity: normalizeText(payload.receiverCity) || null,
      receiverDistrict: normalizeText(payload.receiverDistrict) || null,
      receiverAddress: normalizeText(payload.receiverAddress) || null
    },
    showSuccessMessage: true
  })
}

export function adjustOrderAmount(payload: OrderAmountPayload): Promise<number> {
  return request.put<number>({
    url: `${ORDER_BASE_PATH}/amount`,
    data: {
      orderNo: payload.orderNo,
      payAmount: Number(payload.payAmount || 0)
    },
    showSuccessMessage: true
  })
}
