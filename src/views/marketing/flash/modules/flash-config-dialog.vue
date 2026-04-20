<template>
  <ElDialog
    :model-value="modelValue"
    :title="editingProduct ? '编辑秒杀参数' : '设置秒杀参数'"
    width="min(1200px, calc(100vw - 32px))"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <ElAlert
      type="info"
      :closable="false"
      class="mb-4"
      title="请为选中的 SKU 设置秒杀价格、库存和限购规则，提交前会自动检查价格和库存约束。"
    />

    <ElTable :data="rows" border table-layout="fixed" max-height="420">
      <ElTableColumn label="SKU 信息" min-width="280">
        <template #default="{ row }">
          <div class="flex flex-col gap-1">
            <span class="font-medium text-g-900">{{ row.spuName || `SPU-${row.spuId}` }}</span>
            <span class="text-xs text-g-500">{{ row.skuCode || `SKU-${row.skuId}` }}</span>
            <span class="text-xs text-g-500">{{ formatSpecValues(row.attrValuesObj) }}</span>
          </div>
        </template>
      </ElTableColumn>

      <ElTableColumn label="原价" width="110" align="center">
        <template #default="{ row }">
          <span>{{ formatMoney(row.price) }}</span>
        </template>
      </ElTableColumn>

      <ElTableColumn label="可售库存" width="110" align="center">
        <template #default="{ row }">
          <span>{{ row.availableStock ?? '-' }}</span>
        </template>
      </ElTableColumn>

      <ElTableColumn label="秒杀价" width="140" align="center">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.flashPrice"
            :min="0.01"
            :precision="2"
            :controls="false"
            class="w-full"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn label="秒杀库存" width="128" align="center">
        <template #default="{ row }">
          <ElInputNumber v-model="row.flashStock" :min="1" :controls="false" class="w-full" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="限购数量" width="128" align="center">
        <template #default="{ row }">
          <ElInputNumber v-model="row.flashLimit" :min="1" :controls="false" class="w-full" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="排序" width="96" align="center">
        <template #default="{ row }">
          <ElInputNumber v-model="row.sort" :min="0" :controls="false" class="w-full" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="校验提示" min-width="180">
        <template #default="{ row }">
          <div
            v-if="issuesBySkuId.get(row.skuId)?.length"
            class="flex flex-col gap-1 text-xs text-error"
          >
            <span v-for="issue in issuesBySkuId.get(row.skuId)" :key="issue">{{ issue }}</span>
          </div>
          <span v-else class="text-xs text-success">配置可提交</span>
        </template>
      </ElTableColumn>
    </ElTable>

    <div
      class="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[var(--el-fill-color-light)] px-4 py-3"
    >
      <span class="text-sm font-medium text-g-900">批量设置</span>
      <ElInputNumber
        v-model="batchForm.flashPrice"
        :min="0.01"
        :precision="2"
        :controls="false"
        placeholder="秒杀价"
      />
      <ElInputNumber
        v-model="batchForm.flashStock"
        :min="1"
        :controls="false"
        placeholder="秒杀库存"
      />
      <ElInputNumber
        v-model="batchForm.flashLimit"
        :min="1"
        :controls="false"
        placeholder="限购数量"
      />
      <ElButton type="primary" @click="applyBatch">应用到全部</ElButton>
    </div>

    <div class="mt-3 text-sm" :class="invalidCount > 0 ? 'text-warning' : 'text-success'">
      {{
        invalidCount > 0
          ? `当前有 ${invalidCount} 个 SKU 参数需要修正。`
          : '所有 SKU 参数已通过前端校验，可以提交。'
      }}
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleConfirm">
        {{ editingProduct ? '确认修改' : '确认添加' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FlashProductItem } from '@/api/flash'
  import {
    formatFlashAttrValueList,
    normalizeFlashRouteType,
    parseFlashAttrValues,
    type FlashSkuConfig,
    type SelectedFlashSku
  } from './flash-utils'

  interface Props {
    modelValue: boolean
    selection: SelectedFlashSku[]
    editingProduct: FlashProductItem | null
    submitting: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', rows: FlashSkuConfig[]): void
  }>()

  const rows = ref<FlashSkuConfig[]>([])
  const batchForm = reactive<{
    flashPrice: number | null
    flashStock: number | null
    flashLimit: number | null
    routeType: 0 | 1 | null
  }>({
    flashPrice: null,
    flashStock: null,
    flashLimit: null,
    routeType: null
  })

  const formatMoney = (value: number) => `¥${Number(value || 0).toFixed(2)}`

  const formatSpecValues = (list: SelectedFlashSku['attrValuesObj']) =>
    formatFlashAttrValueList(list)

  const toCreateRows = (selection: SelectedFlashSku[]): FlashSkuConfig[] =>
    selection.map((sku) => ({
      skuId: sku.skuId,
      spuId: sku.spuId,
      spuName: sku.spuName,
      spuPic: sku.spuPic,
      skuCode: sku.skuCode,
      attrValuesObj: sku.attrValuesObj,
      price: Number(sku.price || 0),
      availableStock: Number.isFinite(sku.stock) ? Number(sku.stock) : null,
      flashPrice: Number(sku.price || 0),
      flashStock: Math.max(1, Math.min(Number(sku.stock || 1), 100)),
      flashLimit: 1,
      routeType: 0,
      sort: 0
    }))

  const toEditRows = (product: FlashProductItem): FlashSkuConfig[] => [
    {
      skuId: product.skuId,
      spuId: product.spuId,
      spuName: product.spuName,
      spuPic: product.spuPic,
      skuCode: `SKU-${product.skuId}`,
      attrValuesObj: parseFlashAttrValues(product.attrValues),
      price: Number(product.originalPrice || 0),
      availableStock: null,
      flashPrice: Number(product.flashPrice || 0),
      flashStock: Number(product.flashStock || 0),
      flashLimit: Number(product.flashLimit || 1),
      routeType: normalizeFlashRouteType(product.routeType),
      sort: Number(product.sort || 0),
      flashProductId: product.id
    }
  ]

  const resetBatchForm = () => {
    batchForm.flashPrice = null
    batchForm.flashStock = null
    batchForm.flashLimit = null
    batchForm.routeType = null
  }

  const getIssues = (row: FlashSkuConfig) => {
    const issues: string[] = []

    if (!row.flashPrice || row.flashPrice <= 0) {
      issues.push('秒杀价必须大于 0')
    } else if (row.price > 0 && row.flashPrice >= row.price) {
      issues.push('秒杀价必须低于原价')
    }

    if (!row.flashStock || row.flashStock <= 0) {
      issues.push('秒杀库存必须大于 0')
    } else if (row.availableStock !== null && row.flashStock > row.availableStock) {
      issues.push(`秒杀库存不能超过可售库存 ${row.availableStock}`)
    }

    if (!row.flashLimit || row.flashLimit <= 0) {
      issues.push('限购数量必须大于 0')
    } else if (row.flashLimit > row.flashStock) {
      issues.push('限购数量不能大于秒杀库存')
    }

    return issues
  }

  const issuesBySkuId = computed(() => {
    const map = new Map<number, string[]>()
    rows.value.forEach((row) => {
      map.set(row.skuId, getIssues(row))
    })
    return map
  })

  const invalidCount = computed(() => {
    let count = 0

    issuesBySkuId.value.forEach((issues) => {
      if (issues.length) count += 1
    })

    return count
  })

  const applyBatch = () => {
    rows.value.forEach((row) => {
      if (batchForm.flashPrice !== null) row.flashPrice = batchForm.flashPrice
      if (batchForm.flashStock !== null) row.flashStock = batchForm.flashStock
      if (batchForm.flashLimit !== null) row.flashLimit = batchForm.flashLimit
      if (batchForm.routeType !== null) row.routeType = batchForm.routeType
    })
  }

  const handleConfirm = () => {
    if (invalidCount.value > 0) return
    emit('confirm', rows.value)
  }

  watch(
    () => [props.modelValue, props.selection, props.editingProduct] as const,
    ([visible, selection, editingProduct]) => {
      if (!visible) return

      rows.value = editingProduct ? toEditRows(editingProduct) : toCreateRows(selection)
      resetBatchForm()
    },
    {
      deep: true,
      immediate: true
    }
  )
</script>
