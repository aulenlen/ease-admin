<template>
  <div class="flex flex-col gap-4" v-loading="loading">
    <div class="flex items-center gap-3">
      <ArtIconButton icon="ri:arrow-left-line" @click="router.push('/product/spu')" />
    </div>

    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div class="space-y-4">
        <ElCard class="art-card" shadow="never">
          <template #header>
            <div>
              <div class="text-base font-semibold text-[var(--el-text-color-primary)]"
                >商品信息</div
              >
            </div>
          </template>

          <div class="space-y-4">
            <ElFormItem label="商品名称" prop="name">
              <ElInput
                v-model.trim="form.name"
                maxlength="100"
                show-word-limit
                placeholder="请输入商品名称"
              />
            </ElFormItem>

            <ElFormItem label="副标题">
              <ElInput
                v-model.trim="form.subTitle"
                maxlength="150"
                show-word-limit
                placeholder="请输入副标题"
              />
            </ElFormItem>

            <ElFormItem label="关键词" prop="keywords">
              <ElInput
                v-model.trim="form.keywords"
                maxlength="150"
                show-word-limit
                placeholder="请输入关键词，多个关键词可用逗号分隔"
              />
            </ElFormItem>

            <ElFormItem label="单位">
              <ElInput v-model.trim="form.unit" maxlength="20" placeholder="例如：件、盒、台" />
            </ElFormItem>

            <ElFormItem label="重量（kg）">
              <ElInputNumber
                v-model="form.weight"
                :min="0"
                :precision="2"
                class="w-full !max-w-none"
              />
            </ElFormItem>

            <ElFormItem label="排序">
              <ElInputNumber
                v-model="form.sort"
                :min="0"
                :precision="0"
                class="w-full !max-w-none"
              />
            </ElFormItem>

            <ElFormItem label="商品描述" prop="description">
              <ElInput
                v-model.trim="form.description"
                type="textarea"
                :rows="4"
                maxlength="300"
                show-word-limit
                placeholder="请输入商品描述"
              />
            </ElFormItem>

            <ElFormItem label="商品详情">
              <ArtWangEditor v-model="form.detailHtml" height="360px" />
            </ElFormItem>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <template #header>
            <div>
              <div class="text-base font-semibold text-[var(--el-text-color-primary)]"
                >商品图片与参数</div
              >
            </div>
          </template>

          <div class="space-y-4">
            <ElFormItem label="商品参数">
              <div
                class="w-full rounded-xl border border-dashed border-[var(--el-border-color)] p-4"
              >
                <ElEmpty
                  v-if="!form.categoryId"
                  description="请先在右侧选择商品分类"
                  :image-size="60"
                />
                <ElEmpty
                  v-else-if="!paramDefs.length"
                  description="当前分类未配置商品参数"
                  :image-size="60"
                />
                <div v-else class="space-y-4">
                  <ElFormItem
                    v-for="item in paramDefs"
                    :key="item.attrId"
                    :label="item.attrName"
                    class="mb-0"
                  >
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
                    <ElInput
                      v-else
                      v-model.trim="paramValueMap[item.attrId]"
                      placeholder="请输入参数值"
                    />
                  </ElFormItem>
                </div>
              </div>
            </ElFormItem>

            <ElFormItem label="商品主图">
              <SpuImageUploader
                v-model="mainPicList"
                :limit="1"
                tip="建议上传 1 张主图，用于列表与详情展示"
              />
            </ElFormItem>

            <ElFormItem label="轮播图">
              <SpuImageUploader
                v-model="albumPicList"
                :limit="8"
                multiple
                tip="最多上传 8 张轮播图，建议保持统一尺寸"
              />
            </ElFormItem>
          </div>
        </ElCard>

        <ElCard ref="skuSectionRef" class="art-card spu-detail-page__sku-card" shadow="never">
          <template #header>
            <div>
              <div class="text-base font-semibold text-[var(--el-text-color-primary)]"
                >多规格与库存</div
              >
            </div>
          </template>

          <div class="space-y-6">
            <section class="space-y-4">
              <ElEmpty
                v-if="!form.categoryId"
                description="先选择商品分类，再配置规格"
                :image-size="60"
              />
              <div v-else class="space-y-4">
                <ElAlert
                  v-if="!specDefs.length"
                  type="info"
                  show-icon
                  :closable="false"
                  title="当前分类未配置预设规格，可直接新增自定义规格。"
                />

                <div
                  v-if="specDefs.length || customSpecs.length"
                  class="divide-y divide-[var(--art-card-border)]"
                >
                  <SpecTagSelector
                    v-for="item in specDefs"
                    :key="item.attrId"
                    :attr-name="item.attrName"
                    :attr-id="item.attrId"
                    :preset-options="item.optionList"
                    v-model="specSelectionMap[item.attrId]"
                    @change="handleSpecSelectionChange"
                  />

                  <SpecTagSelector
                    v-for="item in customSpecs"
                    :key="item.tempId"
                    :attr-name="item.attrName"
                    :preset-options="[]"
                    v-model="item.values"
                    editable
                    @update:attr-name="item.attrName = $event"
                    @remove="removeCustomSpec(item.tempId)"
                    @change="handleSpecSelectionChange"
                  />
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3">
                  <ElButton type="primary" plain @click="addCustomSpec">添加规格</ElButton>
                </div>
              </div>
            </section>

            <ElDivider class="!my-0" />

            <section class="space-y-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="space-y-1">
                  <div class="font-medium text-[var(--el-text-color-primary)]">价格与库存</div>
                </div>
              </div>

              <ElEmpty
                v-if="!form.categoryId"
                description="请先在右侧选择商品分类，再配置价格与库存"
                :image-size="60"
              />
              <ElEmpty
                v-else-if="!hasSpecSelection"
                description="请先选择规格，再配置价格与库存"
                :image-size="60"
              />
              <template v-else>
                <ElAlert
                  type="info"
                  show-icon
                  :closable="false"
                  :title="`${form.skuStockList.length} 个 SKU`"
                  description=""
                />

                <SpuSkuEditor v-model="form.skuStockList" class="mt-4" />
              </template>
            </section>
          </div>
        </ElCard>
      </div>

      <div class="space-y-4">
        <ElCard class="art-card" shadow="never">
          <template #header>
            <div>
              <div class="text-base font-semibold text-[var(--el-text-color-primary)]"
                >商品设置</div
              >
            </div>
          </template>

          <div class="space-y-4">
            <ElFormItem label="上架商品">
              <ElSwitch v-model="form.publishStatus" :active-value="1" :inactive-value="0" />
            </ElFormItem>

            <ElFormItem label="推荐商品">
              <ElSwitch v-model="form.recommendStatus" :active-value="1" :inactive-value="0" />
            </ElFormItem>

            <ElFormItem label="品牌" prop="brandId">
              <ElSelect
                v-model="form.brandId"
                filterable
                clearable
                class="w-full"
                placeholder="请选择品牌"
              >
                <ElOption
                  v-for="item in brandOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="分类" prop="categoryId">
              <ElCascader
                ref="cascaderRef"
                v-model="categoryPath"
                :options="categoryOptions"
                :props="cascaderProps"
                clearable
                filterable
                class="w-full"
                placeholder="请选择分类"
                @change="handleCategoryChange"
              />
            </ElFormItem>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <template #header>
            <div class="text-base font-semibold text-[var(--el-text-color-primary)]">商品概览</div>
          </template>

          <div class="space-y-4 text-sm">
            <div class="flex items-start justify-between gap-4">
              <span class="text-[var(--el-text-color-secondary)]">品牌</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ selectedBrandName || '未选择' }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-[var(--el-text-color-secondary)]">分类</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ selectedCategoryText || '未选择' }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-[var(--el-text-color-secondary)]">SPU 编码</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ form.spuCode || '自动生成' }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-[var(--el-text-color-secondary)]">SKU 数量</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ form.skuStockList.length }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <span class="text-[var(--el-text-color-secondary)]">关键词</span>
              <span class="text-right text-[var(--el-text-color-primary)]">
                {{ form.keywords || '未填写' }}
              </span>
            </div>
          </div>
        </ElCard>

        <ElCard class="art-card" shadow="never">
          <template #header>
            <div class="text-base font-semibold text-[var(--el-text-color-primary)]">提交检查</div>
          </template>

          <div class="space-y-3">
            <div
              v-for="item in submitChecks"
              :key="item.label"
              class="flex items-center justify-between rounded-lg border border-[var(--el-border-color-light)] px-3 py-2"
            >
              <span class="text-sm text-[var(--el-text-color-secondary)]">{{ item.label }}</span>
              <ElTag :type="item.done ? 'success' : 'warning'" effect="light">
                {{ item.done ? '已完成' : '待完善' }}
              </ElTag>
            </div>

            <ElAlert
              :title="
                requiredMissingCount
                  ? `还有 ${requiredMissingCount} 项核心内容待完善`
                  : '核心内容已完整，可直接提交'
              "
              :type="requiredMissingCount ? 'warning' : 'success'"
              :closable="false"
              show-icon
            />
          </div>
        </ElCard>
      </div>
    </ElForm>

    <div class="mt-4 border-t border-[var(--el-border-color-light)] px-5 py-3">
      <div class="flex items-center justify-end gap-3">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">保存商品</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { CascaderValue, FormInstance, FormRules } from 'element-plus'
  import { fetchBrandPage, type BrandListItem } from '@/api/brand'
  import { fetchCategoryTree, type CategoryTreeItem } from '@/api/category'
  import { createCategoryAttribute, bindCategoryAttributesBatch } from '@/api/category-attribute'
  import {
    fetchCategoryParams,
    fetchCategorySpecs,
    type CategoryAttributeRelationItem
  } from '@/api/category-attribute'
  import {
    createSpu,
    getSpu,
    updateSpu,
    type AttrValueItem,
    type SpuDetailItem,
    type SpuFormSkuItem,
    type SpuSavePayload
  } from '@/api/spu'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import SpuImageUploader from './spu-image-uploader.vue'
  import SpuSkuEditor from './spu-sku-editor.vue'
  import SpecTagSelector from './spec-tag-selector.vue'
  import { markSpuListDirty } from './spu-list-cache'

  interface SpuFormState {
    id?: number
    brandId?: number
    categoryId?: number
    name: string
    subTitle: string
    keywords: string
    description: string
    detailHtml: string
    unit: string
    weight?: number
    sort: number
    publishStatus: 0 | 1
    recommendStatus: 0 | 1
    pic: string
    albumPics: string[]
    spuCode: string
    attrValueList: AttrValueItem[]
    skuStockList: SpuFormSkuItem[]
  }

  defineOptions({ name: 'ProductSpuDetailPage' })

  const router = useRouter()
  const route = useRoute()
  const isEdit = computed(() => Boolean(route.params.id))

  const loading = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const skuSectionRef = ref()
  const cascaderRef = ref()
  const brandOptions = ref<BrandListItem[]>([])
  const categoryOptions = ref<CategoryTreeItem[]>([])
  const paramDefs = ref<CategoryAttributeRelationItem[]>([])
  const specDefs = ref<CategoryAttributeRelationItem[]>([])
  const categoryPath = ref<number[]>([])
  const paramValueMap = reactive<Record<number, string>>({})
  const specSelectionMap = reactive<Record<number, string[]>>({})

  interface CustomSpecItem {
    tempId: number
    attrName: string
    values: string[]
  }

  let nextTempId = -1
  const customSpecs = ref<CustomSpecItem[]>([])

  const cascaderProps = {
    label: 'name',
    value: 'id',
    children: 'children',
    emitPath: true,
    checkStrictly: true,
    showPrefix: false
  }

  const createDefaultSku = (): SpuFormSkuItem => ({
    skuCode: '',
    pic: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    lowStock: 0,
    spData: '[]',
    enableStatus: 1
  })

  const createDefaultForm = (): SpuFormState => ({
    id: undefined,
    brandId: undefined,
    categoryId: undefined,
    name: '',
    subTitle: '',
    keywords: '',
    description: '',
    detailHtml: '',
    unit: '',
    weight: undefined,
    sort: 0,
    publishStatus: 1,
    recommendStatus: 0,
    pic: '',
    albumPics: [],
    spuCode: '',
    attrValueList: [],
    skuStockList: [createDefaultSku()]
  })

  const form = reactive<SpuFormState>(createDefaultForm())

  const rules: FormRules = {
    brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
    keywords: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
    description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }]
  }

  const mainPicList = computed<string[]>({
    get: () => (form.pic ? [form.pic] : []),
    set: (value) => {
      form.pic = value[0] || ''
    }
  })

  const albumPicList = computed<string[]>({
    get: () => form.albumPics || [],
    set: (value) => {
      form.albumPics = [...value]
    }
  })

  const selectedBrandName = computed(
    () => brandOptions.value.find((item) => item.id === form.brandId)?.name || ''
  )

  const selectedCategoryText = computed(() => {
    if (!categoryPath.value.length) {
      return ''
    }

    const labels: string[] = []
    const walk = (items: CategoryTreeItem[], path: number[] = []) => {
      for (const item of items) {
        const currentPath = [...path, item.id]
        if (currentPath.join(',') === categoryPath.value.join(',')) {
          labels.splice(0, labels.length, ...currentPath.map((id) => findCategoryName(id)))
          return true
        }
        if (item.children?.length && walk(item.children, currentPath)) {
          return true
        }
      }
      return false
    }

    const findCategoryName = (id: number): string => {
      const queue = [...categoryOptions.value]
      while (queue.length) {
        const current = queue.shift()!
        if (current.id === id) return current.name
        if (current.children?.length) queue.push(...current.children)
      }
      return ''
    }

    walk(categoryOptions.value)
    return labels.filter(Boolean).join(' / ')
  })

  const hasSpecSelection = computed(
    () =>
      specDefs.value.some((item) => (specSelectionMap[item.attrId] || []).length > 0) ||
      customSpecs.value.some((item) => item.attrName.trim() && item.values.length)
  )

  const hasValidSkuPrice = computed(() =>
    form.skuStockList.some((item) => Number(item.price ?? 0) > 0)
  )

  const submitChecks = computed(() => [
    {
      label: '商品信息',
      done: Boolean(form.brandId && form.categoryId && form.name.trim())
    },
    {
      label: '内容文案',
      done: Boolean(form.keywords.trim() && form.description.trim())
    },
    {
      label: '图片素材',
      done: Boolean(form.pic)
    },
    {
      label: '多规格与库存',
      done: hasValidSkuPrice.value
    }
  ])

  const requiredMissingCount = computed(
    () => submitChecks.value.filter((item) => !item.done).length
  )

  const ensureSingleSku = () => {
    if (!form.skuStockList.length) {
      form.skuStockList = [createDefaultSku()]
    }
  }

  const parseSpecData = (value?: string): AttrValueItem[] => {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const buildSpecKey = (items: AttrValueItem[]) =>
    items.map((item) => `${item.attrId ?? item.attrName}:${item.attrValue}`).join('|')

  const clearParamValues = () => {
    Object.keys(paramValueMap).forEach((key) => {
      delete paramValueMap[Number(key)]
    })
  }

  const clearSpecSelections = () => {
    Object.keys(specSelectionMap).forEach((key) => {
      delete specSelectionMap[Number(key)]
    })
  }

  const syncParamValueMap = (items: AttrValueItem[] = []) => {
    clearParamValues()
    paramDefs.value.forEach((item) => {
      const current = items.find((attr) => attr.attrId === item.attrId)
      paramValueMap[item.attrId] = String(current?.attrValue || '')
    })
  }

  const syncSpecSelectionFromSku = () => {
    clearSpecSelections()
    customSpecs.value = []

    form.skuStockList.forEach((sku) => {
      parseSpecData(sku.spData).forEach((item) => {
        if (!item.attrValue) return

        if (item.attrId) {
          // 预设规格
          const current = specSelectionMap[item.attrId] || []
          specSelectionMap[item.attrId] = Array.from(new Set([...current, item.attrValue]))
        } else if (item.attrName) {
          // 自定义规格（编辑回填）
          let existing = customSpecs.value.find((s) => s.attrName === item.attrName)
          if (!existing) {
            existing = { tempId: nextTempId--, attrName: item.attrName, values: [] }
            customSpecs.value.push(existing)
          }
          if (!existing.values.includes(item.attrValue)) {
            existing.values.push(item.attrValue)
          }
        }
      })
    })
  }

  const buildCartesianProduct = <T,>(groups: T[][]) =>
    groups.reduce<T[][]>(
      (accumulator, current) => {
        if (!current.length) {
          return accumulator
        }
        return accumulator.flatMap((items) => current.map((item) => [...items, item]))
      },
      [[]]
    )

  const handleSpecSelectionChange = () => {
    // 预设规格
    const selectedSpecs = specDefs.value
      .map((item) => ({
        attrId: item.attrId as number | undefined,
        attrName: item.attrName,
        values: specSelectionMap[item.attrId] || []
      }))
      .filter((item) => item.values.length)

    // 自定义规格
    const customSpecItems = customSpecs.value
      .filter((item) => item.attrName.trim() && item.values.length)
      .map((item) => ({
        attrId: undefined as number | undefined,
        attrName: item.attrName,
        values: item.values
      }))

    const allSpecs = [...selectedSpecs, ...customSpecItems]

    if (!allSpecs.length) {
      form.skuStockList = [createDefaultSku()]
      return
    }

    const previousMap = new Map<string, SpuFormSkuItem>(
      form.skuStockList.map(
        (item) =>
          [buildSpecKey(parseSpecData(item.spData)), JSON.parse(JSON.stringify(item))] as const
      )
    )

    const groups = allSpecs.map((item) =>
      item.values.map<AttrValueItem>((value) => ({
        attrId: item.attrId,
        attrName: item.attrName,
        attrValue: value
      }))
    )

    const combinations = buildCartesianProduct(groups)
    form.skuStockList = combinations.map((items) => {
      const key = buildSpecKey(items)
      const previous = previousMap.get(key)
      return {
        ...createDefaultSku(),
        ...previous,
        spData: JSON.stringify(items)
      }
    })
  }

  const addCustomSpec = () => {
    customSpecs.value.push({
      tempId: nextTempId--,
      attrName: '',
      values: []
    })
  }

  const removeCustomSpec = (tempId: number) => {
    customSpecs.value = customSpecs.value.filter((item) => item.tempId !== tempId)
    handleSpecSelectionChange()
  }

  const resolveCategoryPath = (categoryId?: number) => {
    if (!categoryId) {
      categoryPath.value = []
      return
    }

    const walk = (items: CategoryTreeItem[], path: number[] = []): number[] => {
      for (const item of items) {
        const currentPath = [...path, item.id]
        if (item.id === categoryId) {
          return currentPath
        }
        if (item.children?.length) {
          const childPath = walk(item.children, currentPath)
          if (childPath.length) return childPath
        }
      }
      return []
    }

    categoryPath.value = walk(categoryOptions.value)
  }

  const loadCategoryMeta = async (categoryId?: number) => {
    if (!categoryId) {
      paramDefs.value = []
      specDefs.value = []
      customSpecs.value = []
      nextTempId = -1
      clearParamValues()
      clearSpecSelections()
      ensureSingleSku()
      return
    }

    const [params, specs] = await Promise.all([
      fetchCategoryParams(categoryId),
      fetchCategorySpecs(categoryId)
    ])

    paramDefs.value = params
    specDefs.value = specs
  }

  const applyFormData = (data?: SpuDetailItem) => {
    Object.assign(form, createDefaultForm())

    if (!data) {
      categoryPath.value = []
      clearParamValues()
      clearSpecSelections()
      ensureSingleSku()
      return
    }

    Object.assign(form, {
      id: data.id,
      brandId: data.brandId,
      categoryId: data.categoryId,
      name: data.name || '',
      subTitle: data.subTitle || '',
      keywords: data.keywords || '',
      description: data.description || '',
      detailHtml: data.detailHtml || data.detailMobileHtml || '',
      unit: data.unit || '',
      weight: data.weight,
      sort: data.sort ?? 0,
      publishStatus: data.publishStatus ?? 0,
      recommendStatus: data.recommendStatus ?? 0,
      pic: data.pic || '',
      albumPics: data.albumPics || [],
      spuCode: data.spuCode || '',
      attrValueList: data.attrValueList || [],
      skuStockList: data.skuStockList?.length ? data.skuStockList : [createDefaultSku()]
    })

    syncParamValueMap(form.attrValueList)
    syncSpecSelectionFromSku()
    ensureSingleSku()
  }

  const loadBaseOptions = async () => {
    const [brands, categories] = await Promise.all([
      fetchBrandPage({ current: 1, size: 1000 }),
      fetchCategoryTree()
    ])
    brandOptions.value = brands.records
    categoryOptions.value = categories
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
    resolveCategoryPath(data.categoryId)
  }

  const handleCategoryChange = async (value: CascaderValue | null | undefined) => {
    const path = Array.isArray(value) ? value.map((item) => Number(item)) : []
    categoryPath.value = path
    form.categoryId = path.length ? path[path.length - 1] : undefined
    syncParamValueMap([])
    clearSpecSelections()
    customSpecs.value = []
    nextTempId = -1
    form.skuStockList = [createDefaultSku()]
    ensureSingleSku()
    cascaderRef.value?.togglePopperVisible?.(false)
    await loadCategoryMeta(form.categoryId)
  }

  const handleReset = async () => {
    loading.value = true
    try {
      await loadDetail()
    } finally {
      loading.value = false
    }
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
      detailHtml: String(form.detailHtml || '').trim(),
      detailMobileHtml: String(form.detailHtml || '').trim(),
      attrValueList,
      skuList
    }
  }

  /** 提交前将自定义规格持久化到分类属性池，获取真实 attrId */
  const persistCustomSpecs = async () => {
    for (const spec of customSpecs.value) {
      if (!spec.attrName.trim() || !spec.values.length) continue

      // 创建属性到属性池
      const newAttrId = await createCategoryAttribute({
        name: spec.attrName.trim(),
        type: 1,
        entryMethod: 0,
        searchable: 0,
        filterable: 0,
        optionList: spec.values
      })

      // 绑定到当前分类
      await bindCategoryAttributesBatch(form.categoryId!, [
        {
          categoryId: form.categoryId!,
          attrId: newAttrId,
          options: spec.values
        }
      ])

      // 更新 SKU 中对应规格的 attrId
      form.skuStockList.forEach((sku) => {
        const parsed = parseSpecData(sku.spData)
        let changed = false
        parsed.forEach((item) => {
          if (!item.attrId && item.attrName === spec.attrName) {
            item.attrId = newAttrId
            changed = true
          }
        })
        if (changed) {
          sku.spData = JSON.stringify(parsed)
        }
      })
    }
  }

  const scrollToSkuSection = async () => {
    await nextTick()
    const target = skuSectionRef.value?.$el || skuSectionRef.value
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    if (!form.pic) {
      ElMessage.warning('请先上传商品主图')
      return
    }

    if (!hasValidSkuPrice.value) {
      ElMessage.warning('请至少填写一个有效 SKU 售价')
      await scrollToSkuSection()
      return
    }

    saving.value = true
    try {
      await persistCustomSpecs()
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
  .spu-detail-page__sku-card {
    scroll-margin-top: 88px;
  }
</style>
