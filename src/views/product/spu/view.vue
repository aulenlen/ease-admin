<template>
  <div class="space-y-4" v-loading="loading">
    <ElCard shadow="never" class="art-card-xs spu-view__hero">
      <div class="spu-view__hero-main">
        <div>
          <div class="spu-view__title">{{ detail?.name || '商品详情' }}</div>
          <div class="spu-view__meta">
            <span>商品编号：{{ detail?.spuCode || '-' }}</span>
            <span>品牌：{{ detail?.brandName || '-' }}</span>
            <span>分类：{{ detail?.categoryName || '-' }}</span>
            <span>销量：{{ detail?.sale ?? 0 }}</span>
          </div>
        </div>

        <div class="spu-view__actions flex gap-3">
          <ElButton @click="router.push('/product/spu')">返回列表</ElButton>
          <ElButton type="primary" @click="goEdit">编辑商品</ElButton>
        </div>
      </div>
    </ElCard>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-4">
        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">基础信息</span>
          </template>

          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="商品名称">{{ detail?.name || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="副标题">{{ detail?.subTitle || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="分类">{{ detail?.categoryName || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="关键词">{{ detail?.keywords || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="单位">{{ detail?.unit || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="重量">{{ detail?.weight ?? 0 }} g</ElDescriptionsItem>
            <ElDescriptionsItem label="排序">{{ detail?.sort ?? 0 }}</ElDescriptionsItem>
            <ElDescriptionsItem label="销量">{{ detail?.sale ?? 0 }}</ElDescriptionsItem>
            <ElDescriptionsItem label="描述" :span="2">
              {{ detail?.description || '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>

        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">参数与 SKU</span>
          </template>

          <div class="space-y-4">
            <div>
              <div class="mb-2 text-sm font-medium">商品参数</div>
              <div v-if="detail?.attrValueList?.length" class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in detail.attrValueList"
                  :key="`${item.attrId}-${item.attrValue}`"
                  effect="plain"
                >
                  {{ item.attrName }}：{{ item.attrValue }}
                </ElTag>
              </div>
              <ElEmpty v-else description="暂无商品参数" />
            </div>

            <div>
              <div class="mb-2 text-sm font-medium">SKU 列表</div>
              <ElTable :data="detail?.skuStockList || []" border>
                <ElTableColumn label="规格组合" min-width="220">
                  <template #default="{ row }">
                    <div class="flex flex-wrap gap-1.5">
                      <ElTag
                        v-for="item in parseSpecs(row.spData)"
                        :key="`${item.attrId}-${item.attrValue}`"
                        size="small"
                        effect="plain"
                      >
                        {{ item.attrName }}：{{ item.attrValue }}
                      </ElTag>
                      <span v-if="!parseSpecs(row.spData).length" class="text-xs text-g-500">
                        默认规格
                      </span>
                    </div>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="售价" prop="price" min-width="120" />
                <ElTableColumn label="市场价" prop="originalPrice" min-width="120" />
                <ElTableColumn label="库存" prop="stock" min-width="100" />
                <ElTableColumn label="低库存预警" prop="lowStock" min-width="120" />
              </ElTable>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">图文详情</span>
          </template>
          <div
            class="spu-view__content"
            v-html="detail?.detailMobileHtml || detail?.detailHtml || '<p>-</p>'"
          />
        </ElCard>
      </div>

      <div class="space-y-4">
        <ElCard shadow="never" class="art-card-xs">
          <template #header>
            <span class="font-medium">图片预览</span>
          </template>

          <div class="space-y-4">
            <ElImage
              v-if="detail?.pic"
              :src="detail.pic"
              fit="cover"
              class="spu-view__main-image h-48 w-full rounded-lg"
              :preview-src-list="[detail.pic]"
              preview-teleported
            />
            <ElEmpty v-else description="暂无主图" />

            <div v-if="detail?.albumPics?.length" class="grid grid-cols-3 gap-3">
              <ElImage
                v-for="item in detail.albumPics"
                :key="item"
                :src="item"
                fit="cover"
                class="aspect-square rounded-lg"
                :preview-src-list="detail.albumPics"
                preview-teleported
              />
            </div>
          </div>
        </ElCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getSpu, type AttrValueItem, type SpuDetailItem } from '@/api/spu'

  defineOptions({ name: 'ProductSpuDetailPage' })

  const router = useRouter()
  const route = useRoute()
  const loading = ref(false)
  const detail = ref<SpuDetailItem | null>(null)

  const parseSpecs = (value?: string): AttrValueItem[] => {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const goEdit = () => {
    router.push(`/product/spu/edit/${route.params.id}`)
  }

  onMounted(async () => {
    const id = Number(route.params.id || 0)
    if (!id) {
      router.replace('/product/spu')
      return
    }

    loading.value = true
    try {
      detail.value = await getSpu(id)
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped lang="scss">
  .spu-view__hero {
    :deep(.el-card__body) {
      padding: 14px 18px;
    }
  }

  .spu-view__hero-main {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .spu-view__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .spu-view__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .spu-view__main-image {
    background: var(--el-fill-color-light);
  }

  .spu-view__content {
    :deep(img) {
      max-width: 100%;
    }

    :deep(p:first-child) {
      margin-top: 0;
    }
  }

  @media (width <= 768px) {
    .spu-view__hero-main {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
