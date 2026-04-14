<template>
  <div class="inventory-expand">
    <div v-if="loading" class="mt-1 rounded-[10px] bg-[var(--el-fill-color-light)] px-4 py-3.5">
      <ElSkeleton :rows="3" animated />
    </div>

    <div
      v-else-if="!rows.length"
      class="mt-1 rounded-[10px] bg-[var(--el-fill-color-light)] px-4 py-3.5"
    >
      <ElEmpty description="暂无库存明细" />
    </div>

    <div
      v-else
      class="inventory-expand__list mt-1 overflow-hidden rounded-[10px] bg-[var(--el-fill-color-light)]"
    >
      <div
        class="inventory-expand__head border-b border-[var(--el-border-color-lighter)] bg-[rgb(255_255_255_/_65%)]"
      >
        <div class="code">编码</div>
        <div class="spec">规格</div>
        <div class="stock">可售库存</div>
        <div class="lock">锁定</div>
        <div class="warning">预警值</div>
        <div class="status">状态</div>
        <div class="action">操作</div>
      </div>

      <article
        v-for="row in rows"
        :key="row.skuId"
        class="inventory-expand__row border-t border-[var(--el-border-color-lighter)] first:border-t-0"
      >
        <div class="code">
          <span class="block truncate text-sm font-semibold text-[var(--el-text-color-primary)]">
            {{ row.skuCode }}
          </span>
        </div>

        <div class="spec">
          <span
            class="inventory-expand__spec-text block truncate text-xs text-[var(--el-text-color-secondary)]"
          >
            {{ formatSpecs(row.specs) || '-' }}
          </span>
        </div>

        <div class="stock">
          <ElInputNumber
            v-model="row.stock"
            :min="0"
            :precision="0"
            controls-position="right"
            class="w-full"
            @change="$emit('stock-change', row)"
          />
        </div>

        <div class="lock text-center font-semibold text-[var(--el-text-color-primary)]">{{
          row.lockStock
        }}</div>

        <div class="warning">
          <ElInputNumber
            v-model="row.lowStock"
            :min="0"
            :precision="0"
            controls-position="right"
            class="w-full"
          />
        </div>

        <div class="status">
          <div class="flex items-center justify-center gap-2">
            <ElTag :type="getStatusMeta(row).type">{{ getStatusMeta(row).text }}</ElTag>
            <span
              v-if="isDirty(row)"
              class="whitespace-nowrap text-xs text-[var(--el-color-warning)]"
            >
              未保存
            </span>
          </div>
        </div>

        <div class="action">
          <div class="flex items-center justify-center gap-1.5">
            <ElTooltip content="查看日志" placement="top">
              <span class="inline-flex">
                <ArtButtonTable
                  type="view"
                  icon-class="ease-table-action ease-table-action--view"
                  @click="$emit('log', row)"
                />
              </span>
            </ElTooltip>
            <ElTooltip content="保存库存" placement="top">
              <span class="inline-flex">
                <ArtButtonTable
                  type="edit"
                  icon-class="ease-table-action ease-table-action--edit"
                  @click="$emit('save', row)"
                />
              </span>
            </ElTooltip>
            <ElTooltip content="删除库存" placement="top">
              <span class="inline-flex">
                <ArtButtonTable
                  type="delete"
                  icon-class="ease-table-action ease-table-action--delete"
                  @click="$emit('delete', row)"
                />
              </span>
            </ElTooltip>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import type { InventorySkuRow } from '@/api/sku-stock'

  defineProps<{
    rows: InventorySkuRow[]
    loading: boolean
    isDirty: (row: InventorySkuRow) => boolean
  }>()

  defineEmits<{
    (e: 'stock-change', row: InventorySkuRow): void
    (e: 'log', row: InventorySkuRow): void
    (e: 'save', row: InventorySkuRow): void
    (e: 'delete', row: InventorySkuRow): void
  }>()

  const getStatusMeta = (row: InventorySkuRow) => {
    if (row.stockStatus === 2) return { text: '预售', type: 'success' as const }
    if (row.stockStatus === 0 || row.stock <= 0) return { text: '缺货', type: 'danger' as const }
    if (row.stock <= row.lowStock) return { text: '预警', type: 'warning' as const }
    return { text: '正常', type: 'success' as const }
  }

  const formatSpecs = (specs: InventorySkuRow['specs']) =>
    specs
      .map((item) => `${item.attrName}：${item.attrValue}`)
      .filter(Boolean)
      .join('，')
</script>

<style scoped lang="scss">
  .inventory-expand {
    padding: 0 16px 12px 48px;
    background: transparent;
  }

  .inventory-expand__head,
  .inventory-expand__row {
    display: grid;
    grid-template-columns: 240px minmax(0, 1.6fr) 160px 90px 150px 120px 170px;
    gap: 0;
    align-items: center;
  }

  .inventory-expand__head > div,
  .inventory-expand__row > div {
    padding: 9px 12px;
  }

  .inventory-expand__head > div {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .inventory-expand__list :deep(.el-input-number) {
    --el-input-height: 34px;
  }

  .inventory-expand__list :deep(.art-table-btn),
  .inventory-expand__list :deep(.ease-table-action) {
    min-width: 28px;
    height: 28px;
  }

  @media (width <= 768px) {
    .inventory-expand {
      padding-right: 8px;
      padding-left: 16px;
    }

    .inventory-expand__head {
      display: none;
    }

    .inventory-expand__row {
      grid-template-columns: 1fr;
    }

    .inventory-expand__row > div {
      padding-top: 8px;
      padding-bottom: 8px;
    }

    .inventory-expand__row > div::before {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .inventory-expand__row > .code::before {
      content: '编码';
    }

    .inventory-expand__row > .spec::before {
      content: '规格';
    }

    .inventory-expand__row > .stock::before {
      content: '可售库存';
    }

    .inventory-expand__row > .lock::before {
      content: '锁定';
    }

    .inventory-expand__row > .warning::before {
      content: '预警值';
    }

    .inventory-expand__row > .status::before {
      content: '状态';
    }

    .inventory-expand__row > .action::before {
      content: '操作';
    }

    .inventory-expand__spec-text {
      white-space: normal;
    }
  }
</style>
