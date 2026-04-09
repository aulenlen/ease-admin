<template>
  <div class="art-full-height">
    <ArtSearchBar
      v-model="searchForm"
      :items="formItems"
      :show-expand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton @click="handleAdd" v-ripple>添加资源</ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <ResourceDialog
        v-model="dialogVisible"
        :mode="dialogMode"
        :data="currentResource"
        :category-options="categoryOptions"
        @success="refreshData"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDeleteResource, fetchGetResourceList } from '@/api/system-manage'
  import { formatDateTime } from '@/utils/date'
  import ResourceDialog from './modules/resource-dialog.vue'
  import { ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Resource' })

  type ResourceListItem = Api.SystemManage.ResourceListItem
  type ResourceCategoryItem = Api.SystemManage.ResourceCategoryItem

  const categoryOptions = ref<ResourceCategoryItem[]>([
    { id: 1, name: '商品模块', sort: 0 },
    { id: 2, name: '订单模块', sort: 0 },
    { id: 3, name: '营销模块', sort: 0 },
    { id: 4, name: '权限模块', sort: 0 },
    { id: 5, name: '内容模块', sort: 0 }
  ])

  const searchForm = ref<Api.SystemManage.ResourceSearchParams>({
    name: undefined,
    categoryId: undefined
  })

  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const currentResource = ref<Partial<ResourceListItem>>({})

  const formItems = computed(() => [
    {
      label: '资源名称',
      key: 'name',
      type: 'input',
      span: 8,
      props: { clearable: true, placeholder: '搜索资源名称' }
    },
    {
      label: '资源分类',
      key: 'categoryId',
      type: 'select',
      span: 8,
      props: {
        clearable: true,
        placeholder: '全部分类',
        options: categoryOptions.value.map((item) => ({
          label: item.name,
          value: item.id
        }))
      }
    }
  ])

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchGetResourceList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          prop: 'id',
          label: '资源ID',
          width: 100
        },
        {
          prop: 'name',
          label: '资源名称',
          minWidth: 180
        },
        {
          prop: 'url',
          label: '资源地址',
          minWidth: 260,
          showOverflowTooltip: true
        },
        {
          prop: 'categoryId',
          label: '资源分类',
          width: 140,
          formatter: (row) =>
            categoryOptions.value.find((item) => item.id === row.categoryId)?.name || '未知分类'
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 180,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => handleEdit(row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => handleDelete(row)
              })
            ])
        }
      ]
    }
  })

  const handleSearch = (params: Api.SystemManage.ResourceSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    resetSearchParams()
    getData()
  }

  const handleAdd = () => {
    dialogMode.value = 'add'
    currentResource.value = {}
    dialogVisible.value = true
  }

  const handleEdit = (row: ResourceListItem) => {
    dialogMode.value = 'edit'
    currentResource.value = { ...row }
    dialogVisible.value = true
  }

  const handleDelete = async (row: ResourceListItem) => {
    await ElMessageBox.confirm('确认删除该资源？此操作不可撤销。', '删除资源', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await fetchDeleteResource(row.id)
    refreshData()
  }
</script>
