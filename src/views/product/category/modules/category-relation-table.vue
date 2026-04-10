<template>
  <ArtTable
    :data="rows"
    :row-key="getRelationRowKey"
    :show-table-header="false"
    @row-click="handleRowClick"
    @selection-change="handleSelectionChange"
  >
    <ElTableColumn type="selection" width="48" />

    <ElTableColumn label="属性" min-width="240">
      <template #default="{ row }">
        <div class="font-medium">{{ row.attr.name }}</div>
        <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
          #{{ row.attr.id }} / {{ formatWorkbenchEntryMethod(row.attr.entryMethod) }}
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="选项" min-width="260">
      <template #default="{ row }">
        <OptionTagPreview :options="getWorkbenchRelationOptions(row)" />
      </template>
    </ElTableColumn>

    <ElTableColumn label="分组" min-width="140">
      <template #default="{ row }">
        {{ row.relation.groupName || '默认分组' }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="必填" width="90">
      <template #default="{ row }">
        <ElTag :type="Number(row.relation.required) === 1 ? 'success' : 'info'" effect="plain">
          {{ Number(row.relation.required) === 1 ? '是' : '否' }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="排序" width="90">
      <template #default="{ row }">
        {{ row.relation.sort }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="操作" width="120" align="center" header-align="center" fixed="right">
      <template #default="{ row }">
        <div class="flex justify-center">
          <ArtButtonTable type="edit" @click.stop="$emit('edit', row)" />
          <ArtButtonTable type="delete" @click.stop="$emit('delete', row)" />
        </div>
      </template>
    </ElTableColumn>
  </ArtTable>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import OptionTagPreview from './option-tag-preview.vue'
  import type { WorkbenchRelationRow } from './category-workbench-shared'
  import {
    formatWorkbenchEntryMethod,
    getWorkbenchRelationOptions
  } from './category-workbench-shared'

  interface Props {
    rows: WorkbenchRelationRow[]
  }

  interface Emits {
    (e: 'row-click', value: WorkbenchRelationRow): void
    (e: 'selection-change', value: WorkbenchRelationRow[]): void
    (e: 'edit', value: WorkbenchRelationRow): void
    (e: 'delete', value: WorkbenchRelationRow): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  function getRelationRowKey(row: WorkbenchRelationRow) {
    return String(row.relation.id)
  }

  function handleRowClick(row: WorkbenchRelationRow) {
    emit('row-click', row)
  }

  function handleSelectionChange(rows: WorkbenchRelationRow[]) {
    emit('selection-change', Array.isArray(rows) ? rows : [])
  }
</script>
