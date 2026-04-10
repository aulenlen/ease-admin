<template>
  <ArtTable
    :loading="!!loading"
    :data="rows"
    row-key="id"
    :show-table-header="false"
    @selection-change="handleSelectionChange"
  >
    <ElTableColumn type="selection" width="48" />

    <ElTableColumn label="品牌" min-width="260">
      <template #default="{ row }">
        <div class="flex items-center gap-3">
          <ElAvatar :src="row.logo" :size="36" shape="square">
            {{ String(row.name || '').slice(0, 1) }}
          </ElAvatar>
          <div class="min-w-0">
            <ElTooltip :content="row.name" placement="top" :show-after="400">
              <div class="truncate font-medium">{{ row.name }}</div>
            </ElTooltip>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">#{{ row.id }}</div>
          </div>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="显示" width="100">
      <template #default="{ row }">
        <ElTag :type="Number(row.showStatus) === 1 ? 'success' : 'info'" effect="plain">
          {{ Number(row.showStatus) === 1 ? '显示' : '隐藏' }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="厂商" width="100">
      <template #default="{ row }">
        <ElTag :type="Number(row.factoryStatus) === 1 ? 'warning' : 'info'" effect="plain">
          {{ Number(row.factoryStatus) === 1 ? '是' : '否' }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="排序" width="90">
      <template #default="{ row }">
        {{ row.sort ?? 0 }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="操作" width="80" align="center" header-align="center" fixed="right">
      <template #default="{ row }">
        <div class="flex justify-center">
          <ArtButtonTable type="delete" @click="$emit('delete', row.id)" />
        </div>
      </template>
    </ElTableColumn>
  </ArtTable>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { BrandListItem } from '@/api/brand'

  interface Props {
    rows: BrandListItem[]
    loading?: boolean
  }

  interface Emits {
    (e: 'selection-change', value: BrandListItem[]): void
    (e: 'delete', value: number): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  function handleSelectionChange(rows: BrandListItem[]) {
    emit('selection-change', Array.isArray(rows) ? rows : [])
  }
</script>
