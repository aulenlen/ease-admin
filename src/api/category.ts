import request from '@/utils/http'

export type CategoryFlag01 = 0 | 1

const CATEGORY_BASE_PATH = '/api/v1/admin/categories'

export interface CategoryQueryParams {
  keyword?: string
  parentId?: number
  level?: number
  enableStatus?: CategoryFlag01
  isNav?: CategoryFlag01
  tree?: boolean
  includeDescendants?: boolean
}

export interface CategorySavePayload {
  id?: number
  parentId: number
  name: string
  enableStatus?: CategoryFlag01
  isNav?: CategoryFlag01
  sort?: number
  icon?: string
  image?: string
  keywords?: string
  description?: string
}

export interface CategorySortItem {
  id: number
  sort: number
}

export interface CategorySortPayload {
  parentId: number
  items: CategorySortItem[]
}

export interface CategoryTreeItem {
  id: number
  parentId: number
  name: string
  level: number
  enableStatus: CategoryFlag01
  isNav: CategoryFlag01
  sort: number
  icon?: string
  image?: string
  children?: CategoryTreeItem[]
}

export interface CategoryDetailItem extends CategoryTreeItem {
  parentName?: string
  path?: string
  keywords?: string
  description?: string
  createTime?: string
  updateTime?: string
  creator?: string
  updater?: string
}

interface CategoryTreeRespVO {
  id: number
  parentId: number
  name: string
  level: number
  enableStatus: CategoryFlag01
  isNav: CategoryFlag01
  sort: number
  icon?: string
  image?: string
  children?: CategoryTreeRespVO[]
}

interface CategoryDetailRespVO extends CategoryTreeRespVO {
  parentName?: string
  path?: string
  keywords?: string
  description?: string
  createTime?: string
  updateTime?: string
  creator?: string
  updater?: string
}

interface CategorySaveReqVO {
  id: number
  parentId: number
  name: string
  enableStatus?: CategoryFlag01
  isNav?: CategoryFlag01
  sort?: number
  icon?: string
  image?: string
  keywords?: string
  description?: string
}

function toCategoryTreeItem(item: CategoryTreeRespVO): CategoryTreeItem {
  return {
    id: item.id,
    parentId: item.parentId,
    name: item.name,
    level: item.level,
    enableStatus: item.enableStatus,
    isNav: item.isNav,
    sort: item.sort,
    icon: item.icon,
    image: item.image,
    children: item.children?.map(toCategoryTreeItem)
  }
}

function toCategoryDetailItem(item: CategoryDetailRespVO): CategoryDetailItem {
  return {
    ...toCategoryTreeItem(item),
    parentName: item.parentName,
    path: item.path,
    keywords: item.keywords,
    description: item.description,
    createTime: item.createTime,
    updateTime: item.updateTime,
    creator: item.creator,
    updater: item.updater
  }
}

function buildCategoryQueryParams(params?: CategoryQueryParams) {
  return {
    keyword: params?.keyword || undefined,
    parentId: params?.parentId,
    level: params?.level,
    enableStatus: params?.enableStatus,
    isNav: params?.isNav,
    tree: params?.tree,
    includeDescendants: params?.includeDescendants
  }
}

function toCategorySaveReqVO(payload: CategorySavePayload, id = 0): CategorySaveReqVO {
  return {
    id,
    parentId: Number(payload.parentId ?? 0),
    name: String(payload.name || '').trim(),
    enableStatus: Number(payload.enableStatus ?? 1) as CategoryFlag01,
    isNav: Number(payload.isNav ?? 1) as CategoryFlag01,
    sort: Number(payload.sort ?? 0),
    icon: String(payload.icon || '').trim() || undefined,
    image: String(payload.image || '').trim() || undefined,
    keywords: String(payload.keywords || '').trim() || undefined,
    description: String(payload.description || '').trim() || undefined
  }
}

export function fetchCategoryTree(params?: CategoryQueryParams): Promise<CategoryTreeItem[]> {
  return request
    .get<CategoryTreeRespVO[]>({
      url: `${CATEGORY_BASE_PATH}/tree/query`,
      params: buildCategoryQueryParams(params)
    })
    .then((list) => (list || []).map(toCategoryTreeItem))
}

export function getCategory(id: number): Promise<CategoryDetailItem> {
  return request
    .get<CategoryDetailRespVO>({
      url: `${CATEGORY_BASE_PATH}/${id}`
    })
    .then(toCategoryDetailItem)
}

export function createCategory(payload: CategorySavePayload): Promise<number> {
  return request.post<number>({
    url: CATEGORY_BASE_PATH,
    data: toCategorySaveReqVO(payload, 0),
    showSuccessMessage: true
  })
}

export function updateCategory(payload: CategorySavePayload): Promise<number> {
  const id = Number(payload.id ?? 0)
  return request.put<number>({
    url: CATEGORY_BASE_PATH,
    data: toCategorySaveReqVO(payload, id),
    showSuccessMessage: true
  })
}

export function updateCategorySort(payload: CategorySortPayload): Promise<number> {
  return request.put<number>({
    url: `${CATEGORY_BASE_PATH}/sort`,
    data: {
      parentId: Number(payload.parentId ?? 0),
      items: (payload.items || []).map((item) => ({
        id: Number(item.id),
        sort: Number(item.sort ?? 0)
      }))
    }
  })
}

export function updateCategoryEnableStatus(
  id: number,
  enableStatus: CategoryFlag01
): Promise<number> {
  return request.put<number>({
    url: `${CATEGORY_BASE_PATH}/${id}/enable-status`,
    params: { enableStatus },
    showSuccessMessage: true
  })
}

export function deleteCategory(id: number): Promise<number> {
  return request.del<number>({
    url: `${CATEGORY_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}
