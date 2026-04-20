<template>
  <div class="article-content-editor">
    <div class="article-content-editor__head">
      <div class="min-w-0">
        <div class="article-content-editor__title">正文内容</div>
        <div class="article-content-editor__hint"
          >统一按正文块编排标题、导语、图片、章节和商品组。</div
        >
      </div>

      <div class="article-content-editor__chips">
        <button
          v-for="chip in blockChips"
          :key="chip.type"
          type="button"
          class="article-content-editor__chip"
          :disabled="disabled"
          @click="appendBlock(chip.type)"
        >
          <ArtSvgIcon :icon="chip.icon" class="article-content-editor__chip-icon" />
          <span>{{ chip.label }}</span>
        </button>
      </div>
    </div>

    <VueDraggable
      v-model="blocksModel"
      handle=".article-content-editor__drag-handle"
      :animation="180"
      ghost-class="article-content-editor__block--ghost"
      drag-class="article-content-editor__block--drag"
      :disabled="disabled"
      class="article-content-editor__body"
    >
      <div
        v-for="(block, index) in blocksModel"
        :key="block.id"
        :class="['article-content-editor__block', `is-${block._type}`]"
      >
        <div class="article-content-editor__drag-col">
          <button
            type="button"
            class="article-content-editor__drag-handle"
            :disabled="disabled"
            aria-label="拖拽排序"
          >
            <ArtSvgIcon icon="ri:drag-move-2-fill" class="article-content-editor__drag-icon" />
          </button>
        </div>

        <div class="article-content-editor__block-main">
          <div class="article-content-editor__block-head">
            <div class="article-content-editor__block-meta">
              <span class="article-content-editor__block-index">#{{ index + 1 }}</span>
              <div class="article-content-editor__block-type">
                <ArtSvgIcon
                  :icon="blockTypeMeta[block._type].icon"
                  class="article-content-editor__block-type-icon"
                />
                <span>{{ blockTypeMeta[block._type].label }}</span>
              </div>

              <ElSelect
                v-if="block._type === 'heading'"
                :model-value="block.level"
                :disabled="disabled"
                class="article-content-editor__heading-level"
                @update:model-value="updateHeadingLevel(index, $event as 1 | 2 | 3 | 4 | 5 | 6)"
              >
                <ElOption
                  v-for="item in headingLevelOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </ElSelect>
            </div>

            <div class="article-content-editor__block-tools">
              <button
                type="button"
                class="article-content-editor__tool"
                :disabled="disabled"
                aria-label="复制"
                @click="duplicateBlock(index)"
              >
                <ArtSvgIcon icon="ri:file-copy-line" />
              </button>
              <button
                type="button"
                class="article-content-editor__tool article-content-editor__tool--danger"
                :disabled="disabled || blocksModel.length === 1"
                aria-label="删除"
                @click="removeBlock(index)"
              >
                <ArtSvgIcon icon="ri:delete-bin-line" />
              </button>
            </div>
          </div>

          <template v-if="block._type === 'heading'">
            <ElInput
              :model-value="block.content"
              :disabled="disabled"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 1, maxRows: 6 }"
              maxlength="500"
              :placeholder="headingPlaceholderMap[block.level]"
              class="article-content-editor__heading-input"
              :class="`is-h${block.level}`"
              @update:model-value="updateTextBlock(index, $event)"
            />
          </template>

          <template v-else-if="block._type === 'lead' || block._type === 'paragraph'">
            <ElInput
              :model-value="block.content"
              :disabled="disabled"
              type="textarea"
              resize="none"
              :class="[
                'article-content-editor__textarea',
                block._type === 'lead' ? 'is-lead' : 'is-paragraph'
              ]"
              :autosize="{ minRows: block._type === 'lead' ? 3 : 5, maxRows: 16 }"
              :maxlength="block._type === 'lead' ? 1000 : 5000"
              :placeholder="block._type === 'lead' ? '输入导语内容' : '输入正文内容'"
              @update:model-value="updateTextBlock(index, $event)"
            />
          </template>

          <template v-else-if="block._type === 'image'">
            <div class="article-content-editor__image">
              <div class="article-content-editor__image-uploader">
                <SpuImageUploader
                  :model-value="block.url ? [block.url] : []"
                  :limit="1"
                  tip="建议宽图，支持 jpg/png"
                  @update:model-value="updateImageBlock(index, $event)"
                />
              </div>

              <div class="article-content-editor__grid">
                <ElInput
                  :model-value="block.alt || ''"
                  :disabled="disabled"
                  maxlength="255"
                  placeholder="替代文本，可选"
                  @update:model-value="updateImageAlt(index, $event)"
                />
                <ElInput
                  :model-value="block.caption || ''"
                  :disabled="disabled"
                  maxlength="255"
                  placeholder="图片说明，可选"
                  @update:model-value="updateImageCaption(index, $event)"
                />
              </div>
            </div>
          </template>

          <template v-else-if="block._type === 'section'">
            <div class="article-content-editor__grid">
              <ElInput
                :model-value="block.title"
                :disabled="disabled"
                maxlength="255"
                placeholder="章节标题"
                @update:model-value="updateSectionTitle(index, $event)"
              />
              <ElInput
                :model-value="block.anchor"
                :disabled="disabled"
                maxlength="64"
                placeholder="章节锚点，例如 living-room"
                @update:model-value="updateSectionAnchor(index, $event)"
              />
            </div>
          </template>

          <template v-else-if="block._type === 'productGroup'">
            <div class="article-content-editor__grid">
              <ElInput
                :model-value="block.title || ''"
                :disabled="disabled"
                maxlength="255"
                placeholder="商品组标题，可选"
                @update:model-value="updateProductGroupTitle(index, $event)"
              />

              <ElSelect
                :model-value="block.layout"
                :disabled="disabled"
                placeholder="选择布局"
                @update:model-value="
                  updateProductGroupLayout(index, $event as 'grid' | 'list' | 'carousel')
                "
              >
                <ElOption
                  v-for="item in productLayoutOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </ElSelect>
            </div>

            <div class="article-content-editor__product-row">
              <div class="article-content-editor__product-summary">
                <ElTag effect="light" round size="small"
                  >已选 {{ block.spuIds.length }} 个商品</ElTag
                >
                <span class="article-content-editor__product-layout">
                  布局：{{ productLayoutLabelMap[block.layout] }}
                </span>
              </div>

              <div class="article-content-editor__product-actions">
                <ElButton size="small" @click="emit('pick-products', index)">选择商品</ElButton>
                <ElButton
                  v-if="block.spuIds.length"
                  size="small"
                  text
                  @click="clearProductGroup(index)"
                >
                  清空
                </ElButton>
              </div>
            </div>

            <div v-if="block.spuIds.length" class="article-content-editor__tag-list">
              <ElTag
                v-for="spuId in block.spuIds"
                :key="`${block.id}_${spuId}`"
                closable
                effect="light"
                round
                @close="removeProductId(index, spuId)"
              >
                {{ resolveProductName(spuId) }}
              </ElTag>
            </div>
            <ElEmpty v-else :image-size="48" description="暂未选择商品" class="py-4" />
          </template>
        </div>
      </div>
    </VueDraggable>

    <div v-if="!blocksModel.length" class="article-content-editor__empty">
      还没有任何内容块，点击上方按钮开始搭建正文。
    </div>
  </div>
</template>

<script setup lang="ts">
  import { VueDraggable } from 'vue-draggable-plus'
  import type {
    MarketingContentBlock,
    MarketingContentDocument
  } from '@/types/api/marketing-content'
  import {
    cloneArticleContent,
    cloneArticleContentBlock,
    createArticleContentBlock,
    serializeArticleContent,
    slugifyArticleAnchor
  } from '@/utils/article-content'
  import SpuImageUploader from '@/views/product/spu/modules/spu-image-uploader.vue'

  defineOptions({ name: 'ArticleContentEditor' })

  interface ProductPreviewOption {
    id: number
    name: string
  }

  interface Props {
    modelValue: MarketingContentDocument
    disabled?: boolean
    products?: Record<number, ProductPreviewOption>
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    products: () => ({})
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: MarketingContentDocument): void
    (e: 'pick-products', blockIndex: number): void
  }>()

  const blockTypeMeta: Record<MarketingContentBlock['_type'], { label: string; icon: string }> = {
    heading: { label: '标题', icon: 'ri:heading' },
    lead: { label: '导语', icon: 'ri:text-wrap' },
    paragraph: { label: '段落', icon: 'ri:paragraph' },
    image: { label: '图片', icon: 'ri:image-line' },
    section: { label: '章节', icon: 'ri:hashtag' },
    productGroup: { label: '商品组', icon: 'ri:shopping-bag-3-line' }
  }

  const blockChips: Array<{
    type: MarketingContentBlock['_type']
    label: string
    icon: string
  }> = [
    { type: 'lead', label: '导语', icon: 'ri:text-wrap' },
    { type: 'heading', label: '标题', icon: 'ri:heading' },
    { type: 'paragraph', label: '段落', icon: 'ri:paragraph' },
    { type: 'image', label: '图片', icon: 'ri:image-line' },
    { type: 'section', label: '章节', icon: 'ri:hashtag' },
    { type: 'productGroup', label: '商品组', icon: 'ri:shopping-bag-3-line' }
  ]

  const productLayoutOptions = [
    { value: 'grid' as const, label: '网格' },
    { value: 'list' as const, label: '列表' },
    { value: 'carousel' as const, label: '横滑' }
  ]

  const productLayoutLabelMap = {
    grid: '网格',
    list: '列表',
    carousel: '横滑'
  } as const

  const headingLevelOptions = [
    { value: 1 as const, label: 'H1 标题' },
    { value: 2 as const, label: 'H2 标题' },
    { value: 3 as const, label: 'H3 标题' },
    { value: 4 as const, label: 'H4 标题' },
    { value: 5 as const, label: 'H5 标题' },
    { value: 6 as const, label: 'H6 标题' }
  ]

  const headingPlaceholderMap: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
    1: '输入主标题',
    2: '输入分段标题',
    3: '输入次级标题',
    4: '输入辅助标题',
    5: '输入补充标题',
    6: '输入尾部标题'
  }

  const localContent = ref<MarketingContentDocument>(cloneArticleContent(props.modelValue))
  const lastSignature = ref(serializeArticleContent(localContent.value))

  const commitContent = () => {
    const nextValue = cloneArticleContent(localContent.value)
    const nextSignature = serializeArticleContent(nextValue)

    localContent.value = nextValue
    lastSignature.value = nextSignature
    emit('update:modelValue', nextValue)
  }

  const blocksModel = computed<MarketingContentBlock[]>({
    get: () => localContent.value.blocks,
    set: (value) => {
      localContent.value = {
        ...localContent.value,
        blocks: value
      }
      commitContent()
    }
  })

  const mutateBlocks = (mutator: (blocks: MarketingContentBlock[]) => void) => {
    if (props.disabled) return

    const nextBlocks = localContent.value.blocks.map(
      (item) => JSON.parse(JSON.stringify(item)) as MarketingContentBlock
    )

    mutator(nextBlocks)

    localContent.value = {
      ...localContent.value,
      blocks: nextBlocks.length ? nextBlocks : [createArticleContentBlock('paragraph')]
    }
    commitContent()
  }

  const appendBlock = (type: MarketingContentBlock['_type']) => {
    mutateBlocks((blocks) => {
      blocks.push(createArticleContentBlock(type))
    })
  }

  const duplicateBlock = (index: number) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current) return
      blocks.splice(index + 1, 0, cloneArticleContentBlock(current))
    })
  }

  const removeBlock = (index: number) => {
    mutateBlocks((blocks) => {
      blocks.splice(index, 1)
    })
  }

  const updateTextBlock = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (
        !current ||
        (current._type !== 'heading' && current._type !== 'lead' && current._type !== 'paragraph')
      ) {
        return
      }
      current.content = String(value || '')
    })
  }

  const updateHeadingLevel = (index: number, level: 1 | 2 | 3 | 4 | 5 | 6) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'heading') return
      current.level = level
    })
  }

  const updateImageBlock = (index: number, value: string[]) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'image') return
      current.url = value?.[0] || ''
    })
  }

  const updateImageAlt = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'image') return
      current.alt = String(value || '') || undefined
    })
  }

  const updateImageCaption = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'image') return
      current.caption = String(value || '') || undefined
    })
  }

  const updateSectionTitle = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'section') return

      const oldAutoAnchor = slugifyArticleAnchor(current.title)
      current.title = String(value || '')

      if (!current.anchor || current.anchor === oldAutoAnchor) {
        current.anchor = slugifyArticleAnchor(current.title) || current.anchor
      }
    })
  }

  const updateSectionAnchor = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'section') return
      current.anchor = slugifyArticleAnchor(String(value || '')) || current.anchor
    })
  }

  const updateProductGroupTitle = (index: number, value: string) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'productGroup') return
      current.title = String(value || '') || undefined
    })
  }

  const updateProductGroupLayout = (index: number, value: 'grid' | 'list' | 'carousel') => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'productGroup') return
      current.layout = value
    })
  }

  const clearProductGroup = (index: number) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'productGroup') return
      current.spuIds = []
    })
  }

  const removeProductId = (index: number, spuId: number) => {
    mutateBlocks((blocks) => {
      const current = blocks[index]
      if (!current || current._type !== 'productGroup') return
      current.spuIds = current.spuIds.filter((item) => item !== spuId)
    })
  }

  const resolveProductName = (id: number) => props.products[id]?.name || `商品 #${id}`

  watch(
    () => props.modelValue,
    (nextValue) => {
      const nextSignature = serializeArticleContent(nextValue)
      if (nextSignature === lastSignature.value) return

      localContent.value = cloneArticleContent(nextValue)
      lastSignature.value = nextSignature
    },
    { deep: true }
  )
</script>

<style scoped lang="scss">
  .article-content-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .article-content-editor__head {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .article-content-editor__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .article-content-editor__hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .article-content-editor__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .article-content-editor__chip {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 7px 12px;
    font-size: 12px;
    line-height: 1;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 0;
    border-radius: 999px;
    transition:
      color 0.18s ease,
      background-color 0.18s ease;
  }

  .article-content-editor__chip:hover:not(:disabled),
  .article-content-editor__chip:focus-visible:not(:disabled) {
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, var(--theme-color) 12%, var(--el-fill-color-light));
  }

  .article-content-editor__chip:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .article-content-editor__chip-icon {
    font-size: 14px;
  }

  .article-content-editor__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .article-content-editor__block {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 14px;
    padding: 14px 8px 16px 2px;
    background: color-mix(in srgb, var(--default-box-color) 92%, var(--el-fill-color-light));
    border: 1px solid transparent;
    border-radius: calc(var(--custom-radius) + 6px);
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .article-content-editor__block:hover,
  .article-content-editor__block:focus-within {
    background: color-mix(in srgb, var(--default-box-color) 84%, var(--el-fill-color-light));
    border-color: color-mix(in srgb, var(--theme-color) 12%, transparent);
    box-shadow: 0 10px 24px rgb(15 23 42 / 4%);
  }

  .article-content-editor__block--ghost {
    border-color: color-mix(in srgb, var(--theme-color) 18%, var(--art-card-border));
    border-style: dashed;
    opacity: 0.8;
  }

  .article-content-editor__block--drag {
    background: var(--default-box-color);
    box-shadow: 0 18px 36px rgb(15 23 42 / 8%);
  }

  .article-content-editor__drag-col {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .article-content-editor__drag-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    cursor: grab;
    background: transparent;
    border: 0;
    border-radius: 999px;
  }

  .article-content-editor__drag-handle:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .article-content-editor__drag-icon {
    font-size: 15px;
    color: color-mix(in srgb, var(--el-text-color-secondary) 68%, transparent);
  }

  .article-content-editor__block-main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .article-content-editor__block-head {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: center;
    justify-content: space-between;
  }

  .article-content-editor__block-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .article-content-editor__block-index {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--theme-color) 8%, var(--el-fill-color-light));
    border-radius: 999px;
  }

  .article-content-editor__block-type {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .article-content-editor__block-type-icon {
    font-size: 15px;
  }

  .article-content-editor__heading-level {
    width: 132px;
  }

  .article-content-editor__block-tools {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .article-content-editor__tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 0;
    border-radius: 10px;
  }

  .article-content-editor__tool:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .article-content-editor__tool--danger {
    color: var(--el-color-danger);
  }

  .article-content-editor__heading-input,
  .article-content-editor__textarea {
    :deep(.el-textarea__inner) {
      border-radius: calc(var(--custom-radius) + 2px);
    }
  }

  .article-content-editor__textarea.is-lead :deep(.el-textarea__inner) {
    font-size: 15px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
  }

  .article-content-editor__image,
  .article-content-editor__product-row,
  .article-content-editor__grid {
    display: grid;
    gap: 12px;
  }

  .article-content-editor__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .article-content-editor__product-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .article-content-editor__product-summary {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .article-content-editor__product-layout {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .article-content-editor__product-actions {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .article-content-editor__tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .article-content-editor__empty {
    padding: 36px 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
    border: 1px dashed var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 6px);
  }

  @media (width <= 767px) {
    .article-content-editor__grid,
    .article-content-editor__product-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
