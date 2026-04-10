import request from '@/utils/http'
import type { CategoryFlag01 } from './category'

const CATEGORY_BASE_PATH = '/api/v1/admin/categories'

export type CategoryAttributeType = 0 | 1

export interface CategoryAttributeRelationItem {
  relationId: number
  attrId: number
  attrName: string
  type: CategoryAttributeType
  unit?: string
  entryMethod?: CategoryFlag01
  searchable?: CategoryFlag01
  filterable?: CategoryFlag01
  groupName?: string
  sort?: number
  required?: CategoryFlag01
  optionList?: string[]
  globalOptions?: string
  categoryOptions?: string
}

export interface CategoryWorkbenchSnapshot {
  categoryId: number
  categoryName: string
  parentId: number
  path?: string
  level: number
  isLeaf: boolean
  specs: CategoryAttributeRelationItem[]
  params: CategoryAttributeRelationItem[]
  traceId?: string
}

interface CategoryAttributeRelationRespVO {
  relationId: number
  attrId: number
  attrName: string
  type: CategoryAttributeType
  unit?: string
  entryMethod?: CategoryFlag01
  searchable?: CategoryFlag01
  filterable?: CategoryFlag01
  groupName?: string
  sort?: number
  required?: CategoryFlag01
  optionList?: string[] | string
  globalOptions?: string
  categoryOptions?: string
}

interface CategoryWorkbenchSnapshotRespVO {
  categoryId: number
  categoryName: string
  parentId: number
  path?: string
  level: number
  isLeaf: boolean
  specs?: CategoryAttributeRelationRespVO[]
  params?: CategoryAttributeRelationRespVO[]
  traceId?: string
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
    // 后端有时会返回普通字符串，这里继续走分隔解析
  }

  return rawText
    .split(/[\n,，;；/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toCategoryAttributeRelationItem(
  item: CategoryAttributeRelationRespVO
): CategoryAttributeRelationItem {
  return {
    relationId: item.relationId,
    attrId: item.attrId,
    attrName: item.attrName,
    type: item.type,
    unit: item.unit,
    entryMethod: item.entryMethod,
    searchable: item.searchable,
    filterable: item.filterable,
    groupName: item.groupName,
    sort: item.sort,
    required: item.required,
    optionList: normalizeOptionList(item.optionList),
    globalOptions: item.globalOptions,
    categoryOptions: item.categoryOptions
  }
}

function toCategoryWorkbenchSnapshot(
  item: CategoryWorkbenchSnapshotRespVO
): CategoryWorkbenchSnapshot {
  return {
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    parentId: item.parentId,
    path: item.path,
    level: item.level,
    isLeaf: Boolean(item.isLeaf),
    specs: (item.specs || []).map(toCategoryAttributeRelationItem),
    params: (item.params || []).map(toCategoryAttributeRelationItem),
    traceId: item.traceId
  }
}

export function fetchCategoryWorkbenchSnapshot(
  categoryId: number
): Promise<CategoryWorkbenchSnapshot> {
  return request
    .get<CategoryWorkbenchSnapshotRespVO>({
      url: `${CATEGORY_BASE_PATH}/${categoryId}/snapshot`
    })
    .then(toCategoryWorkbenchSnapshot)
}
