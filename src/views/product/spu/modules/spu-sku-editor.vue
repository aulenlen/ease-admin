<template>
  <div class="spu-sku-editor">
    <ElTable :data="rows" border>
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
            <span v-if="!parseSpecs(row.spData).length" class="text-xs text-g-500">默认规格</span>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn label="SKU 图" width="120">
        <template #default="{ row, $index }">
          <div class="cursor-pointer" @click="pickImage($index)">
            <ElImage v-if="row.pic" :src="row.pic" fit="cover" class="size-12 rounded-md" />
            <div
              v-else
              class="flex size-12 items-center justify-center rounded-lg border border-dashed border-[var(--el-border-color)] text-xs text-[var(--el-text-color-secondary)]"
            >
              上传
            </div>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn label="售价" min-width="120">
        <template #default="{ row }">
          <ElInputNumber v-model="row.price" :min="0" :precision="2" controls-position="right" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="市场价" min-width="120">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.originalPrice"
            :min="0"
            :precision="2"
            controls-position="right"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn label="库存" min-width="110">
        <template #default="{ row }">
          <ElInputNumber v-model="row.stock" :min="0" :precision="0" controls-position="right" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="低库存预警" min-width="130">
        <template #default="{ row }">
          <ElInputNumber v-model="row.lowStock" :min="0" :precision="0" controls-position="right" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="启用" width="90" align="center">
        <template #default="{ row }">
          <ElSwitch
            :model-value="Number(row.enableStatus ?? 1) === 1"
            @update:model-value="row.enableStatus = $event ? 1 : 0"
          />
        </template>
      </ElTableColumn>
    </ElTable>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { uploadMedia } from '@/api/media'
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

  const rows = computed({
    get: () => props.modelValue || [],
    set: (value) => emit('update:modelValue', value)
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

  const pickImage = (index: number) => {
    currentImageIndex.value = index
    fileInputRef.value?.click()
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
</script>
