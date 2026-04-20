import type {
  MarketingContentBlock,
  MarketingContentBlockType,
  MarketingContentDocument,
  MarketingProductGroupBlock,
  MarketingSectionBlock
} from '@/types/api/marketing-content'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeText(value: unknown) {
  return String(value || '')
}

function normalizeBlockType(value: unknown): MarketingContentBlockType | null {
  switch (value) {
    case 'heading':
    case 'image':
    case 'lead':
    case 'paragraph':
    case 'productGroup':
    case 'section':
      return value
    case 'product_group':
      return 'productGroup'
    default:
      return null
  }
}

function normalizeHeadingLevel(value: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  const level = Number(value)
  if (level >= 1 && level <= 6) {
    return level as 1 | 2 | 3 | 4 | 5 | 6
  }
  return 2
}

function normalizeProductLayout(value: unknown): MarketingProductGroupBlock['layout'] {
  if (value === 'list' || value === 'carousel') {
    return value
  }
  return 'grid'
}

function normalizeSpuIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0))
  )
}

export function createArticleContentId(prefix = 'blk') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function slugifyArticleAnchor(value: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')

  return normalized.slice(0, 64)
}

export function createArticleContentBlock(type: MarketingContentBlockType): MarketingContentBlock {
  const id = createArticleContentId(type === 'section' ? 'sec' : 'blk')

  switch (type) {
    case 'heading':
      return { id, _type: type, level: 2, content: '' }
    case 'lead':
      return { id, _type: type, content: '' }
    case 'image':
      return {
        id,
        _type: type,
        url: '',
        alt: '',
        caption: ''
      }
    case 'productGroup':
      return {
        id,
        _type: type,
        title: '',
        layout: 'grid',
        spuIds: []
      }
    case 'section':
      return {
        id,
        _type: type,
        title: '',
        anchor: slugifyArticleAnchor(id)
      }
    case 'paragraph':
    default:
      return { id, _type: 'paragraph', content: '' }
  }
}

export function cloneArticleContentBlock(block: MarketingContentBlock): MarketingContentBlock {
  return {
    ...JSON.parse(JSON.stringify(block)),
    id: createArticleContentId(block._type === 'section' ? 'sec' : 'blk')
  } as MarketingContentBlock
}

export function createEmptyArticleContent(): MarketingContentDocument {
  return {
    version: 1,
    blocks: [createArticleContentBlock('paragraph')]
  }
}

function normalizeSectionBlock(value: Record<string, unknown>, id: string): MarketingSectionBlock {
  const title = normalizeText(value.title)
  const anchorSeed = normalizeText(value.anchor) || title || id

  return {
    id,
    _type: 'section',
    title,
    anchor: slugifyArticleAnchor(anchorSeed) || slugifyArticleAnchor(id)
  }
}

function normalizeBlock(value: unknown): MarketingContentBlock | null {
  if (!isRecord(value)) return null

  const type = normalizeBlockType(value._type)
  if (!type) return null

  const id = normalizeText(value.id) || createArticleContentId(type === 'section' ? 'sec' : 'blk')

  switch (type) {
    case 'heading':
      return {
        id,
        _type: 'heading',
        level: normalizeHeadingLevel(value.level),
        content: normalizeText(value.content)
      }
    case 'lead':
      return {
        id,
        _type: 'lead',
        content: normalizeText(value.content)
      }
    case 'paragraph':
      return {
        id,
        _type: 'paragraph',
        content: normalizeText(value.content)
      }
    case 'image':
      return {
        id,
        _type: 'image',
        url: normalizeText(value.url),
        alt: normalizeText(value.alt) || undefined,
        caption: normalizeText(value.caption) || undefined
      }
    case 'productGroup':
      return {
        id,
        _type: 'productGroup',
        title: normalizeText(value.title) || undefined,
        layout: normalizeProductLayout(value.layout),
        spuIds: normalizeSpuIds(value.spuIds)
      }
    case 'section':
      return normalizeSectionBlock(value, id)
    default:
      return null
  }
}

export function normalizeArticleContent(value: unknown): MarketingContentDocument {
  if (!isRecord(value)) {
    return createEmptyArticleContent()
  }

  const blocks = Array.isArray(value.blocks)
    ? value.blocks
        .map((item) => normalizeBlock(item))
        .filter((item): item is MarketingContentBlock => !!item)
    : []

  return {
    version: 1,
    blocks: blocks.length ? blocks : [createArticleContentBlock('paragraph')]
  }
}

export function cloneArticleContent(value: unknown): MarketingContentDocument {
  return JSON.parse(JSON.stringify(normalizeArticleContent(value))) as MarketingContentDocument
}

export function serializeArticleContent(value: unknown): string {
  return JSON.stringify(normalizeArticleContent(value))
}

export function collectContentSpuIds(value: unknown): number[] {
  const content = normalizeArticleContent(value)

  return Array.from(
    new Set(content.blocks.flatMap((block) => (block._type === 'productGroup' ? block.spuIds : [])))
  )
}
