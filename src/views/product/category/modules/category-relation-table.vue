<template>
  <EaseTablePage
    embedded
    v-model:columns="columnChecks"
    :selection-count="selectionCount"
    table-header-layout="refresh,size,fullscreen,columns,settings"
    @refresh="$emit('refresh')"
  >
    <template #headerLeft>
      <slot name="header-left" />
    </template>

    <template #selectionText="{ count }">
      <slot name="selection-text" :count="count">已选 {{ count }} 项</slot>
    </template>

    <template #selectionActions>
      <slot name="selection-actions" :count="selectionCount" />
    </template>

    <template #table>
      <ArtTable
        ref="tableRef"
        :data="rows"
        :row-key="getRelationRowKey"
        :show-table-header="false"
        :columns="columns"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      />
    </template>
  </EaseTablePage>
</template>

<script setup lang="ts">
  import { ElTag } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import EaseTablePage from '@/components/project/ease-table-page/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import OptionTagPreview from './option-tag-preview.vue'
  import type { WorkbenchRelationRow } from './category-workbench-shared'
  import {
    formatWorkbenchEntryMethod,
    getWorkbenchRelationOptions
  } from './category-workbench-shared'

  interface Props {
    rows: WorkbenchRelationRow[]
    selectionCount?: number
  }

  interface Emits {
    (e: 'refresh'): void
    (e: 'row-click', value: WorkbenchRelationRow): void
    (e: 'selection-change', value: WorkbenchRelationRow[]): void
    (e: 'edit', value: WorkbenchRelationRow): void
    (e: 'delete', value: WorkbenchRelationRow): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selectionCount: 0
  })
  const emit = defineEmits<Emits>()
  const tableRef = ref<{
    elTableRef?: { toggleAllSelection: () => void; clearSelection: () => void }
  }>()
  const { rows, selectionCount } = toRefs(props)

  const { columns, columnChecks } = useTableColumns<WorkbenchRelationRow>(() => [
    {
      type: 'selection',
      width: 56
    },
    {
      prop: 'attrName',
      label: '属性',
      minWidth: 240,
      formatter: (row) =>
        h('div', [
          h('div', { class: 'font-medium' }, row.attr.name),
          h(
            'div',
            { class: 'mt-1 text-xs text-[var(--el-text-color-secondary)]' },
            `#${row.attr.id} / ${formatWorkbenchEntryMethod(row.attr.entryMethod)}`
          )
        ])
    },
    {
      prop: 'options',
      label: '选项',
      minWidth: 260,
      formatter: (row) => h(OptionTagPreview, { options: getWorkbenchRelationOptions(row) })
    },
    {
      prop: 'groupName',
      label: '分组',
      minWidth: 140,
      formatter: (row) => row.relation.groupName || '默认分组'
    },
    {
      prop: 'required',
      label: '必填',
      width: 90,
      formatter: (row) =>
        h(
          ElTag,
          { type: Number(row.relation.required) === 1 ? 'success' : 'info', effect: 'plain' },
          () => (Number(row.relation.required) === 1 ? '是' : '否')
        )
    },
    {
      prop: 'sort',
      label: '排序',
      width: 90,
      formatter: (row) => row.relation.sort
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row) =>
        h('div', { class: 'flex gap-2' }, [
          h(ArtButtonTable, {
            type: 'edit',
            iconClass: 'ease-table-action ease-table-action--edit',
            onClick: () => emit('edit', row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            iconClass: 'ease-table-action ease-table-action--delete',
            onClick: () => emit('delete', row)
          })
        ])
    }
  ])

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
