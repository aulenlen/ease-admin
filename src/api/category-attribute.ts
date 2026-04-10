import request from '@/utils/http'
import type { CategoryFlag01 } from './category'

const ATTRIBUTE_BASE_PATH = '/api/v1/admin/attributes'

export type CategoryAttributeType = 0 | 1

export interface CategoryAttributeQueryParams {
  current: number
  size: number
  keyword?: string
  type?: CategoryAttributeType
}

export interface CategoryAttributePoolItem {
  id: number
  name: string
  type: CategoryAttributeType
  unit?: string
  entryMethod: CategoryFlag01
  searchable: CategoryFlag01
  filterable: CategoryFlag01
  optionList: string[]
}

export interface CategoryAttributePoolPage {
  records: CategoryAttributePoolItem[]
  current: number
  size: number
  total: number
}

export interface CategoryAttributeRelationSavePayload {
  id?: number
  categoryId: number
  attrId: number
  groupName?: string
  sort?: number
  required?: CategoryFlag01
  options?: string[] | null
}

export interface CategoryAttributeRelationBatchUnbindPayload {
  categoryId: number
  attrIds: number[]
}

export interface CategoryAttributeSavePayload {
  id?: number
  name: string
  type: CategoryAttributeType
  unit?: string
  entryMethod?: CategoryFlag01
  searchable?: CategoryFlag01
  filterable?: CategoryFlag01
  optionList?: string[]
}

interface CategoryAttributePoolRespVO {
  id: number
  name: string
  type: CategoryAttributeType
  unit?: string
  entryMethod?: CategoryFlag01
  searchable?: CategoryFlag01
  filterable?: CategoryFlag01
  options?: string | string[]
  optionList?: string[] | string
}

interface CategoryAttributePageRespVO<T> {
  list?: T[]
  records?: T[]
  current?: number
  size?: number
  total?: number
}

function normalizeOptionList(optionList?: string[] | string): string[] {
  if (Array.isArray(optionList)) {
    return optionList.map((item) => String(item || '').trim()).filter(Boolean)
  }

  const rawText = String(optionList || '').trim()
  if (!rawText) return []

  try {
    const parsed = JSON.parse(rawText)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean)
    }
  } catch {
    // 后端返回普通字符串时，继续走分隔解析
  }

  return rawText
    .split(/[\n,，;；/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toCategoryAttributePoolItem(item: CategoryAttributePoolRespVO): CategoryAttributePoolItem {
  return {
    id: item.id,
    name: String(item.name || ''),
    type: Number(item.type ?? 0) as CategoryAttributeType,
    unit: item.unit,
    entryMethod: Number(item.entryMethod ?? 0) === 1 ? 1 : 0,
    searchable: Number(item.searchable ?? 0) === 1 ? 1 : 0,
    filterable: Number(item.filterable ?? 0) === 1 ? 1 : 0,
    optionList: normalizeOptionList(item.optionList ?? item.options)
  }
}

function buildCategoryAttributeQueryParams(params: CategoryAttributeQueryParams) {
  return {
    pageNum: params.current,
    pageSize: params.size,
    keyword: params.keyword || undefined,
    type: params.type
  }
}

function toCategoryAttributeSavePayload(
  payload: CategoryAttributeSavePayload,
  id = 0
): CategoryAttributeSavePayload {
  return {
    id,
    name: String(payload.name || '').trim(),
    type: Number(payload.type ?? 0) as CategoryAttributeType,
    unit: String(payload.unit || '').trim() || undefined,
    entryMethod: Number(payload.entryMethod ?? 0) === 1 ? 1 : 0,
    searchable: Number(payload.searchable ?? 0) === 1 ? 1 : 0,
    filterable: Number(payload.filterable ?? 0) === 1 ? 1 : 0,
    optionList: normalizeOptionList(payload.optionList)
  }
}

export function fetchCategoryAttributePool(
  params: CategoryAttributeQueryParams
): Promise<CategoryAttributePoolPage> {
  return request
    .get<CategoryAttributePageRespVO<CategoryAttributePoolRespVO>>({
      url: ATTRIBUTE_BASE_PATH,
      params: buildCategoryAttributeQueryParams(params)
    })
    .then((data) => {
      const records = data.records || data.list || []
      return {
        records: records.map(toCategoryAttributePoolItem),
        current: Number(data.current || params.current || 1),
        size: Number(data.size || params.size || 10),
        total: Number(data.total || 0)
      }
    })
}

export function getCategoryAttribute(id: number): Promise<CategoryAttributePoolItem> {
  return request
    .get<CategoryAttributePoolRespVO>({
      url: `${ATTRIBUTE_BASE_PATH}/${id}`
    })
    .then(toCategoryAttributePoolItem)
}

export function createCategoryAttribute(payload: CategoryAttributeSavePayload): Promise<number> {
  return request.post<number>({
    url: ATTRIBUTE_BASE_PATH,
    data: toCategoryAttributeSavePayload(payload, 0),
    showSuccessMessage: true
  })
}

export function updateCategoryAttribute(payload: CategoryAttributeSavePayload): Promise<number> {
  const id = Number(payload.id ?? 0)
  return request.put<number>({
    url: ATTRIBUTE_BASE_PATH,
    data: toCategoryAttributeSavePayload(payload, id),
    showSuccessMessage: true
  })
}

export function deleteCategoryAttribute(id: number): Promise<number> {
  return request.del<number>({
    url: `${ATTRIBUTE_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function deleteCategoryAttributeBatch(ids: number[]): Promise<number> {
  return request.del<number>({
    url: `${ATTRIBUTE_BASE_PATH}/batch`,
    data: ids,
    showSuccessMessage: true
  })
}

export function fetchUnboundCategoryAttributes(
  categoryId: number,
  params: CategoryAttributeQueryParams
): Promise<CategoryAttributePoolPage> {
  return request
    .get<CategoryAttributePageRespVO<CategoryAttributePoolRespVO>>({
      url: `${ATTRIBUTE_BASE_PATH}/unbound/categories/${categoryId}`,
      params: buildCategoryAttributeQueryParams(params)
    })
    .then((data) => {
      const records = data.records || data.list || []
      return {
        records: records.map(toCategoryAttributePoolItem),
        current: Number(data.current || params.current || 1),
        size: Number(data.size || params.size || 10),
        total: Number(data.total || 0)
      }
    })
}

export function bindCategoryAttributesBatch(
  categoryId: number,
  payloads: CategoryAttributeRelationSavePayload[]
): Promise<number> {
  return request.post<number>({
    url: `${ATTRIBUTE_BASE_PATH}/category-relations/batch/${categoryId}`,
    data: payloads
  })
}

export function updateCategoryAttributeRelation(
  payload: CategoryAttributeRelationSavePayload
): Promise<number> {
  return request.put<number>({
    url: `${ATTRIBUTE_BASE_PATH}/category-relations`,
    data: payload
  })
}

export function unbindCategoryAttribute(categoryId: number, attrId: number): Promise<number> {
  return request.del<number>({
    url: `${ATTRIBUTE_BASE_PATH}/category-relations`,
    params: { categoryId, attrId }
  })
}

export function unbindCategoryAttributeBatch(
  payload: CategoryAttributeRelationBatchUnbindPayload
): Promise<number> {
  return request.del<number>({
    url: `${ATTRIBUTE_BASE_PATH}/category-relations/batch`,
    data: payload
  })
}
