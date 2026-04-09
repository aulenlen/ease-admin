<template>
  <div class="art-full-height">
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :show-expand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        v-model:columns="columnChecks"
        @refresh="getMenuList"
      >
        <template #left>
          <ElButton @click="handleAddMenu" v-ripple>添加菜单</ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      />

      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :menuTree="tableData"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { formatDateTime } from '@/utils/date'
  import MenuDialog from './modules/menu-dialog.vue'
  import {
    fetchCreateMenu,
    fetchDeleteMenu,
    fetchGetMenuTree,
    fetchUpdateMenu
  } from '@/api/system-manage'
  import { ElTag, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Menus' })

  type MenuTreeItem = Api.SystemManage.MenuTreeItem

  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()
  const tableData = ref<MenuTreeItem[]>([])

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const editData = ref<MenuTreeItem | null>(null)

  const initialSearchState = {
    name: '',
    route: ''
  }

  const formFilters = reactive({ ...initialSearchState })
  const appliedFilters = reactive({ ...initialSearchState })

  const formItems = computed(() => [
    {
      label: '菜单名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '菜单标识',
      key: 'route',
      type: 'input',
      props: { clearable: true }
    }
  ])

  onMounted(() => {
    getMenuList()
  })

  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'title',
      label: '菜单名称',
      minWidth: 220
    },
    {
      prop: 'name',
      label: '菜单标识',
      minWidth: 140
    },
    {
      prop: 'icon',
      label: '图标',
      minWidth: 140,
      formatter: (row: MenuTreeItem) => row.icon || '—'
    },
    {
      prop: 'hidden',
      label: '显示',
      width: 100,
      formatter: (row: MenuTreeItem) =>
        h(ElTag, { type: Number(row.hidden) === 1 ? 'danger' : 'success' }, () =>
          Number(row.hidden) === 1 ? '隐藏' : '显示'
        )
    },
    {
      prop: 'sort',
      label: '排序',
      width: 90
    },
    {
      prop: 'createTime',
      label: '创建时间',
      minWidth: 180,
      formatter: (row: MenuTreeItem) => formatDateTime(row.createTime)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: MenuTreeItem) =>
        h('div', { style: 'text-align: right' }, [
          h(ArtButtonTable, {
            type: 'add',
            onClick: () => handleAddChild(row)
          }),
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => handleEditMenu(row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => handleDeleteMenu(row)
          })
        ])
    }
  ])

  const getMenuList = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = await fetchGetMenuTree()
    } finally {
      loading.value = false
    }
  }

  const deepClone = <T,>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  const searchMenu = (items: MenuTreeItem[]): MenuTreeItem[] => {
    const results: MenuTreeItem[] = []

    for (const item of items) {
      const searchName = appliedFilters.name?.toLowerCase().trim() || ''
      const searchRoute = appliedFilters.route?.toLowerCase().trim() || ''
      const nameMatch =
        !searchName ||
        String(item.title || '')
          .toLowerCase()
          .includes(searchName)
      const routeMatch =
        !searchRoute ||
        String(item.name || '')
          .toLowerCase()
          .includes(searchRoute)

      if (item.children?.length) {
        const matchedChildren = searchMenu(item.children)
        if (matchedChildren.length > 0) {
          const clonedItem = deepClone(item)
          clonedItem.children = matchedChildren
          results.push(clonedItem)
          continue
        }
      }

      if (nameMatch && routeMatch) {
        results.push(deepClone(item))
      }
    }

    return results
  }

  const filteredTableData = computed(() => searchMenu(tableData.value))

  const handleReset = (): void => {
    Object.assign(formFilters, { ...initialSearchState })
    Object.assign(appliedFilters, { ...initialSearchState })
    getMenuList()
  }

  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
  }

  const handleAddMenu = (): void => {
    dialogType.value = 'add'
    editData.value = {
      parentId: 0
    } as MenuTreeItem
    dialogVisible.value = true
  }

  const handleAddChild = (row: MenuTreeItem): void => {
    dialogType.value = 'add'
    editData.value = {
      parentId: row.id
    } as MenuTreeItem
    dialogVisible.value = true
  }

  const handleEditMenu = (row: MenuTreeItem): void => {
    dialogType.value = 'edit'
    editData.value = row
    dialogVisible.value = true
  }

  const handleSubmit = async (formData: Api.SystemManage.MenuSavePayload): Promise<void> => {
    if (dialogType.value === 'add') {
      await fetchCreateMenu(formData)
    } else {
      await fetchUpdateMenu(formData)
    }
    getMenuList()
  }

  const handleDeleteMenu = async (row: MenuTreeItem): Promise<void> => {
    await ElMessageBox.confirm('确定要删除该菜单吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await fetchDeleteMenu(row.id)
    getMenuList()
  }

  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: MenuTreeItem[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(filteredTableData.value)
      }
    })
  }
</script>
