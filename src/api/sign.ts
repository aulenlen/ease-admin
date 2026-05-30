import request from '@/utils/http'

const SIGN_BASE_PATH = '/api/v1/admin/sign'

export type SignEnableStatus = 0 | 1
export type SignRewardStatus = 0 | 1 | 2

export interface SignRulePayload {
  id?: number
  continuousDays: number
  integration?: number
  growth?: number
  remark?: string
  enableStatus?: SignEnableStatus
}

export interface SignRuleItem extends Required<Omit<SignRulePayload, 'id'>> {
  id: number
  createTime?: string
  updateTime?: string
}

export interface SignRecordQueryParams {
  current: number
  size: number
  memberId?: string
  dateFrom?: string
  dateTo?: string
  rewardStatus?: SignRewardStatus
  orderBy?: string
  sort?: string
}

export interface SignRecordItem {
  id: number
  memberId: number
  signDate: string
  continuousDays: number
  integration: number
  growth: number
  rewardStatus: SignRewardStatus
  rewardBizKey?: string
  createTime?: string
}

interface SignPageRespVO<T> {
  pageNum?: number
  pageSize?: number
  totalPage?: number
  total?: number
  list?: T[]
}

function normalizeText(value?: string | null) {
  const text = String(value || '').trim()
  return text
}

function toRulePayload(payload: SignRulePayload, id?: number) {
  return {
    id,
    continuousDays: Number(payload.continuousDays || 1),
    integration: Number(payload.integration || 0),
    growth: Number(payload.growth || 0),
    remark: normalizeText(payload.remark),
    enableStatus: Number(payload.enableStatus ?? 1) === 1 ? 1 : 0
  }
}

export function fetchSignRuleList() {
  return request.get<SignRuleItem[]>({
    url: `${SIGN_BASE_PATH}/rules`
  })
}

export function getSignRule(id: number) {
  return request.get<SignRuleItem>({
    url: `${SIGN_BASE_PATH}/rules/${id}`
  })
}

export function createSignRule(payload: SignRulePayload) {
  return request.post<number>({
    url: `${SIGN_BASE_PATH}/rules`,
    data: toRulePayload(payload),
    showSuccessMessage: true
  })
}

export function updateSignRule(id: number, payload: SignRulePayload) {
  return request.put<number>({
    url: `${SIGN_BASE_PATH}/rules`,
    data: toRulePayload(payload, id),
    showSuccessMessage: true
  })
}

export function deleteSignRule(id: number) {
  return request.del<number>({
    url: `${SIGN_BASE_PATH}/rules/${id}`,
    showSuccessMessage: true
  })
}

export function fetchSignRecordPage(params: SignRecordQueryParams) {
  return request
    .get<SignPageRespVO<SignRecordItem>>({
      url: `${SIGN_BASE_PATH}/records`,
      params: {
        pageNum: params.current,
        pageSize: params.size,
        memberId: normalizeText(params.memberId),
        dateFrom: normalizeText(params.dateFrom),
        dateTo: normalizeText(params.dateTo),
        rewardStatus: params.rewardStatus,
        orderBy: normalizeText(params.orderBy),
        sort: normalizeText(params.sort)
      }
    })
    .then((res) => ({
      records: res.list || [],
      current: Number(res.pageNum || 1),
      size: Number(res.pageSize || 10),
      total: Number(res.total || 0),
      totalPage: Number(res.totalPage || 0)
    }))
}
