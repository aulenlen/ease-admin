import request from '@/utils/http'

const ATTRIBUTE_BASE_PATH = '/api/v1/admin/attributes'

export type TemplateScope = 'spec' | 'param' | 'both'
export type TemplateMode = 'replace' | 'merge'

export interface TemplateSummary {
  addCount: number
  removeCount: number
  skipCount: number
}

export interface TemplateAttrSample {
  attrId: number
  attrName: string
  type: 0 | 1
  groupName?: string
}

export interface AttributeTemplatePreviewPayload {
  templateCategoryId: number
  targetCategoryId: number
  mode: TemplateMode
  scope: TemplateScope
}

export interface AttributeTemplatePreviewItem {
  summary: TemplateSummary
  addAttrIds?: number[]
  sampleAddList: TemplateAttrSample[]
  sampleRemoveList: TemplateAttrSample[]
  sampleSkipList: TemplateAttrSample[]
  traceId: string
}

export interface AttributeTemplateApplyPayload extends AttributeTemplatePreviewPayload {
  traceId: string
  selectedAddAttrIds?: number[]
}

interface AttributeTemplatePreviewRespVO {
  summary?: TemplateSummary
  addAttrIds?: number[]
  sampleAddList?: TemplateAttrSample[]
  sampleRemoveList?: TemplateAttrSample[]
  sampleSkipList?: TemplateAttrSample[]
  traceId?: string
}

function toTemplatePreviewItem(
  item?: AttributeTemplatePreviewRespVO | null
): AttributeTemplatePreviewItem {
  return {
    summary: {
      addCount: Number(item?.summary?.addCount || 0),
      removeCount: Number(item?.summary?.removeCount || 0),
      skipCount: Number(item?.summary?.skipCount || 0)
    },
    addAttrIds: item?.addAttrIds || [],
    sampleAddList: item?.sampleAddList || [],
    sampleRemoveList: item?.sampleRemoveList || [],
    sampleSkipList: item?.sampleSkipList || [],
    traceId: String(item?.traceId || '')
  }
}

export function previewAttributeTemplate(
  payload: AttributeTemplatePreviewPayload
): Promise<AttributeTemplatePreviewItem> {
  return request
    .post<AttributeTemplatePreviewRespVO>({
      url: `${ATTRIBUTE_BASE_PATH}/template-preview`,
      data: payload
    })
    .then(toTemplatePreviewItem)
}

export function applyAttributeTemplate(payload: AttributeTemplateApplyPayload): Promise<number> {
  return request.post<number>({
    url: `${ATTRIBUTE_BASE_PATH}/template-apply`,
    data: payload,
    showSuccessMessage: true
  })
}
