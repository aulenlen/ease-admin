export interface MarketingHero {
  title: string
  subTitle?: string
  coverPic: string
}

export type MarketingContentBlockType =
  | 'heading'
  | 'image'
  | 'lead'
  | 'paragraph'
  | 'productGroup'
  | 'section'

export interface MarketingHeadingBlock {
  id: string
  _type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
}

export interface MarketingImageBlock {
  id: string
  _type: 'image'
  url: string
  alt?: string
  caption?: string
}

export interface MarketingLeadBlock {
  id: string
  _type: 'lead'
  content: string
}

export interface MarketingParagraphBlock {
  id: string
  _type: 'paragraph'
  content: string
}

export interface MarketingProductGroupBlock {
  id: string
  _type: 'productGroup'
  title?: string
  spuIds: number[]
  layout: 'grid' | 'list' | 'carousel'
}

export interface MarketingSectionBlock {
  id: string
  _type: 'section'
  anchor: string
  title: string
}

export type MarketingContentBlock =
  | MarketingHeadingBlock
  | MarketingImageBlock
  | MarketingLeadBlock
  | MarketingParagraphBlock
  | MarketingProductGroupBlock
  | MarketingSectionBlock

export interface MarketingContentDocument {
  version: 1
  blocks: MarketingContentBlock[]
}
