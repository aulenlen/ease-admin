import request from '@/utils/http'

const MEDIA_FILES_BASE_PATH = '/api/v1/admin/content/media/files'

export interface MediaUploadResponse {
  url: string
  objectName: string
}

export function uploadMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post<MediaUploadResponse>({
    url: MEDIA_FILES_BASE_PATH,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
