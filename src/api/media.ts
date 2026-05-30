import request from '@/utils/http'
import { useUserStore } from '@/store/modules/user'

const MEDIA_FILES_BASE_PATH = '/api/v1/admin/content/media/files'
const MEDIA_GROUPS_BASE_PATH = '/api/v1/admin/content/media/groups'

export type MediaType = 'IMAGE' | 'VIDEO' | 'OTHER'

export interface MediaGroupItem {
  id: number
  name: string
  sort: number
  createTime?: string
  updateTime?: string
}

export interface MediaGroupSavePayload {
  name: string
  sort?: number
}

export interface MediaFileItem {
  id: number
  groupId?: number
  hash?: string
  originalName: string
  url: string
  thumbnailUrl?: string
  mediaType: MediaType
  fileSize: number
  extension?: string
  creator?: string
  updater?: string
  createTime?: string
  updateTime?: string
}

export interface MediaUploadResponse extends MediaFileItem {
  objectName?: string
  reused?: boolean
}

export interface MediaPageResponse extends Api.Common.PaginatedResponse<MediaFileItem> {
  totalPage?: number
}

interface MediaGroupRespVO {
  id: number
  name?: string
  sort?: number
  createTime?: string
  updateTime?: string
}

interface MediaRespVO {
  id: number
  groupId?: number | null
  hash?: string
  originalName?: string
  url?: string
  thumbnailUrl?: string
  mediaType?: MediaType
  fileSize?: number
  extension?: string
  creator?: string
  updater?: string
  createTime?: string
  updateTime?: string
}

interface MediaUploadRespVO extends MediaRespVO {
  objectName?: string
  reused?: boolean
}

interface PageMediaRespVO {
  pageNum: number
  pageSize: number
  totalPage?: number
  total: number
  list: MediaRespVO[]
}

export interface MediaQueryParams {
  current: number
  size: number
  groupId?: number
  mediaType?: MediaType
  keyword?: string
  orderBy?: string
  sort?: string
}

function toMediaPageParams(params: MediaQueryParams) {
  return {
    pageNum: params.current,
    pageSize: params.size,
    groupId: params.groupId,
    mediaType: params.mediaType,
    keyword: params.keyword || undefined,
    orderBy: params.orderBy || undefined,
    sort: params.sort || undefined
  }
}

function toMediaGroupItem(item: MediaGroupRespVO): MediaGroupItem {
  return {
    id: item.id,
    name: item.name || '',
    sort: Number(item.sort ?? 0),
    createTime: item.createTime,
    updateTime: item.updateTime
  }
}

function toMediaFileItem(item: MediaRespVO): MediaFileItem {
  return {
    id: item.id,
    groupId: item.groupId ?? undefined,
    hash: item.hash,
    originalName: item.originalName || '',
    url: item.url || '',
    thumbnailUrl: item.thumbnailUrl,
    mediaType: item.mediaType || 'OTHER',
    fileSize: Number(item.fileSize ?? 0),
    extension: item.extension,
    creator: item.creator,
    updater: item.updater,
    createTime: item.createTime,
    updateTime: item.updateTime
  }
}

function toMediaUploadResponse(item: MediaUploadRespVO): MediaUploadResponse {
  return {
    ...toMediaFileItem(item),
    objectName: item.objectName,
    reused: item.reused
  }
}

function toMediaPageResponse(response: PageMediaRespVO): MediaPageResponse {
  return {
    records: (response.list || []).map(toMediaFileItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0,
    totalPage: response.totalPage
  }
}

function toMediaGroupSaveReqVO(payload: MediaGroupSavePayload) {
  return {
    name: String(payload.name || '').trim(),
    sort: Number(payload.sort ?? 0)
  }
}

function buildMediaDownloadUrl(id: number) {
  const baseURL = String(import.meta.env.VITE_API_URL || '/')
  const path = `${MEDIA_FILES_BASE_PATH}/${id}/download`

  if (!baseURL || baseURL === '/') return path

  return `${baseURL.replace(/\/$/, '')}${path}`
}

export function fetchMediaPage(params: MediaQueryParams) {
  return request
    .get<PageMediaRespVO>({
      url: MEDIA_FILES_BASE_PATH,
      params: toMediaPageParams(params)
    })
    .then(toMediaPageResponse)
}

export function fetchMediaGroups() {
  return request
    .get<MediaGroupRespVO[]>({
      url: MEDIA_GROUPS_BASE_PATH
    })
    .then((list) => (list || []).map(toMediaGroupItem))
}

export function getMediaGroup(id: number) {
  return request
    .get<MediaGroupRespVO>({
      url: `${MEDIA_GROUPS_BASE_PATH}/${id}`
    })
    .then(toMediaGroupItem)
}

export function createMediaGroup(payload: MediaGroupSavePayload) {
  return request.post<number>({
    url: MEDIA_GROUPS_BASE_PATH,
    data: toMediaGroupSaveReqVO(payload),
    showSuccessMessage: true
  })
}

export function updateMediaGroup(id: number, payload: MediaGroupSavePayload) {
  return request.put<number>({
    url: `${MEDIA_GROUPS_BASE_PATH}/${id}`,
    data: toMediaGroupSaveReqVO(payload),
    showSuccessMessage: true
  })
}

export function deleteMediaGroup(id: number) {
  return request.del<number>({
    url: `${MEDIA_GROUPS_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function getMediaFile(id: number) {
  return request
    .get<MediaRespVO>({
      url: `${MEDIA_FILES_BASE_PATH}/${id}`
    })
    .then(toMediaFileItem)
}

export function uploadMedia(file: File, groupId?: number) {
  const formData = new FormData()
  formData.append('file', file)

  return request
    .post<MediaUploadRespVO>({
      url: MEDIA_FILES_BASE_PATH,
      params: { groupId },
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(toMediaUploadResponse)
}

export function deleteMediaFile(id: number) {
  return request.del<number>({
    url: `${MEDIA_FILES_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function moveMediaFile(id: number, groupId: number | null) {
  return request.put<number>({
    url: `${MEDIA_FILES_BASE_PATH}/${id}/group`,
    data: { groupId },
    showSuccessMessage: true
  })
}

export async function downloadMediaFile(id: number) {
  const { accessToken } = useUserStore()
  const response = await fetch(buildMediaDownloadUrl(id), {
    method: 'GET',
    credentials: import.meta.env.VITE_WITH_CREDENTIALS === 'true' ? 'include' : 'same-origin',
    headers: accessToken ? { Authorization: accessToken } : undefined
  })

  if (!response.ok) {
    throw new Error('下载素材失败')
  }

  return response.blob()
}
