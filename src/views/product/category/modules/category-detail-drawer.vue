<template>
  <ElDrawer
    v-model="visible"
    :size="drawerSize"
    :title="drawerTitle"
    destroy-on-close
    append-to-body
    @closed="handleClosed"
  >
    <div class="category-detail-drawer flex h-full min-h-0 flex-col gap-4">
      <EaseSegmentTabs v-model="activeTab" :items="tabOptions" />

      <div
        v-loading="activeTabLoading"
        class="category-detail-drawer__body min-h-0 flex-1 overflow-hidden"
      >
        <ElScrollbar class="h-full pr-1">
          <section v-show="activeTab === 'basic'" class="space-y-4">
            <ElForm
              ref="formRef"
              :model="formData"
              :rules="rules"
              label-position="top"
              class="space-y-4"
            >
              <ElCard shadow="never" class="art-card-xs">
                <template #header>
                  <span class="category-detail-drawer__section-title">分类属性</span>
                </template>

                <ElFormItem label="上级分类" prop="parentId">
                  <ElTreeSelect
                    v-model="formData.parentId"
                    :data="treeOptions"
                    :props="{ label: 'name', value: 'id', children: 'children' }"
                    check-strictly
                    clearable
                    class="w-full"
                    placeholder="请选择上级分类"
                  />
                </ElFormItem>

                <ElFormItem label="分类名称" prop="name">
                  <ElInput
                    v-model.trim="formData.name"
                    maxlength="100"
                    placeholder="请输入分类名称"
                    class="w-full"
                  />
                </ElFormItem>

                <ElFormItem label="排序" class="mb-0">
                  <ElInputNumber
                    v-model="formData.sort"
                    :min="0"
                    :max="999"
                    controls-position="right"
                    class="w-full"
                  />
                </ElFormItem>

                <div class="category-detail-drawer__switch-list">
                  <div class="category-detail-drawer__switch-row">
                    <div class="category-detail-drawer__switch-label">显示状态</div>
                    <ElSwitch v-model="enableStatusValue" />
                  </div>

                  <div class="category-detail-drawer__switch-row">
                    <div class="category-detail-drawer__switch-label">导航显示</div>
                    <ElSwitch v-model="navStatusValue" />
                  </div>
                </div>
              </ElCard>

              <ElCard shadow="never" class="art-card-xs">
                <template #header>
                  <span class="category-detail-drawer__section-title">展示与 SEO</span>
                </template>

                <ElFormItem label="图标">
                  <CategoryIconPicker v-model="formData.icon" />
                </ElFormItem>

                <ElFormItem label="图片地址">
                  <CategoryImageField v-model="formData.image" />
                </ElFormItem>

                <ElFormItem label="关键词">
                  <ElInput
                    v-model.trim="formData.keywords"
                    placeholder="请输入 SEO 关键词"
                    class="w-full"
                  />
                </ElFormItem>

                <ElFormItem label="描述" class="mb-0">
                  <ElInput
                    v-model.trim="formData.description"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入分类描述"
                    class="w-full"
                  />
                </ElFormItem>
              </ElCard>
            </ElForm>
          </section>

          <section v-if="canBind && activeTab === 'spec'" class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="category-detail-drawer__summary"
                >已绑定 {{ specRows.length }} 个规格属性</div
              >
              <ElButton @click="openBindDialog('spec')">从规格库选择</ElButton>
            </div>

            <div v-if="specRows.length" class="space-y-3">
              <article
                v-for="row in specRows"
                :key="`spec-${row.attrId}`"
                class="category-detail-drawer__card"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="category-detail-drawer__item-title">{{ row.attrName }}</div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <ElTag effect="plain">
                      {{ Number(row.entryMethod) === 1 ? '预设选项' : '手工录入' }}
                    </ElTag>
                    <ElTag v-if="Number(row.required) === 1" effect="plain" type="warning">
                      必填
                    </ElTag>
                  </div>
                </div>

                <div class="mt-4">
                  <OptionTagInput
                    v-if="Number(row.entryMethod) === 1"
                    v-model="optionDraftMap[row.attrId]"
                    add-label="添加规格值"
                    input-placeholder="输入后按回车或逗号添加规格值"
                  />
                  <div v-else class="category-detail-drawer__helper">
                    手工录入规格，无需维护预设选项
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap justify-end gap-2">
                  <ElButton
                    v-if="Number(row.entryMethod) === 1"
                    :loading="savingAttrIds.includes(row.attrId)"
                    @click="handleSaveAttribute('spec', row)"
                  >
                    保存
                  </ElButton>
                  <ElButton
                    type="danger"
                    plain
                    :loading="removingAttrIds.includes(row.attrId)"
                    @click="handleUnbindAttribute('spec', row)"
                  >
                    解绑
                  </ElButton>
                </div>
              </article>
            </div>

            <ElEmpty v-else description="暂未绑定规格属性" />
          </section>

          <section v-if="canBind && activeTab === 'param'" class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="category-detail-drawer__summary"
                >已绑定 {{ paramRows.length }} 个参数属性</div
              >
              <ElButton @click="openBindDialog('param')">从参数库选择</ElButton>
            </div>

            <div v-if="paramRows.length" class="space-y-3">
              <article
                v-for="row in paramRows"
                :key="`param-${row.attrId}`"
                class="category-detail-drawer__card"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="category-detail-drawer__item-title">{{ row.attrName }}</div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <ElTag effect="plain">
                      {{ Number(row.entryMethod) === 1 ? '预设选项' : '手工录入' }}
                    </ElTag>
                    <ElTag v-if="Number(row.filterable) === 1" effect="plain" type="success">
                      支持筛选
                    </ElTag>
                  </div>
                </div>

                <div class="mt-4">
                  <OptionTagInput
                    v-if="Number(row.entryMethod) === 1"
                    v-model="optionDraftMap[row.attrId]"
                    add-label="添加参数值"
                    input-placeholder="输入后按回车或逗号添加参数值"
                  />
                  <div v-else class="category-detail-drawer__helper">
                    手工录入参数，无需维护预设选项
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap justify-end gap-2">
                  <ElButton
                    v-if="Number(row.entryMethod) === 1"
                    :loading="savingAttrIds.includes(row.attrId)"
                    @click="handleSaveAttribute('param', row)"
                  >
                    保存
                  </ElButton>
                  <ElButton
                    type="danger"
                    plain
                    :loading="removingAttrIds.includes(row.attrId)"
                    @click="handleUnbindAttribute('param', row)"
                  >
                    解绑
                  </ElButton>
                </div>
              </article>
            </div>

            <ElEmpty v-else description="暂未绑定参数属性" />
          </section>

          <section v-if="canBind && activeTab === 'brand'" class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="category-detail-drawer__summary"
                >已绑定 {{ brandRows.length }} 个品牌</div
              >
              <ElButton @click="openBindDialog('brand')">绑定品牌</ElButton>
            </div>

            <div v-if="brandRows.length" class="space-y-3">
              <article
                v-for="row in brandRows"
                :key="`brand-${row.id}`"
                class="category-detail-drawer__card"
              >
                <div class="flex items-start gap-3">
                  <ElAvatar :src="row.logo" :size="40" shape="square">
                    {{ String(row.name || '').slice(0, 1) }}
                  </ElAvatar>

                  <div class="min-w-0 flex-1">
                    <div class="category-detail-drawer__item-title truncate">{{ row.name }}</div>
                    <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
                      排序 {{ row.sort ?? 0 }}
                    </div>
                  </div>

                  <ElButton
                    type="danger"
                    plain
                    :loading="removingBrandIds.includes(row.id)"
                    @click="handleUnbindBrand(row)"
                  >
                    解绑
                  </ElButton>
                </div>
              </article>
            </div>

            <ElEmpty v-else description="暂未绑定品牌" />
          </section>
        </ElScrollbar>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="category-detail-drawer__footer-tip">
          <template v-if="activeTab === 'basic'">
            {{
              mode === 'add'
                ? '创建后可继续完善分类结构和末级属性绑定。'
                : '分类属性修改会影响分类展示与搜索。'
            }}
          </template>
          <template v-else>绑定操作即时生效，属性值编辑后请记得单独保存。</template>
        </div>

        <div class="flex items-center gap-2">
          <ElButton @click="visible = false">关闭</ElButton>
          <ElButton
            v-if="activeTab === 'basic'"
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ mode === 'add' ? '创建分类' : '保存信息' }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDrawer>

  <ElDialog
    v-model="bindDialogVisible"
    :title="bindDialogTitle"
    :width="bindDialogWidth"
    top="8vh"
    append-to-body
    destroy-on-close
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 md:flex-row">
        <ElInput
          v-model.trim="bindKeyword"
          clearable
          placeholder="搜索名称或 ID"
          class="w-full md:flex-1"
          @keyup.enter="loadBindList"
          @clear="loadBindList"
        />
        <ElButton :loading="bindLoading" @click="loadBindList">搜索</ElButton>
      </div>

      <div v-loading="bindLoading" class="max-h-[56vh] overflow-y-auto pr-1">
        <div v-if="bindType !== 'brand' && bindAttributeList.length" class="space-y-3">
          <article
            v-for="item in bindAttributeList"
            :key="`bind-attr-${item.id}`"
            class="category-detail-drawer__card"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="category-detail-drawer__item-title">{{ item.name }}</div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <ElTag effect="plain">
                  {{ Number(item.entryMethod) === 1 ? '预设选项' : '手工录入' }}
                </ElTag>
                <ElButton @click="handleBindAttribute(item)">绑定</ElButton>
              </div>
            </div>

            <div v-if="item.optionList.length" class="mt-3">
              <OptionTagPreview :options="item.optionList" />
            </div>
          </article>
        </div>

        <div v-else-if="bindType === 'brand' && filteredBindBrands.length" class="space-y-3">
          <article
            v-for="item in filteredBindBrands"
            :key="`bind-brand-${item.id}`"
            class="category-detail-drawer__card"
          >
            <div class="flex items-start gap-3">
              <ElAvatar :src="item.logo" :size="40" shape="square">
                {{ String(item.name || '').slice(0, 1) }}
              </ElAvatar>

              <div class="min-w-0 flex-1">
                <div class="category-detail-drawer__item-title truncate">{{ item.name }}</div>
              </div>

              <ElButton @click="handleBindBrand(item)">绑定</ElButton>
            </div>
          </article>
        </div>

        <ElEmpty v-else description="暂无可绑定数据" />
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import type { FormInstance } from 'element-plus'
  import { ElMessageBox } from 'element-plus'
  import EaseSegmentTabs from '@/components/project/ease-segment-tabs/index.vue'
  import {
    createCategory,
    getCategory,
    updateCategory,
    type CategoryDetailItem,
    type CategorySavePayload,
    type CategoryTreeItem
  } from '@/api/category'
  import {
    bindCategoryAttributesBatch,
    fetchCategoryParams,
    fetchCategorySpecs,
    fetchUnboundCategoryAttributes,
    unbindCategoryAttribute,
    updateCategoryAttributeRelation,
    type CategoryAttributePoolItem,
    type CategoryAttributeRelationItem
  } from '@/api/category-attribute'
  import {
    bindCategoryBrandsBatch,
    fetchBrandsByCategoryId,
    fetchUnboundBrandsByCategoryId,
    unbindCategoryBrand,
    type BrandListItem
  } from '@/api/brand'
  import CategoryImageField from './category-image-field.vue'
  import CategoryIconPicker from './category-icon-picker.vue'
  import OptionTagInput from './option-tag-input.vue'
  import OptionTagPreview from './option-tag-preview.vue'

  type DrawerMode = 'add' | 'edit'
  type DrawerTab = 'basic' | 'spec' | 'param' | 'brand'
  type ConfigTab = 'spec' | 'param' | 'brand'

  interface Props {
    modelValue: boolean
    mode: DrawerMode
    categoryData?: Partial<CategoryTreeItem> | null
    treeData: CategoryTreeItem[]
    breadcrumb?: string[]
    initialTab?: DrawerTab
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success', categoryId?: number): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    mode: 'edit',
    categoryData: null,
    breadcrumb: () => [],
    initialTab: 'basic'
  })

  defineOptions({ name: 'CategoryDetailDrawer' })

  const emit = defineEmits<Emits>()
  const { width } = useWindowSize()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const activeTab = ref<DrawerTab>('basic')
  const basicLoading = ref(false)
  const specLoading = ref(false)
  const paramLoading = ref(false)
  const brandLoading = ref(false)
  const loadedTabs = reactive<Record<DrawerTab, boolean>>({
    basic: false,
    spec: false,
    param: false,
    brand: false
  })

  const defaultFormData: CategorySavePayload = {
    id: undefined,
    parentId: 0,
    name: '',
    enableStatus: 1,
    isNav: 1,
    sort: 0,
    icon: '',
    image: '',
    keywords: '',
    description: ''
  }

  const formData = reactive<CategorySavePayload>({ ...defaultFormData })

  const drawerSize = computed(() => (width.value < 1024 ? 'calc(100vw - 24px)' : '620px'))
  const bindDialogWidth = computed(() => (width.value < 768 ? 'calc(100vw - 24px)' : '720px'))
  const drawerTitle = computed(() => (props.mode === 'add' ? '新增分类' : '分类详情'))
  const categoryId = computed(() => Number(props.categoryData?.id || 0))
  const canBind = computed(
    () => props.mode === 'edit' && categoryId.value > 0 && !props.categoryData?.children?.length
  )

  const tabOptions = computed(() => {
    const items: Array<{ label: string; value: DrawerTab }> = [
      { label: '分类属性', value: 'basic' }
    ]
    if (canBind.value) {
      items.push(
        { label: '规格绑定', value: 'spec' },
        { label: '参数绑定', value: 'param' },
        { label: '品牌绑定', value: 'brand' }
      )
    }
    return items
  })

  const activeTabLoading = computed(() => {
    if (activeTab.value === 'basic') return basicLoading.value
    if (activeTab.value === 'spec') return specLoading.value
    if (activeTab.value === 'param') return paramLoading.value
    return brandLoading.value
  })

  const treeOptions = computed(() => [
    { id: 0, name: '无（一级分类）', children: [] as CategoryTreeItem[] },
    ...props.treeData
  ])

  const enableStatusValue = computed({
    get: () => Number(formData.enableStatus ?? 1) === 1,
    set: (value: boolean) => {
      formData.enableStatus = value ? 1 : 0
    }
  })

  const navStatusValue = computed({
    get: () => Number(formData.isNav ?? 1) === 1,
    set: (value: boolean) => {
      formData.isNav = value ? 1 : 0
    }
  })

  const rules = {
    parentId: [{ required: true, message: '请选择上级分类', trigger: 'change' }],
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
  }

  const specRows = ref<CategoryAttributeRelationItem[]>([])
  const paramRows = ref<CategoryAttributeRelationItem[]>([])
  const brandRows = ref<BrandListItem[]>([])
  const optionDraftMap = ref<Record<number, string[]>>({})
  const savingAttrIds = ref<number[]>([])
  const removingAttrIds = ref<number[]>([])
  const removingBrandIds = ref<number[]>([])

  const bindDialogVisible = ref(false)
  const bindType = ref<ConfigTab>('spec')
  const bindKeyword = ref('')
  const bindLoading = ref(false)
  const bindAttributeList = ref<CategoryAttributePoolItem[]>([])
  const bindBrandList = ref<BrandListItem[]>([])

  const bindDialogTitle = computed(() => {
    if (bindType.value === 'spec') return '从规格库选择'
    if (bindType.value === 'param') return '从参数库选择'
    return '绑定品牌'
  })

  const filteredBindBrands = computed(() => {
    const keyword = bindKeyword.value.trim()
    if (!keyword) return bindBrandList.value
    return bindBrandList.value.filter(
      (item) => item.name.includes(keyword) || String(item.id).includes(keyword)
    )
  })

  function applyFormData(data?: Partial<CategoryDetailItem | CategorySavePayload>) {
    Object.assign(formData, {
      ...defaultFormData,
      ...data,
      parentId: Number(data?.parentId ?? 0),
      enableStatus: Number(data?.enableStatus ?? 1) === 1 ? 1 : 0,
      isNav: Number(data?.isNav ?? 1) === 1 ? 1 : 0,
      sort: Number(data?.sort ?? 0)
    })
  }

  function syncOptionDrafts(rows: CategoryAttributeRelationItem[]) {
    const nextMap = { ...optionDraftMap.value }
    rows.forEach((row) => {
      nextMap[row.attrId] = [...(row.optionList || [])]
    })
    optionDraftMap.value = nextMap
  }

  function resetBindState() {
    specRows.value = []
    paramRows.value = []
    brandRows.value = []
    optionDraftMap.value = {}
    savingAttrIds.value = []
    removingAttrIds.value = []
    removingBrandIds.value = []
    bindDialogVisible.value = false
    bindKeyword.value = ''
    bindLoading.value = false
    bindAttributeList.value = []
    bindBrandList.value = []
    bindType.value = 'spec'
  }

  function resetLoadedState() {
    loadedTabs.basic = false
    loadedTabs.spec = false
    loadedTabs.param = false
    loadedTabs.brand = false
    basicLoading.value = false
    specLoading.value = false
    paramLoading.value = false
    brandLoading.value = false
  }

  function resetForm() {
    applyFormData(defaultFormData)
    formRef.value?.clearValidate?.()
  }

  function resetState() {
    submitting.value = false
    activeTab.value = 'basic'
    resetLoadedState()
    resetForm()
    resetBindState()
  }

  function handleClosed() {
    resetState()
  }

  function resolveOpenTab() {
    if (props.initialTab !== 'basic' && !canBind.value) return 'basic'
    return props.initialTab
  }

  async function loadCategoryDetail(force = false) {
    if (!categoryId.value) return
    if (basicLoading.value || (!force && loadedTabs.basic)) return

    const requestCategoryId = categoryId.value
    basicLoading.value = true
    try {
      const detail = await getCategory(requestCategoryId)
      if (!visible.value || categoryId.value !== requestCategoryId) return

      applyFormData(detail)
      loadedTabs.basic = true
      nextTick(() => formRef.value?.clearValidate?.())
    } finally {
      basicLoading.value = false
    }
  }

  async function loadSpecRows(force = false) {
    if (!canBind.value) return
    if (specLoading.value || (!force && loadedTabs.spec)) return

    const requestCategoryId = categoryId.value
    specLoading.value = true
    try {
      const specs = await fetchCategorySpecs(requestCategoryId)
      if (!visible.value || categoryId.value !== requestCategoryId) return

      specRows.value = specs
      syncOptionDrafts(specs)
      loadedTabs.spec = true
    } finally {
      specLoading.value = false
    }
  }

  async function loadParamRows(force = false) {
    if (!canBind.value) return
    if (paramLoading.value || (!force && loadedTabs.param)) return

    const requestCategoryId = categoryId.value
    paramLoading.value = true
    try {
      const params = await fetchCategoryParams(requestCategoryId)
      if (!visible.value || categoryId.value !== requestCategoryId) return

      paramRows.value = params
      syncOptionDrafts(params)
      loadedTabs.param = true
    } finally {
      paramLoading.value = false
    }
  }

  async function loadBrandRows(force = false) {
    if (!canBind.value) return
    if (brandLoading.value || (!force && loadedTabs.brand)) return

    const requestCategoryId = categoryId.value
    brandLoading.value = true
    try {
      const brands = await fetchBrandsByCategoryId(requestCategoryId)
      if (!visible.value || categoryId.value !== requestCategoryId) return

      brandRows.value = brands
      loadedTabs.brand = true
    } finally {
      brandLoading.value = false
    }
  }

  async function loadAttributeRows(tab: 'spec' | 'param', force = false) {
    if (tab === 'spec') {
      await loadSpecRows(force)
      return
    }

    await loadParamRows(force)
  }

  async function loadActiveTab(force = false) {
    if (activeTab.value === 'basic') {
      if (props.mode === 'edit') {
        await loadCategoryDetail(force)
      } else {
        loadedTabs.basic = true
      }
      return
    }

    if (activeTab.value === 'spec') {
      await loadSpecRows(force)
      return
    }

    if (activeTab.value === 'param') {
      await loadParamRows(force)
      return
    }

    await loadBrandRows(force)
  }

  async function initializeDrawer() {
    resetForm()
    resetBindState()
    resetLoadedState()
    activeTab.value = resolveOpenTab()

    if (props.mode === 'edit') {
      await loadActiveTab(true)
      return
    }

    applyFormData({
      ...defaultFormData,
      parentId: Number(props.categoryData?.parentId ?? 0)
    })
    loadedTabs.basic = true
    nextTick(() => formRef.value?.clearValidate?.())
  }

  async function handleSubmit() {
    await formRef.value?.validate?.()
    submitting.value = true

    try {
      const payload: CategorySavePayload = {
        id: formData.id,
        parentId: Number(formData.parentId ?? 0),
        name: String(formData.name || '').trim(),
        enableStatus: Number(formData.enableStatus ?? 1) as 0 | 1,
        isNav: Number(formData.isNav ?? 1) as 0 | 1,
        sort: Number(formData.sort ?? 0),
        icon: String(formData.icon || '').trim(),
        image: String(formData.image || '').trim(),
        keywords: String(formData.keywords || '').trim(),
        description: String(formData.description || '').trim()
      }

      let nextCategoryId = Number(payload.id || 0)

      if (props.mode === 'add') {
        nextCategoryId = await createCategory(payload)
      } else {
        await updateCategory(payload)
      }

      ElMessage.success(props.mode === 'add' ? '新增成功' : '更新成功')
      visible.value = false
      emit('success', nextCategoryId || payload.id)
    } finally {
      submitting.value = false
    }
  }

  async function loadBindList() {
    if (!canBind.value) return

    bindLoading.value = true
    try {
      if (bindType.value === 'brand') {
        bindBrandList.value = await fetchUnboundBrandsByCategoryId(categoryId.value)
        return
      }

      const result = await fetchUnboundCategoryAttributes(categoryId.value, {
        current: 1,
        size: 200,
        keyword: bindKeyword.value || undefined,
        type: bindType.value === 'spec' ? 1 : 0
      })
      bindAttributeList.value = result.records
    } finally {
      bindLoading.value = false
    }
  }

  function openBindDialog(type: ConfigTab) {
    if (!canBind.value) return

    bindType.value = type
    bindKeyword.value = ''
    bindAttributeList.value = []
    bindBrandList.value = []
    bindDialogVisible.value = true
    void loadBindList()
  }

  async function handleBindAttribute(item: CategoryAttributePoolItem) {
    if (!canBind.value) return

    const baseRows = bindType.value === 'spec' ? specRows.value : paramRows.value
    const nextSort =
      baseRows.reduce((maxValue, row) => Math.max(maxValue, Number(row.sort || 0)), 0) + 10

    await bindCategoryAttributesBatch(categoryId.value, [
      {
        categoryId: categoryId.value,
        attrId: item.id,
        groupName: bindType.value === 'spec' ? '销售规格' : '基础参数',
        sort: nextSort,
        required: 0,
        options: Number(item.entryMethod) === 1 ? item.optionList : []
      }
    ])

    ElMessage.success('绑定成功')
    await loadBindList()
    if (bindType.value !== 'brand') {
      await loadAttributeRows(bindType.value, true)
    }
  }

  async function handleBindBrand(item: BrandListItem) {
    if (!canBind.value) return

    await bindCategoryBrandsBatch(categoryId.value, [item.id])
    ElMessage.success('绑定成功')
    await loadBindList()
    await loadBrandRows(true)
  }

  async function handleSaveAttribute(tab: 'spec' | 'param', row: CategoryAttributeRelationItem) {
    if (!canBind.value) return

    savingAttrIds.value = [...savingAttrIds.value, row.attrId]
    try {
      await updateCategoryAttributeRelation({
        id: Number(row.relationId || 0),
        categoryId: categoryId.value,
        attrId: row.attrId,
        groupName: String(row.groupName || (tab === 'spec' ? '销售规格' : '基础参数')).trim(),
        sort: Number(row.sort || 0),
        required: Number(row.required ?? 0) === 1 ? 1 : 0,
        options: Number(row.entryMethod) === 1 ? optionDraftMap.value[row.attrId] || [] : []
      })

      ElMessage.success('保存成功')
      await loadAttributeRows(tab, true)
    } finally {
      savingAttrIds.value = savingAttrIds.value.filter((id) => id !== row.attrId)
    }
  }

  async function handleUnbindAttribute(tab: 'spec' | 'param', row: CategoryAttributeRelationItem) {
    if (!canBind.value) return

    try {
      await ElMessageBox.confirm(
        `确认解绑${tab === 'spec' ? '规格' : '参数'}「${row.attrName}」？`,
        '提示',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }

    removingAttrIds.value = [...removingAttrIds.value, row.attrId]
    try {
      await unbindCategoryAttribute(categoryId.value, row.attrId)
      ElMessage.success('解绑成功')
      await loadAttributeRows(tab, true)
      await loadBindList()
    } finally {
      removingAttrIds.value = removingAttrIds.value.filter((id) => id !== row.attrId)
    }
  }

  async function handleUnbindBrand(row: BrandListItem) {
    if (!canBind.value) return

    try {
      await ElMessageBox.confirm(`确认解绑品牌「${row.name}」？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    removingBrandIds.value = [...removingBrandIds.value, row.id]
    try {
      await unbindCategoryBrand(categoryId.value, row.id)
      ElMessage.success('解绑成功')
      await loadBrandRows(true)
      await loadBindList()
    } finally {
      removingBrandIds.value = removingBrandIds.value.filter((id) => id !== row.id)
    }
  }

  watch(
    () => formData.icon,
    (nextIcon) => {
      if (!String(nextIcon || '').trim()) return
      if (!String(formData.image || '').trim()) return
      formData.image = ''
    }
  )

  watch(
    () => formData.image,
    (nextImage) => {
      if (!String(nextImage || '').trim()) return
      if (!String(formData.icon || '').trim()) return
      formData.icon = ''
    }
  )

  watch(
    () => activeTab.value,
    () => {
      if (!visible.value) return
      void loadActiveTab()
    }
  )

  watch(
    () => [props.modelValue, props.mode, props.categoryData, props.initialTab],
    ([opened]) => {
      if (!opened) return
      void initializeDrawer()
    },
    { immediate: true }
  )

  watch(
    () => bindDialogVisible.value,
    (opened) => {
      if (opened) return
      bindKeyword.value = ''
      bindLoading.value = false
      bindAttributeList.value = []
      bindBrandList.value = []
    }
  )
</script>

<style scoped lang="scss">
  .category-detail-drawer {
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  .category-detail-drawer__body {
    min-height: 0;
  }

  .category-detail-drawer__section-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }

  .category-detail-drawer__summary,
  .category-detail-drawer__helper,
  .category-detail-drawer__footer-tip {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .category-detail-drawer__item-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  .category-detail-drawer__switch-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 18px;
  }

  .category-detail-drawer__switch-row {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
  }

  .category-detail-drawer__switch-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  .category-detail-drawer__card {
    padding: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--art-card-border);
    border-radius: var(--custom-radius);
  }

  :deep(.el-drawer__header) {
    margin-bottom: 0;
  }

  :deep(.el-drawer__title) {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  :deep(.el-input__inner),
  :deep(.el-textarea__inner),
  :deep(.el-input-number__input),
  :deep(.el-tree-select__wrapper) {
    font-size: 14px;
    line-height: 1.5;
  }

  :deep(.el-button) {
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.el-tag) {
    font-size: 12px;
    font-weight: 500;
  }

  :deep(.el-empty__description) {
    font-size: 13px;
  }
</style>
