<template>
  <ElDialog
    :model-value="modelValue"
    title="补建库存"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:modelValue="$emit('update:modelValue', $event)"
    @closed="$emit('closed')"
  >
    <div>
      <div v-if="spu" class="mb-4 rounded-xl bg-[var(--el-fill-color-light)] px-4 py-3">
        <div class="text-base font-semibold">补建库存记录</div>
        <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
          为当前 SPU 下未建库存的 SKU 补充库存信息
        </div>
        <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
          {{ spu.spuName }} · {{ spu.brandName }} · {{ spu.categoryName }}
        </div>
      </div>

      <ElForm ref="formRef" :model="formState" :rules="rules" label-width="88px" class="px-1 pt-1">
        <ElFormItem label="目标 SKU" prop="skuId">
          <ElSelect
            v-model="formState.skuId"
            filterable
            class="w-full"
            placeholder="选择未创建库存的 SKU"
          >
            <ElOption
              v-for="item in candidates"
              :key="item.id"
              :label="item.skuCode || String(item.id)"
              :value="item.id"
            >
              <div class="flex flex-col gap-1">
                <span class="font-semibold">{{ item.skuCode || item.id }}</span>
                <span class="text-xs text-[var(--el-text-color-secondary)]">
                  {{ formatSpecs(item.attrValuesObj || []) }}
                </span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="可售库存" prop="stock">
          <ElInputNumber
            v-model="formState.stock"
            :min="0"
            :precision="0"
            controls-position="right"
            class="w-full"
          />
        </ElFormItem>

        <ElFormItem label="预警值" prop="lowStock">
          <ElInputNumber
            v-model="formState.lowStock"
            :min="0"
            :precision="0"
            controls-position="right"
            class="w-full"
          />
        </ElFormItem>

        <ElFormItem label="库存状态" prop="stockStatus">
          <ElSelect v-model="formState.stockStatus" class="w-full">
            <ElOption label="无货" :value="0" />
            <ElOption label="有货" :value="1" />
            <ElOption label="预售" :value="2" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="submit">确认新增</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { InventorySpuRow, SkuCandidate, StockStatus } from '@/api/sku-stock'

  export interface CreateInventoryForm {
    skuId?: number
    stock: number
    lowStock: number
    stockStatus: StockStatus
  }

  const props = defineProps<{
    modelValue: boolean
    loading: boolean
    spu: InventorySpuRow | null
    candidates: SkuCandidate[]
    form: CreateInventoryForm
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', value: CreateInventoryForm): void
    (e: 'closed'): void
  }>()

  const formRef = ref<FormInstance>()
  const formState = reactive<CreateInventoryForm>({
    skuId: undefined,
    stock: 0,
    lowStock: 0,
    stockStatus: 0
  })
  const rules: FormRules<CreateInventoryForm> = {
    skuId: [{ required: true, message: '请选择目标 SKU', trigger: 'change' }],
    stockStatus: [{ required: true, message: '请选择库存状态', trigger: 'change' }]
  }

  const formatSpecs = (specs: { attrName?: string; attrValue?: string }[]) =>
    specs.map((item) => `${item.attrName}：${item.attrValue}`).join(' · ')

  watch(
    () => props.modelValue,
    (opened) => {
      if (!opened) return
      Object.assign(formState, props.form)
    },
    { immediate: true }
  )

  watch(
    () => formState.stock,
    (stock) => {
      formState.stockStatus = stock > 0 ? 1 : 0
    }
  )

  const submit = async () => {
    await formRef.value?.validate()
    emit('submit', { ...formState })
  }
</script>
