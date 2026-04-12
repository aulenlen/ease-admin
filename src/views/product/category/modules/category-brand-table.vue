<template>
  <ArtTableHeader
    v-model:columns="columnChecks"
    layout="refresh,size,fullscreen,columns,settings"
    class="mb-3"
    @refresh="$emit('refresh')"
  >
    <template #left>
      <slot name="header-left" />
    </template>
  </ArtTableHeader>

  <ArtTable
    :loading="!!loading"
    :data="rows"
    row-key="id"
    :show-table-header="false"
    :columns="columns"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import type { BrandListItem } from '@/api/brand'

  interface Props {
    rows: BrandListItem[]
    loading?: boolean
  }

  interface Emits {
    (e: 'refresh'): void
    (e: 'selection-change', value: BrandListItem[]): void
    (e: 'delete', value: number): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { columns, columnChecks } = useTableColumns<BrandListItem>(() => [
    {
      type: 'selection',
      width: 48
    },
    {
      prop: 'brand',
      label: '品牌',
      minWidth: 260,
      formatter: (row) =>
        h('div', { class: 'flex items-center gap-3' }, [
          h(ElAvatar, { src: row.logo, size: 36, shape: 'square' }, () =>
            String(row.name || '').slice(0, 1)
          ),
          h('div', { class: 'min-w-0' }, [
            h(
              ElTooltip,
              { content: row.name, placement: 'top', showAfter: 400 },
              {
                default: () => h('div', { class: 'truncate font-medium' }, row.name)
              }
            ),
            h('div', { class: 'mt-1 text-xs text-[var(--el-text-color-secondary)]' }, `#${row.id}`)
          ])
        ])
    },
    {
      prop: 'showStatus',
      label: '显示',
      width: 100,
      formatter: (row) =>
        h(
          ElTag,
          { type: Number(row.showStatus) === 1 ? 'success' : 'info', effect: 'plain' },
          () => (Number(row.showStatus) === 1 ? '显示' : '隐藏')
        )
    },
    {
      prop: 'factoryStatus',
      label: '厂商',
      width: 100,
      formatter: (row) =>
        h(
          ElTag,
          { type: Number(row.factoryStatus) === 1 ? 'warning' : 'info', effect: 'plain' },
          () => (Number(row.factoryStatus) === 1 ? '是' : '否')
        )
    },
    {
      prop: 'sort',
      label: '排序',
      width: 90,
      formatter: (row) => row.sort ?? 0
    },
    {
      prop: 'operation',
      label: '操作',
      width: 80,
      fixed: 'right',
      formatter: (row) =>
        h('div', { class: 'flex' }, [
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => emit('delete', row.id)
          })
        ])
    }
  ])

  function handleSelectionChange(rows: BrandListItem[]) {
    emit('selection-change', Array.isArray(rows) ? rows : [])
  }
</script>
