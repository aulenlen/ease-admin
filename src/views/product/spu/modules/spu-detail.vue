<template>
  <div class="flex flex-col gap-4" v-loading="loading">
    <ElCard shadow="never" class="art-card-xs spu-detail-page__topbar">
      <div class="flex items-center justify-between gap-4 max-md:items-start max-md:flex-col">
        <div>
          <div class="text-lg font-semibold text-[var(--el-text-color-primary)]">{{
            pageTitle
          }}</div>
          <div
            class="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-2 text-xs text-[var(--el-text-color-secondary)]"
          >
            <span>{{ isEdit ? `商品ID：${form.id}` : '新建商品' }}</span>
            <span>分类：{{ form.categoryId ? form.categoryId : '未选择' }}</span>
            <span>状态：{{ Number(form.publishStatus ?? 0) === 1 ? '已上架' : '未上架' }}</span>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap gap-3 max-md:w-full">
          <ElButton @click="router.push('/product/spu')">返回列表</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="primary" :loading="saving" @click="handleSubmit">保存商品</ElButton>
        </div>
      </div>
    </ElCard>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-4">
        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <span class="font-medium">商品编辑</span>
              <ElTabs v-model="activeTab" class="spu-detail-page__tabs">
                <ElTabPane label="基础信息" name="core" />
                <ElTabPane label="规格与价格" name="sku" />
              </ElTabs>
            </div>
          </template>

          <ElForm
            v-show="activeTab === 'core'"
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
          >
            <ElRow :gutter="16">
              <ElCol :xs="24" :md="12">
                <ElFormItem label="品牌" prop="brandId">
                  <ElSelect v-model="form.brandId" filterable clearable class="w-full">
                    <ElOption
                      v-for="item in brandOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :md="12">
                <ElFormItem label="分类" prop="categoryId">
                  <ElCascader
                    v-model="categoryPath"
                    :options="categoryOptions"
                    clearable
                    filterable
                    class="w-full"
                    :props="cascaderProps"
                    @change="handleCategoryChange"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElRow :gutter="16">
              <ElCol :xs="24" :md="16">
                <ElFormItem label="商品名称" prop="name">
                  <ElInput v-model.trim="form.name" maxlength="200" show-word-limit />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :md="8">
                <ElFormItem label="排序">
                  <ElInputNumber v-model="form.sort" :min="0" :precision="0" class="w-full" />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElFormItem label="副标题">
              <ElInput v-model.trim="form.subTitle" maxlength="255" show-word-limit />
            </ElFormItem>

            <ElRow :gutter="16">
              <ElCol :xs="24" :md="12">
                <ElFormItem label="关键词" prop="keywords">
                  <ElInput v-model.trim="form.keywords" maxlength="255" show-word-limit />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :md="6">
                <ElFormItem label="单位">
                  <ElInput v-model.trim="form.unit" maxlength="16" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :md="6">
                <ElFormItem label="重量(克)">
                  <ElInputNumber
                    v-model="form.weight"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    class="w-full"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElFormItem label="商品描述" prop="description">
              <ElInput
                v-model.trim="form.description"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                maxlength="500"
                show-word-limit
              />
            </ElFormItem>

            <div class="flex flex-wrap items-center gap-3">
              <ElTag effect="plain">发布状态</ElTag>
              <ElSwitch
                :model-value="Number(form.publishStatus ?? 0) === 1"
                @update:model-value="form.publishStatus = $event ? 1 : 0"
              />
              <ElTag effect="plain">推荐</ElTag>
              <ElSwitch
                :model-value="Number(form.recommendStatus ?? 0) === 1"
                @update:model-value="form.recommendStatus = $event ? 1 : 0"
              />
            </div>

            <ElDivider />

            <section class="pt-0.5">
              <div class="mb-2.5 text-sm font-semibold text-[var(--el-text-color-primary)]"
                >商品参数</div
              >
              <ElEmpty v-if="!form.categoryId" description="先选择商品分类，再填写参数" />
              <ElEmpty v-else-if="!paramDefs.length" description="当前分类未配置参数" />
              <ElRow v-else :gutter="16">
                <ElCol v-for="item in paramDefs" :key="item.attrId" :xs="24" :md="12">
                  <ElFormItem :label="item.attrName">
                    <ElSelect
                      v-if="item.optionList.length"
                      v-model="paramValueMap[item.attrId]"
                      clearable
                      filterable
                      allow-create
                      default-first-option
                      class="w-full"
                    >
                      <ElOption
                        v-for="option in item.optionList"
                        :key="option"
                        :label="option"
                        :value="option"
                      />
                    </ElSelect>
                    <ElInput v-else v-model.trim="paramValueMap[item.attrId]" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </section>

            <ElDivider />

            <section class="pt-0.5">
              <div class="mb-2.5 text-sm font-semibold text-[var(--el-text-color-primary)]"
                >商品详情</div
              >
              <ArtWangEditor v-model="form.detailMobileHtml" height="360px" />
            </section>
          </ElForm>

          <div v-show="activeTab === 'sku'" class="space-y-4">
            <section class="pt-0.5">
              <div class="mb-2.5 text-sm font-semibold text-[var(--el-text-color-primary)]"
                >规格配置</div
              >
              <ElEmpty v-if="!form.categoryId" description="先选择商品分类，再配置规格" />
              <ElEmpty v-else-if="!specDefs.length" description="当前分类未配置规格" />
              <div v-else class="space-y-4">
                <ElCard
                  v-for="item in specDefs"
                  :key="item.attrId"
                  shadow="never"
                  class="border-dashed"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="font-medium">{{ item.attrName }}</div>
                    <div class="text-xs text-g-500">至少选 1 个值后会自动生成 SKU</div>
                  </div>
                  <ElCheckboxGroup
                    v-model="specSelectionMap[item.attrId]"
                    class="mt-3 flex flex-wrap gap-3"
                    @change="handleSpecSelectionChange"
                  >
                    <ElCheckbox
                      v-for="option in item.optionList"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </ElCheckboxGroup>
                </ElCard>
              </div>
            </section>

            <section class="pt-0.5">
              <div class="mb-2.5 text-sm font-semibold text-[var(--el-text-color-primary)]"
                >SKU 与价格</div
              >
              <ElAlert
                v-if="hasSpecSelection"
                type="info"
                show-icon
                :closable="false"
                :title="`已按规格生成 ${form.skuStockList.length} 个 SKU`"
              />

              <ElForm v-if="!hasSpecSelection" label-position="top" class="mt-4">
                <ElRow :gutter="16">
                  <ElCol :xs="24" :md="12">
                    <ElFormItem label="售价">
                      <ElInputNumber
                        v-model="singleSku.price"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="w-full"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24" :md="12">
                    <ElFormItem label="市场价">
                      <ElInputNumber
                        v-model="singleSku.originalPrice"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="w-full"
                      />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
                <ElRow :gutter="16">
                  <ElCol :xs="24" :md="12">
                    <ElFormItem label="库存">
                      <ElInputNumber
                        v-model="singleSku.stock"
                        :min="0"
                        :precision="0"
                        controls-position="right"
                        class="w-full"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24" :md="12">
                    <ElFormItem label="低库存预警">
                      <ElInputNumber
                        v-model="singleSku.lowStock"
                        :min="0"
                        :precision="0"
                        controls-position="right"
                        class="w-full"
                      />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
              </ElForm>

              <SpuSkuEditor v-else v-model="form.skuStockList" class="mt-4" />
            </section>
          </div>
        </ElCard>
      </div>

      <div class="space-y-4">
        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">图片素材</span>
          </template>

          <div class="space-y-4">
            <div class="pb-0.5">
              <div class="mb-2 text-sm font-medium">商品主图</div>
              <SpuImageUploader v-model="mainPicList" :limit="1" tip="建议上传 1:1 主图" />
            </div>
            <div class="pb-0.5">
              <div class="mb-2 text-sm font-medium">轮播图</div>
              <SpuImageUploader
                v-model="form.albumPics"
                :limit="5"
                :multiple="true"
                tip="建议上传 3-5 张轮播图"
              />
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">提交检查</span>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span>基础信息</span>
              <ElTag :type="form.brandId && form.categoryId && form.name ? 'success' : 'danger'">
                {{ form.brandId && form.categoryId && form.name ? '已完成' : '待完善' }}
              </ElTag>
            </div>
            <div class="flex items-center justify-between">
              <span>图片素材</span>
              <ElTag :type="form.pic ? 'success' : 'danger'">
                {{ form.pic ? '已完成' : '待完善' }}
              </ElTag>
            </div>
            <div class="flex items-center justify-between">
              <span>SKU 价格</span>
              <ElTag :type="hasValidSkuPrice ? 'success' : 'danger'">
                {{ hasValidSkuPrice ? '已完成' : '待完善' }}
              </ElTag>
            </div>
            <div class="rounded-md bg-g-100 p-3 text-xs text-g-600">
              缺失项 {{ requiredMissingCount }} 个。先把主提交流和布局骨架跑通，再逐步补增强能力。
            </div>
          </div>
        </ElCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    createSpu,
    getSpu,
    updateSpu,
    type AttrValueItem,
    type SpuDetailItem,
    type SpuFormSkuItem,
    type SpuSavePayload
  } from '@/api/spu'
  import { fetchBrandPage, type BrandListItem } from '@/api/brand'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import {
    fetchCategoryParams,
    fetchCategorySpecs,
    type CategoryAttributeRelationItem
  } from '@/api/category-attribute'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { markSpuListDirty } from './spu-list-cache'
  import SpuImageUploader from './spu-image-uploader.vue'
  import SpuSkuEditor from './spu-sku-editor.vue'

  interface Props {
    mode: 'create' | 'edit'
  }

  interface SpuFormState extends Partial<SpuDetailItem> {
    id?: number
    brandId?: number
    categoryId?: number
    name: string
    description: string
    keywords: string
    subTitle: string
    pic: string
    albumPics: string[]
    unit: string
    weight: number
    sort: number
    publishStatus: 0 | 1
    recommendStatus: 0 | 1
    detailMobileHtml: string
    skuStockList: SpuFormSkuItem[]
  }

  const props = defineProps<Props>()

  const router = useRouter()
  const route = useRoute()
  const isEdit = computed(() => props.mode === 'edit')
  const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'))

  const loading = ref(false)
  const saving = ref(false)
  const activeTab = ref<'core' | 'sku'>('core')
  const formRef = ref<FormInstance>()

  const brandOptions = ref<BrandListItem[]>([])
  const categoryTree = ref<CategoryTreeItem[]>([])
  const paramDefs = ref<CategoryAttributeRelationItem[]>([])
  const specDefs = ref<CategoryAttributeRelationItem[]>([])
  const categoryPath = ref<number[]>([])
  const paramValueMap = reactive<Record<number, string>>({})
  const specSelectionMap = reactive<Record<number, string[]>>({})
  const cascaderProps = {
    checkStrictly: true,
    emitPath: true,
    value: 'value',
    label: 'label',
    children: 'children'
  }

  const createDefaultSku = (): SpuFormSkuItem => ({
    price: 0,
    originalPrice: 0,
    stock: 0,
    lowStock: 0,
    enableStatus: 1,
    spData: '[]'
  })

  const createDefaultForm = (): SpuFormState => ({
    name: '',
    description: '',
    keywords: '',
    subTitle: '',
    pic: '',
    albumPics: [],
    unit: '',
    weight: 0,
    sort: 0,
    publishStatus: 0,
    recommendStatus: 0,
    detailMobileHtml: '',
    skuStockList: [createDefaultSku()]
  })

  const form = reactive<SpuFormState>(createDefaultForm())
  const initialSnapshot = ref<SpuFormState>(createDefaultForm())

  const rules: FormRules<SpuFormState> = {
    brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
    keywords: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
    description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }]
  }

  const categoryOptions = computed(() => {
    const walk = (items: CategoryTreeItem[]): any[] =>
      items.map((item) => ({
        label: item.name,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined
      }))

    return walk(categoryTree.value)
  })

  const mainPicList = computed({
    get: () => (form.pic ? [form.pic] : []),
    set: (value: string[]) => {
      form.pic = value?.[0] || ''
    }
  })

  const ensureSingleSku = () => {
    if (!form.skuStockList.length) {
      form.skuStockList = [createDefaultSku()]
    }
  }

  const singleSku = computed({
    get: () => form.skuStockList[0] || createDefaultSku(),
    set: (value) => {
      form.skuStockList = [value]
    }
  })

  const hasSpecSelection = computed(() =>
    Object.values(specSelectionMap).some((items) => Array.isArray(items) && items.length > 0)
  )

  const hasValidSkuPrice = computed(() =>
    (form.skuStockList || []).some((item) => Number(item.price ?? 0) > 0)
  )

  const requiredMissingCount = computed(() => {
    let count = 0
    if (!form.brandId) count += 1
    if (!form.categoryId) count += 1
    if (!String(form.name || '').trim()) count += 1
    if (!String(form.pic || '').trim()) count += 1
    if (!hasValidSkuPrice.value) count += 1
    return count
  })

  const normalizeClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

  const parseSpecData = (value?: string): AttrValueItem[] => {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const getCategoryPath = (targetId?: number, tree = categoryTree.value): number[] => {
    if (!targetId) return []

    for (const item of tree) {
      if (item.id === targetId) return [item.id]
      if (item.children?.length) {
        const childPath = getCategoryPath(targetId, item.children)
        if (childPath.length) return [item.id, ...childPath]
      }
    }

    return []
  }

  const syncParamValueMap = (items: AttrValueItem[]) => {
    Object.keys(paramValueMap).forEach((key) => delete paramValueMap[Number(key)])
    items.forEach((item) => {
      if (item.attrId) {
        paramValueMap[item.attrId] = String(item.attrValue || '')
      }
    })
  }

  const syncSpecSelectionFromSku = (skuList: SpuFormSkuItem[]) => {
    Object.keys(specSelectionMap).forEach((key) => delete specSelectionMap[Number(key)])
    skuList.forEach((sku) => {
      parseSpecData(sku.spData).forEach((item) => {
        if (!item.attrId || !item.attrValue) return
        if (!specSelectionMap[item.attrId]) {
          specSelectionMap[item.attrId] = []
        }
        if (!specSelectionMap[item.attrId].includes(item.attrValue)) {
          specSelectionMap[item.attrId].push(item.attrValue)
        }
      })
    })
  }

  const applyFormData = (data?: Partial<SpuDetailItem>) => {
    Object.assign(form, createDefaultForm(), {
      ...normalizeClone(data || {}),
      id: data?.id,
      albumPics: Array.isArray(data?.albumPics) ? [...data.albumPics] : [],
      detailMobileHtml: data?.detailMobileHtml || data?.detailHtml || '',
      skuStockList:
        Array.isArray(data?.skuStockList) && data.skuStockList.length
          ? normalizeClone(data.skuStockList)
          : [createDefaultSku()]
    })

    categoryPath.value = getCategoryPath(form.categoryId)
    syncParamValueMap(data?.attrValueList || [])
    syncSpecSelectionFromSku(form.skuStockList)
    ensureSingleSku()
    initialSnapshot.value = normalizeClone(form)
  }

  const buildCartesianProduct = (groups: AttrValueItem[][]): AttrValueItem[][] => {
    if (!groups.length) return []
    return groups.reduce<AttrValueItem[][]>(
      (result, current) =>
        result.flatMap((resultItem) => current.map((currentItem) => [...resultItem, currentItem])),
      [[]]
    )
  }

  const buildSpecKey = (items: AttrValueItem[]) =>
    items.map((item) => `${item.attrId}:${item.attrValue}`).join('|')

  const handleSpecSelectionChange = () => {
    const selectedGroups = specDefs.value
      .map((item) =>
        (specSelectionMap[item.attrId] || []).map((value) => ({
          attrId: item.attrId,
          attrName: item.attrName,
          attrValue: value
        }))
      )
      .filter((group) => group.length)

    if (!selectedGroups.length) {
      form.skuStockList = [form.skuStockList[0] || createDefaultSku()]
      form.skuStockList[0].spData = '[]'
      return
    }

    const previousMap = new Map(
      form.skuStockList.map((item) => [buildSpecKey(parseSpecData(item.spData)), item])
    )

    form.skuStockList = buildCartesianProduct(selectedGroups).map((attrs, index) => {
      const key = buildSpecKey(attrs)
      const previous = previousMap.get(key)
      return {
        id: previous?.id,
        skuCode: previous?.skuCode || `${form.spuCode || 'SPU'}-${index + 1}`,
        pic: previous?.pic || form.pic,
        price: Number(previous?.price ?? 0),
        originalPrice: Number(previous?.originalPrice ?? 0),
        stock: Number(previous?.stock ?? 0),
        lowStock: Number(previous?.lowStock ?? 0),
        sale: Number(previous?.sale ?? 0),
        enableStatus: Number(previous?.enableStatus ?? 1) === 1 ? 1 : 0,
        spData: JSON.stringify(attrs)
      }
    })
  }

  const loadBaseOptions = async () => {
    const [brandPage, categories] = await Promise.all([
      fetchBrandPage({ current: 1, size: 200 }),
      fetchCategoryTree()
    ])
    brandOptions.value = brandPage.records || []
    categoryTree.value = categories || []
  }

  const loadCategoryMeta = async (categoryId?: number) => {
    if (!categoryId) {
      paramDefs.value = []
      specDefs.value = []
      return
    }

    const [params, specs] = await Promise.all([
      fetchCategoryParams(categoryId),
      fetchCategorySpecs(categoryId)
    ])
    paramDefs.value = params
    specDefs.value = specs
  }

  const handleCategoryChange = async (value?: any) => {
    const path = Array.isArray(value)
      ? value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      : value !== null && value !== undefined && value !== ''
        ? [Number(value)]
        : []

    form.categoryId = path.length ? path[path.length - 1] : undefined
    syncParamValueMap([])
    Object.keys(specSelectionMap).forEach((key) => delete specSelectionMap[Number(key)])
    form.skuStockList = [createDefaultSku()]
    ensureSingleSku()
    await loadCategoryMeta(form.categoryId)
  }

  const handleReset = () => {
    applyFormData(initialSnapshot.value)
  }

  const buildSubmitPayload = (): SpuSavePayload => {
    const attrValueList = paramDefs.value
      .map((item) => ({
        attrId: item.attrId,
        attrName: item.attrName,
        attrValue: String(paramValueMap[item.attrId] || '').trim()
      }))
      .filter((item) => item.attrValue)

    const skuList = (form.skuStockList || [createDefaultSku()]).map((item) => ({
      id: item.id,
      skuCode: String(item.skuCode || '').trim() || undefined,
      pic: String(item.pic || '').trim() || form.pic || undefined,
      basePrice: Number(item.price ?? 0),
      compareAtPrice: Number(item.originalPrice ?? 0),
      enableStatus: (Number(item.enableStatus ?? 1) === 1 ? 1 : 0) as 0 | 1,
      stock: Number(item.stock ?? 0),
      lowStock: Number(item.lowStock ?? 0),
      sale: Number(item.sale ?? 0),
      attrValues: parseSpecData(item.spData)
    }))

    return {
      id: form.id,
      brandId: Number(form.brandId || 0),
      categoryId: Number(form.categoryId || 0),
      name: String(form.name || '').trim(),
      description: String(form.description || '').trim(),
      keywords: String(form.keywords || '').trim(),
      subTitle: String(form.subTitle || '').trim() || undefined,
      pic: String(form.pic || '').trim() || undefined,
      albumPics: (form.albumPics || []).map((item) => String(item || '').trim()).filter(Boolean),
      unit: String(form.unit || '').trim() || undefined,
      weight: Number(form.weight ?? 0),
      sort: Number(form.sort ?? 0),
      publishStatus: Number(form.publishStatus ?? 0) === 1 ? 1 : 0,
      recommendStatus: Number(form.recommendStatus ?? 0) === 1 ? 1 : 0,
      detailHtml: String(form.detailMobileHtml || '').trim(),
      detailMobileHtml: String(form.detailMobileHtml || '').trim(),
      attrValueList,
      skuList
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    if (!form.pic) {
      ElMessage.warning('请先上传商品主图')
      return
    }
    if (!hasValidSkuPrice.value) {
      ElMessage.warning('请至少填写一个有效 SKU 售价')
      activeTab.value = 'sku'
      return
    }

    saving.value = true
    try {
      const payload = buildSubmitPayload()
      if (isEdit.value && form.id) {
        await updateSpu(form.id, payload)
      } else {
        await createSpu(payload)
      }
      markSpuListDirty()
      router.push('/product/spu')
    } finally {
      saving.value = false
    }
  }

  const loadDetail = async () => {
    if (!isEdit.value) {
      applyFormData()
      return
    }

    const id = Number(route.params.id || 0)
    if (!id) {
      router.replace('/product/spu')
      return
    }

    const data = await getSpu(id)
    await loadCategoryMeta(data.categoryId)
    applyFormData(data)
  }

  onMounted(async () => {
    loading.value = true
    try {
      await loadBaseOptions()
      await loadDetail()
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped lang="scss">
  .spu-detail-page__topbar {
    :deep(.el-card__body) {
      padding: 14px 18px;
    }
  }

  .spu-detail-page__tabs :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
</style>
