<template>
  <div class="flex flex-col gap-4" v-loading="isLoading">
    <div class="flex items-center gap-3">
      <ArtIconButton icon="ri:arrow-left-line" @click="handleCancel" />
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <ElForm
        ref="formRef"
        :model="article"
        :rules="rules"
        label-position="top"
        class="min-w-0 space-y-4"
      >
        <ElCard class="art-card" shadow="never">
          <template #header>
            <div
              class="flex items-center gap-2 text-base font-semibold text-[var(--el-text-color-primary)]"
            >
              <ArtSvgIcon icon="ri:file-text-line" class="text-base" />
              <span>文章信息</span>
            </div>
          </template>

          <div class="space-y-4">
            <ElFormItem label="头图 Banner" prop="coverPic" class="!mb-0">
              <SpuImageUploader v-model="coverPicList" :limit="1" tip="建议 1200×800" />
              <template #error="{ error }">
                <span class="text-xs text-[var(--el-color-danger)]">{{ error }}</span>
              </template>
            </ElFormItem>

            <ElFormItem label="主标题" prop="title" class="!mb-0">
              <ElInput
                v-model.trim="article.title"
                maxlength="255"
                show-word-limit
                placeholder="请输入文章标题"
              />
            </ElFormItem>

            <ElFormItem label="摘要" class="!mb-0">
              <ElInput
                v-model.trim="article.subTitle"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                maxlength="500"
                show-word-limit
                placeholder="请输入文章摘要"
              />
            </ElFormItem>

            <div class="grid gap-4 md:grid-cols-2">
              <ElFormItem label="栏目 Tag" class="!mb-0">
                <ElInput
                  v-model.trim="article.categoryLabel"
                  maxlength="100"
                  placeholder="例如：LIFESTYLE"
                />
              </ElFormItem>

              <ElFormItem label="作者" class="!mb-0">
                <ElInput v-model.trim="article.author" maxlength="64" placeholder="编辑部" />
              </ElFormItem>
            </div>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <ArticleContentEditor
            v-model="articleContent"
            :disabled="isSaving || isLoading"
            :products="productPreviewMap"
            @pick-products="openProductGroupSelector"
          />
        </ElCard>
      </ElForm>

      <ElForm :model="article" label-position="top" class="space-y-4">
        <ElCard class="art-card" shadow="never">
          <template #header>
            <div class="text-base font-semibold text-[var(--el-text-color-primary)]">文章设置</div>
          </template>

          <div class="space-y-4">
            <ElFormItem label="排序" class="!mb-0">
              <ElInputNumber
                v-model="article.sort"
                :min="0"
                :max="999"
                :controls="false"
                class="!w-full"
              />
            </ElFormItem>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <template #header>
            <div class="text-base font-semibold text-[var(--el-text-color-primary)]">内容统计</div>
          </template>

          <div class="space-y-3 text-sm">
            <div class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">正文块数</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ articleContent.blocks.length }}
              </span>
            </div>
            <div class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">章节数</span>
              <span class="text-right text-[var(--el-text-color-primary)]">{{ sectionCount }}</span>
            </div>
            <div class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">商品组数</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ productGroupCount }}
              </span>
            </div>
            <div class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">关联商品</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ article.spuIds.length }}
              </span>
            </div>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <template #header>
            <div class="text-base font-semibold text-[var(--el-text-color-primary)]">状态信息</div>
          </template>

          <div class="space-y-3 text-sm">
            <div class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">文章状态</span>
              <ElTag :type="statusTagType" effect="light" round size="small">
                {{ statusLabel }}
              </ElTag>
            </div>
            <div v-if="!isNew" class="article-editor-page__summary">
              <span class="text-[var(--el-text-color-secondary)]">文章 ID</span>
              <span class="text-right text-[var(--el-text-color-primary)]">{{ article.id }}</span>
            </div>
          </div>
        </ElCard>
      </ElForm>
    </div>

    <div class="border-t border-[var(--el-border-color-light)] px-5 py-3">
      <div class="flex flex-wrap items-center justify-end gap-3">
        <ElButton :disabled="!isDirty || isSaving || isLoading" @click="handleReset">重置</ElButton>
        <ElButton :loading="isSaving" :disabled="isLoading" @click="handleSave">保存</ElButton>
        <ElButton
          type="primary"
          :loading="isSaving"
          :disabled="isLoading"
          @click="handleTogglePublish"
        >
          {{ publishActionText }}
        </ElButton>
      </div>
    </div>

    <ElDialog
      v-model="showProductSelector"
      :title="productDialogTitle"
      width="860px"
      @closed="handleProductDialogClosed"
    >
      <div class="mb-3 flex items-center gap-3">
        <ElCascader
          v-model="productCateValue"
          :options="productCateOptions"
          placeholder="按分类筛选"
          clearable
          filterable
          class="w-60"
          @change="loadProductList"
        />
        <ElInput
          v-model.trim="productKeyword"
          placeholder="搜索商品..."
          clearable
          class="flex-1"
          @keyup.enter="loadProductList"
          @clear="loadProductList"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
      </div>

      <div
        class="mb-3 flex items-center justify-between rounded-xl bg-[var(--el-fill-color-light)] px-4 py-3"
      >
        <span class="text-sm text-[var(--el-text-color-secondary)]">
          当前已选 {{ currentPickerIds.length }} 个商品
        </span>
        <ElButton
          v-if="currentPickerIds.length"
          text
          size="small"
          @click="clearCurrentPickerProducts"
        >
          清空当前选择
        </ElButton>
      </div>

      <div
        class="max-h-[520px] overflow-y-auto rounded-xl border border-[var(--art-card-border)] p-3"
        v-loading="productListLoading"
      >
        <div
          v-for="product in productList"
          :key="product.id"
          class="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
          :class="
            isProductSelected(product.id)
              ? 'border-[var(--el-color-primary-light-5)] bg-[var(--el-color-primary-light-9)]'
              : 'border-transparent bg-[var(--el-fill-color-lighter)] hover:border-[var(--el-border-color)]'
          "
          @click="toggleProduct(product.id)"
        >
          <ElImage
            v-if="product.pic"
            :src="product.pic"
            fit="cover"
            class="size-11 shrink-0 rounded-lg"
          />
          <div v-else class="flex-cc size-11 shrink-0 rounded-lg bg-g-100 text-g-400">
            <ElIcon><Picture /></ElIcon>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-g-900">{{ product.name }}</div>
            <div class="text-xs text-g-500">
              {{ product.categoryName || product.brandName || '商品' }} · ￥{{
                Number(product.minPrice ?? 0).toFixed(2)
              }}
            </div>
          </div>
          <ElTag
            v-if="isProductSelected(product.id)"
            type="success"
            effect="light"
            round
            size="small"
          >
            已选
          </ElTag>
        </div>

        <ElEmpty
          v-if="productList.length === 0 && !productListLoading"
          :image-size="42"
          description="暂无商品"
        />
      </div>

      <template #footer>
        <ElButton @click="showProductSelector = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { Picture, Search } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import {
    ARTICLE_STATUS,
    createArticle,
    getArticle,
    updateArticle,
    type ArticleContentDocument,
    type ArticleDetailItem,
    type ArticleSavePayload
  } from '@/api/article'
  import { fetchSpuPage, getSpu, type SpuDetailItem, type SpuListItem } from '@/api/spu'
  import {
    cloneArticleContent,
    collectContentSpuIds,
    createEmptyArticleContent,
    serializeArticleContent
  } from '@/utils/article-content'
  import type { MarketingContentBlock } from '@/types/api/marketing-content'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import SpuImageUploader from '@/views/product/spu/modules/spu-image-uploader.vue'
  import ArticleContentEditor from './modules/article-content-editor.vue'

  defineOptions({ name: 'MarketingArticleEditor' })

  interface ArticleFormState {
    id: number
    title: string
    subTitle: string
    coverPic: string
    categoryLabel: string
    author: string
    sort: number
    status: number
    spuIds: number[]
  }

  interface CascaderOption {
    label: string
    value: number
    children?: CascaderOption[]
  }

  interface ProductPickerTarget {
    blockIndex: number
  }

  const route = useRoute()
  const router = useRouter()

  const createDefaultArticle = (): ArticleFormState => ({
    id: 0,
    title: '',
    subTitle: '',
    coverPic: '',
    categoryLabel: '',
    author: '',
    sort: 0,
    status: ARTICLE_STATUS.DRAFT,
    spuIds: []
  })

  const cloneArticle = (value: ArticleFormState): ArticleFormState =>
    JSON.parse(JSON.stringify(value)) as ArticleFormState

  const serializeArticle = (value: ArticleFormState) =>
    JSON.stringify({
      id: value.id,
      title: value.title.trim(),
      subTitle: value.subTitle.trim(),
      coverPic: value.coverPic.trim(),
      categoryLabel: value.categoryLabel.trim(),
      author: value.author.trim(),
      sort: value.sort,
      status: value.status,
      spuIds: [...value.spuIds]
    })

  const formRef = ref<FormInstance>()
  const isSaving = ref(false)
  const isLoading = ref(false)
  const showProductSelector = ref(false)
  const productPickerTarget = ref<ProductPickerTarget | null>(null)
  const article = ref<ArticleFormState>(createDefaultArticle())
  const originArticle = ref<ArticleFormState>(createDefaultArticle())
  const articleContent = ref<ArticleContentDocument>(createEmptyArticleContent())
  const originArticleContent = ref<ArticleContentDocument>(createEmptyArticleContent())

  const productCateOptions = ref<CascaderOption[]>([])
  const productCateValue = ref<number[]>([])
  const productKeyword = ref('')
  const productList = ref<SpuListItem[]>([])
  const productListLoading = ref(false)
  const productPreviewMap = ref<Record<number, { id: number; name: string }>>({})
  const loadingProductIds = ref<number[]>([])

  const rules: FormRules<ArticleFormState> = {
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }]
  }

  const articleId = computed(() => Number(route.params.id || 0))
  const isNew = computed(() => articleId.value <= 0)

  const coverPicList = computed<string[]>({
    get: () => (article.value.coverPic ? [article.value.coverPic] : []),
    set: (value) => {
      article.value.coverPic = value?.[0] || ''
    }
  })

  const productGroupCount = computed(
    () => articleContent.value.blocks.filter((block) => block._type === 'productGroup').length
  )

  const sectionCount = computed(
    () => articleContent.value.blocks.filter((block) => block._type === 'section').length
  )

  const isDirty = computed(
    () =>
      serializeArticle(article.value) !== serializeArticle(originArticle.value) ||
      serializeArticleContent(articleContent.value) !==
        serializeArticleContent(originArticleContent.value)
  )

  const statusLabel = computed(() => {
    if (article.value.status === ARTICLE_STATUS.PUBLISHED) return '已发布'
    if (article.value.status === ARTICLE_STATUS.UNPUBLISHED) return '已下架'
    return '草稿'
  })

  const statusTagType = computed(() => {
    if (article.value.status === ARTICLE_STATUS.PUBLISHED) return 'success'
    if (article.value.status === ARTICLE_STATUS.UNPUBLISHED) return 'danger'
    return 'warning'
  })

  const publishActionText = computed(() =>
    article.value.status === ARTICLE_STATUS.PUBLISHED ? '下架文章' : '发布文章'
  )

  const selectedProductGroupBlock = computed(() => {
    const target = productPickerTarget.value
    if (!target) return null

    const block = articleContent.value.blocks[target.blockIndex]
    return block?._type === 'productGroup' ? block : null
  })

  const productDialogTitle = computed(() => {
    if (!selectedProductGroupBlock.value) return '选择商品'
    const block = selectedProductGroupBlock.value
    return block.title?.trim() ? `选择商品 · ${block.title}` : '选择商品'
  })

  const currentPickerIds = computed(() => selectedProductGroupBlock.value?.spuIds || [])

  const markCurrentAsSaved = () => {
    originArticle.value = cloneArticle(article.value)
    originArticleContent.value = cloneArticleContent(articleContent.value)
  }

  const resetDraft = () => {
    article.value = createDefaultArticle()
    articleContent.value = createEmptyArticleContent()
    productPickerTarget.value = null
    markCurrentAsSaved()
  }

  const rememberPreviewProduct = (
    item: Pick<SpuListItem, 'id' | 'name' | 'pic' | 'minPrice' | 'brandName' | 'categoryName'>
  ) => {
    if (!item.id) return

    productPreviewMap.value = {
      ...productPreviewMap.value,
      [item.id]: {
        id: item.id,
        name: item.name || `商品 #${item.id}`
      }
    }
  }

  const rememberPreviewProducts = (
    items: Array<
      Pick<SpuListItem, 'id' | 'name' | 'pic' | 'minPrice' | 'brandName' | 'categoryName'>
    >
  ) => {
    items.forEach((item) => rememberPreviewProduct(item))
  }

  const ensurePreviewProducts = async (ids: number[]) => {
    const missingIds = Array.from(
      new Set(
        ids.filter((id) => !productPreviewMap.value[id] && !loadingProductIds.value.includes(id))
      )
    )

    if (!missingIds.length) return

    loadingProductIds.value = [...loadingProductIds.value, ...missingIds]

    try {
      const results = await Promise.allSettled(missingIds.map((id) => getSpu(id)))
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return
        const item = result.value as SpuDetailItem
        rememberPreviewProduct({
          id: missingIds[index],
          name: item.name,
          pic: item.pic,
          minPrice: item.skuStockList?.[0]?.price ?? 0,
          brandName: item.brandName,
          categoryName: item.categoryName
        })
      })
    } finally {
      loadingProductIds.value = loadingProductIds.value.filter((id) => !missingIds.includes(id))
    }
  }

  const loadCategoryList = async () => {
    try {
      const list = await fetchCategoryTree()
      productCateOptions.value = list.map((item: CategoryTreeItem) => {
        const children =
          item.children?.map((child) => ({ label: child.name, value: child.id })) || []

        return {
          label: item.name,
          value: item.id,
          children: children.length > 0 ? children : undefined
        }
      })
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadProductList = async () => {
    productListLoading.value = true
    try {
      const res = await fetchSpuPage({
        current: 1,
        size: 50,
        publishStatus: 1,
        categoryId: productCateValue.value.length
          ? productCateValue.value[productCateValue.value.length - 1]
          : undefined,
        keyword: productKeyword.value.trim() || undefined
      })
      productList.value = res.records || []
      rememberPreviewProducts(productList.value)
    } catch (error) {
      console.error('加载商品列表失败:', error)
    } finally {
      productListLoading.value = false
    }
  }

  const openProductGroupSelector = (blockIndex: number) => {
    const block = articleContent.value.blocks[blockIndex]
    if (!block || block._type !== 'productGroup') return

    productPickerTarget.value = { blockIndex }
    showProductSelector.value = true
  }

  const applyPickerIds = (ids: number[]) => {
    const target = productPickerTarget.value
    if (!target) return

    const nextBlocks = articleContent.value.blocks.map(
      (item) => JSON.parse(JSON.stringify(item)) as MarketingContentBlock
    )
    const current = nextBlocks[target.blockIndex]
    if (!current || current._type !== 'productGroup') return

    current.spuIds = Array.from(new Set(ids))
    articleContent.value = {
      ...articleContent.value,
      blocks: nextBlocks
    }
  }

  const toggleProduct = (id: number) => {
    const ids = [...currentPickerIds.value]
    const index = ids.indexOf(id)

    if (index > -1) {
      ids.splice(index, 1)
    } else {
      ids.push(id)
    }

    applyPickerIds(ids)
  }

  const isProductSelected = (id: number) => currentPickerIds.value.includes(id)

  const clearCurrentPickerProducts = () => {
    applyPickerIds([])
  }

  const handleProductDialogClosed = () => {
    productKeyword.value = productKeyword.value.trim()
  }

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value || isSaving.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  const ensureBaseValid = async () => {
    if (!article.value.title.trim()) {
      ElMessage.error('请输入文章标题')
      throw new Error('ARTICLE_TITLE_REQUIRED')
    }

    await formRef.value?.validateField('title')
  }

  const collectSavePayload = (nextStatus?: number): ArticleSavePayload => {
    article.value.spuIds = collectContentSpuIds(articleContent.value)

    return {
      title: article.value.title.trim(),
      subTitle: article.value.subTitle.trim() || undefined,
      coverPic: article.value.coverPic.trim() || undefined,
      content: cloneArticleContent(articleContent.value),
      categoryLabel: article.value.categoryLabel.trim() || undefined,
      author: article.value.author.trim() || undefined,
      sort: article.value.sort,
      status: typeof nextStatus === 'number' ? nextStatus : article.value.status
    }
  }

  const persist = async (nextStatus?: number) => {
    await ensureBaseValid()

    isSaving.value = true
    try {
      const payload = collectSavePayload(nextStatus)

      if (isNew.value) {
        const newId = await createArticle(payload)
        if (newId) {
          article.value.id = newId
          article.value.status = payload.status ?? article.value.status
          markCurrentAsSaved()
          await router.replace({ name: 'MarketingArticleEdit', params: { id: newId } })
        }
        return
      }

      await updateArticle(articleId.value, payload)
      article.value.status = payload.status ?? article.value.status
      markCurrentAsSaved()
    } finally {
      isSaving.value = false
    }
  }

  const handleSave = () => {
    void persist()
  }

  const handleTogglePublish = async () => {
    if (article.value.status === ARTICLE_STATUS.PUBLISHED) {
      try {
        await ElMessageBox.confirm('下架后将不在前台展示，是否继续？', '确认下架', {
          type: 'warning',
          confirmButtonText: '下架',
          cancelButtonText: '取消'
        })
        await persist(ARTICLE_STATUS.UNPUBLISHED)
      } catch {
        // ignore
      }
      return
    }

    if (!article.value.title.trim() || !article.value.coverPic.trim()) {
      ElMessage.error('请完善标题和封面后再发布')
      return
    }

    await persist(ARTICLE_STATUS.PUBLISHED)
  }

  const handleCancel = () => {
    router.push({ name: 'MarketingArticle' })
  }

  const applyDetail = (data: ArticleDetailItem) => {
    const nextContent = cloneArticleContent(data.content)

    article.value = {
      id: data.id,
      title: data.title || '',
      subTitle: data.subTitle || '',
      coverPic: data.coverPic || '',
      categoryLabel: data.categoryLabel || '',
      author: data.author || '',
      sort: Number(data.sort ?? 0),
      status: data.status ?? ARTICLE_STATUS.DRAFT,
      spuIds: data.spuIds?.length ? [...data.spuIds] : collectContentSpuIds(nextContent)
    }

    articleContent.value = nextContent
    markCurrentAsSaved()
  }

  const handleReset = async () => {
    isLoading.value = true
    try {
      if (!articleId.value) {
        resetDraft()
        return
      }

      const data = await getArticle(articleId.value)
      applyDetail(data)
    } catch (error) {
      console.error('重置文章失败:', error)
      ElMessage.error('重置文章失败')
    } finally {
      isLoading.value = false
    }
  }

  const loadDetail = async (id: number) => {
    isLoading.value = true
    try {
      const data = await getArticle(id)
      applyDetail(data)
    } catch (error) {
      console.error('加载文章详情失败:', error)
      ElMessage.error('加载文章详情失败')
      router.push({ name: 'MarketingArticle' })
    } finally {
      isLoading.value = false
    }
  }

  watch(showProductSelector, (visible) => {
    if (!visible) return
    void loadProductList()
  })

  watch(
    articleContent,
    (nextContent) => {
      article.value.spuIds = collectContentSpuIds(nextContent)
      void ensurePreviewProducts(article.value.spuIds)
    },
    { deep: true, immediate: true }
  )

  watch(
    () => articleId.value,
    (nextId) => {
      if (!Number.isFinite(nextId) || nextId <= 0) {
        resetDraft()
        return
      }

      if (nextId === article.value.id && !isNew.value) return
      void loadDetail(nextId)
    },
    { immediate: true }
  )

  onMounted(() => {
    void loadCategoryList()
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeRouteLeave((_, __, next) => {
    if (!isDirty.value || isSaving.value) {
      next()
      return
    }

    ElMessageBox.confirm('当前内容尚未保存，确定离开吗？', '提示', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '继续编辑'
    })
      .then(() => next())
      .catch(() => next(false))
  })
</script>

<style scoped lang="scss">
  .article-editor-page__summary {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }
</style>
