import request from '@/utils/http'
import type { MarketingContentDocument } from '@/types/api/marketing-content'
import { normalizeArticleContent } from '@/utils/article-content'

export const ARTICLE_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  UNPUBLISHED: 2
} as const

export type ArticleStatus = (typeof ARTICLE_STATUS)[keyof typeof ARTICLE_STATUS]

export const ARTICLE_STATUS_OPTIONS = [
  { value: ARTICLE_STATUS.DRAFT, label: '草稿' },
  { value: ARTICLE_STATUS.PUBLISHED, label: '已发布' },
  { value: ARTICLE_STATUS.UNPUBLISHED, label: '已下架' }
] as const

export type ArticleContentDocument = MarketingContentDocument

export interface ArticleQueryParams {
  current: number
  size: number
  keyword?: string
  status?: ArticleStatus | ''
  orderBy?: string
  sort?: string
}

export interface ArticleListItem {
  id: number
  title: string
  subTitle?: string
  coverPic?: string
  categoryLabel?: string
  author?: string
  sort?: number
  status: number
  publishTime?: string
  createTime?: string
  updateTime?: string
  spuIds?: number[]
}

export interface ArticleSavePayload {
  title: string
  subTitle?: string
  coverPic?: string
  content: ArticleContentDocument
  categoryLabel?: string
  author?: string
  sort?: number
  status?: number
}

export interface ArticleDetailItem extends ArticleListItem {
  content: ArticleContentDocument
  editorSchemaVersion?: number
}

export interface ArticlePageResponse extends Api.Common.PaginatedResponse<ArticleListItem> {
  totalPage?: number
}

const ARTICLE_BASE_PATH = '/api/v1/admin/content/articles'

interface ArticleRespVO {
  id: number
  title: string
  subTitle?: string
  coverPic?: string
  content: ArticleContentDocument
  editorSchemaVersion?: number
  categoryLabel?: string
  author?: string
  sort?: number
  status: number
  publishTime?: string
  createTime?: string
  updateTime?: string
  spuIds?: number[]
}

interface PageArticleRespVO {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: ArticleRespVO[]
}

interface ArticleReqVO {
  title: string
  subTitle?: string
  coverPic?: string
  content: {
    version: 1
    blocks: unknown[]
  }
  editorSchemaVersion: 1
  categoryLabel?: string
  author?: string
  sort?: number
  status?: number
}

interface ArticleStatusBatchReqVO {
  ids: number[]
  status: number
}

function toArticleListItem(item: ArticleRespVO): ArticleListItem {
  return {
    id: item.id,
    title: item.title,
    subTitle: item.subTitle,
    coverPic: item.coverPic,
    categoryLabel: item.categoryLabel,
    author: item.author,
    sort: item.sort,
    status: item.status,
    publishTime: item.publishTime,
    createTime: item.createTime,
    updateTime: item.updateTime,
    spuIds: item.spuIds
  }
}

function toArticleDetailItem(item: ArticleRespVO): ArticleDetailItem {
  return {
    ...toArticleListItem(item),
    editorSchemaVersion: item.editorSchemaVersion,
    content: normalizeArticleContent(item.content)
  }
}

function toArticlePageResponse(response: PageArticleRespVO): ArticlePageResponse {
  return {
    records: (response.list || []).map(toArticleListItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0,
    totalPage: response.totalPage
  }
}

function toArticleQueryParams(params: ArticleQueryParams) {
  return {
    pageNum: params.current,
    pageSize: params.size,
    keyword: params.keyword || undefined,
    status: params.status === '' ? undefined : params.status,
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined
  }
}

function toArticleReqContentDocument(content: ArticleContentDocument) {
  const normalized = normalizeArticleContent(content)

  return {
    version: 1 as const,
    blocks: normalized.blocks.map((block) =>
      block._type === 'productGroup' ? { ...block, _type: 'product_group' } : block
    )
  }
}

function toArticleReqVO(payload: ArticleSavePayload): ArticleReqVO {
  return {
    title: String(payload.title || '').trim(),
    subTitle: String(payload.subTitle || '').trim() || undefined,
    coverPic: String(payload.coverPic || '').trim() || undefined,
    content: toArticleReqContentDocument(payload.content),
    editorSchemaVersion: 1,
    categoryLabel: String(payload.categoryLabel || '').trim() || undefined,
    author: String(payload.author || '').trim() || undefined,
    sort: payload.sort,
    status: payload.status
  }
}

export function fetchArticlePage(params: ArticleQueryParams) {
  return request
    .get<PageArticleRespVO>({
      url: ARTICLE_BASE_PATH,
      params: toArticleQueryParams(params)
    })
    .then(toArticlePageResponse)
}

export function getArticle(id: number) {
  return request
    .get<ArticleRespVO>({
      url: `${ARTICLE_BASE_PATH}/${id}`
    })
    .then(toArticleDetailItem)
}

export function createArticle(payload: ArticleSavePayload) {
  return request.post<number>({
    url: ARTICLE_BASE_PATH,
    data: toArticleReqVO(payload),
    showSuccessMessage: true
  })
}

export function updateArticle(id: number, payload: ArticleSavePayload) {
  return request.put<number>({
    url: `${ARTICLE_BASE_PATH}/${id}`,
    data: toArticleReqVO(payload),
    showSuccessMessage: true
  })
}

export function updateArticleStatus(ids: number[], status: number) {
  const payload: ArticleStatusBatchReqVO = {
    ids,
    status
  }

  return request.put<number>({
    url: `${ARTICLE_BASE_PATH}/status`,
    data: payload,
    showSuccessMessage: true
  })
}

export function deleteArticle(id: number) {
  return request.del<number>({
    url: `${ARTICLE_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}
