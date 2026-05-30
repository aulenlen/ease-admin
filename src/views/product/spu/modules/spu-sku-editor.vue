<template>
  <div class="spu-sku-editor">
    <EaseTablePage embedded v-model:columns="columnChecks" table-header-layout="">
      <template #table>
        <ArtTable :data="rows" :columns="columns" :show-table-header="false" border>
          <!-- 规格列：图片 + 规格文本 -->
          <template #specImage="{ row, $index }">
            <div class="flex items-center gap-3">
              <div class="shrink-0">
                <ElImage v-if="row.pic" :src="row.pic" fit="cover" class="size-12 rounded" />
                <div
                  v-else
                  class="flex size-12 items-center justify-center rounded border border-dashed border-[var(--el-border-color)] text-xs text-[var(--el-text-color-secondary)]"
                >
                  图片
                </div>
              </div>
              <div class="min-w-0">
                <span class="block text-sm">{{ formatSpecLabel(row) }}</span>
                <div class="mt-1 flex items-center gap-2">
                  <ElButton link type="primary" size="small" @click="openMediaPicker($index)">
                    文件库
                  </ElButton>
                  <ElButton link size="small" @click="pickImage($index)">上传</ElButton>
                </div>
              </div>
            </div>
          </template>

          <!-- 售价 -->
          <template #price="{ row }">
            <ElInputNumber v-model="row.price" :min="0" :precision="2" :controls="false" />
          </template>

          <!-- 市场价 -->
          <template #originalPrice="{ row }">
            <ElInputNumber v-model="row.originalPrice" :min="0" :precision="2" :controls="false" />
          </template>

          <!-- 库存 -->
          <template #stock="{ row }">
            <ElInputNumber v-model="row.stock" :min="0" :precision="0" controls-position="right" />
          </template>

          <!-- 低库存预警 -->
          <template #lowStock="{ row }">
            <ElInputNumber
              v-model="row.lowStock"
              :min="0"
              :precision="0"
              controls-position="right"
            />
          </template>

          <!-- 启用 -->
          <template #enableStatus="{ row }">
            <ElSwitch
              :model-value="Number(row.enableStatus ?? 1) === 1"
              @update:model-value="row.enableStatus = $event ? 1 : 0"
            />
          </template>

          <!-- 操作 -->
          <template #operation="{ $index }">
            <ElButton type="danger" link size="small" @click="handleDeleteSku($index)">
              <ArtSvgIcon icon="ri:delete-bin-6-line" class="text-sm" />
            </ElButton>
          </template>
        </ArtTable>
      </template>
    </EaseTablePage>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <EaseMediaPicker
      v-model="mediaPickerVisible"
      media-type="IMAGE"
      type-locked
      :selected-urls="currentSkuPic ? [currentSkuPic] : []"
      @confirm="handleMediaConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import EaseMediaPicker from '@/components/project/ease-media-picker/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { uploadMedia, type MediaFileItem } from '@/api/media'
  import type { AttrValueItem, SpuFormSkuItem } from '@/api/spu'

  interface Props {
    modelValue: SpuFormSkuItem[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: SpuFormSkuItem[]): void
  }>()

  const fileInputRef = ref<HTMLInputElement>()
  const currentImageIndex = ref<number | null>(null)
  const mediaPickerVisible = ref(false)

  const rows = computed({
    get: () => props.modelValue || [],
    set: (value) => emit('update:modelValue', value)
  })

  const currentSkuPic = computed(() => {
    const index = currentImageIndex.value
    if (index === null) return ''
    return rows.value[index]?.pic || ''
  })

  const parseSpecs = (value?: string): AttrValueItem[] => {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /** 将 spData 解析为 "规格值 · 规格值" 格式，无规格时显示"默认规格" */
  const formatSpecLabel = (row: SpuFormSkuItem): string => {
    const specs = parseSpecs(row.spData)
    if (!specs.length) return '默认规格'
    return specs.map((s) => s.attrValue).join(' · ')
  }

  const pickImage = (index: number) => {
    currentImageIndex.value = index
    fileInputRef.value?.click()
  }

  const openMediaPicker = (index: number) => {
    currentImageIndex.value = index
    mediaPickerVisible.value = true
  }

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    const index = currentImageIndex.value

    if (!file || index === null) return

    try {
      const data = await uploadMedia(file)
      const nextRows = [...rows.value]
      nextRows[index] = {
        ...nextRows[index],
        pic: data.url
      }
      rows.value = nextRows
    } finally {
      input.value = ''
      currentImageIndex.value = null
    }
  }

  const handleMediaConfirm = (items: MediaFileItem[]) => {
    const index = currentImageIndex.value
    const selected = items[0]
    if (index === null || !selected?.url) return

    const nextRows = [...rows.value]
    nextRows[index] = {
      ...nextRows[index],
      pic: selected.url
    }
    rows.value = nextRows
    currentImageIndex.value = null
  }

  watch(mediaPickerVisible, (visible) => {
    if (visible) return
    currentImageIndex.value = null
  })

  const handleDeleteSku = (index: number) => {
    const nextRows = [...rows.value]
    nextRows.splice(index, 1)
    emit('update:modelValue', nextRows)
  }

  const { columns, columnChecks } = useTableColumns<SpuFormSkuItem>(() => [
    {
      prop: 'specImage',
      label: '规格',
      minWidth: 220,
      fixed: 'left',
      useSlot: true,
      slotName: 'specImage'
    },
    {
      prop: 'price',
      label: '售价',
      width: 180,
      useSlot: true,
      slotName: 'price'
    },
    {
      prop: 'originalPrice',
      label: '市场价',
      width: 180,
      useSlot: true,
      slotName: 'originalPrice'
    },
    {
      prop: 'stock',
      label: '库存',
      width: 180,
      useSlot: true,
      slotName: 'stock'
    },
    {
      prop: 'lowStock',
      label: '低库存预警',
      width: 180,
      useSlot: true,
      slotName: 'lowStock'
    },
    {
      prop: 'enableStatus',
      label: '启用',
      width: 90,
      align: 'center',
      useSlot: true,
      slotName: 'enableStatus'
    },
    {
      prop: 'operation',
      label: '操作',
      width: 70,
      align: 'center',
      fixed: 'right',
      useSlot: true,
      slotName: 'operation'
    }
  ])
</script>

<style scoped lang="scss">
  /* 空 toolbar 时移除多余间距 */
  .spu-sku-editor :deep(.ease-table-page__toolbar) {
    display: none;
  }
</style>
