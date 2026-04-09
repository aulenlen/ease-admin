<template>
  <div class="art-full-height">
    <RoleSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="handleResetSearch"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增角色</ElButton>
          </ElSpace>
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
    </ElCard>

    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <RolePermissionDialog
      v-model="permissionDialog"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <RoleResourceDialog
      v-model="resourceDialog"
      :role-data="currentRoleData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDeleteRole, fetchGetRoleList, fetchUpdateRoleStatus } from '@/api/system-manage'
  import { formatDateTime } from '@/utils/date'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import RoleSearch from './modules/role-search.vue'
  import RoleEditDialog from './modules/role-edit-dialog.vue'
  import RolePermissionDialog from './modules/role-permission-dialog.vue'
  import RoleResourceDialog from './modules/role-resource-dialog.vue'
  import { ElTag, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Role' })

  type RoleListItem = Api.SystemManage.RoleListItem

  const searchForm = ref<Api.SystemManage.RoleSearchParams>({
    keyword: undefined
  })

  const showSearchBar = ref(false)
  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const resourceDialog = ref(false)
  const currentRoleData = ref<RoleListItem | undefined>(undefined)

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
      apiFn: fetchGetRoleList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        {
          prop: 'roleId',
          label: '角色ID',
          width: 100
        },
        {
          prop: 'roleName',
          label: '角色名称',
          minWidth: 140
        },
        {
          prop: 'roleCode',
          label: '角色编码',
          minWidth: 140
        },
        {
          prop: 'description',
          label: '角色描述',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'adminCount',
          label: '用户数',
          width: 100
        },
        {
          prop: 'enabled',
          label: '角色状态',
          width: 100,
          formatter: (row) =>
            h(
              ElTag,
              {
                type: row.enabled ? 'success' : 'warning',
                class: 'cursor-pointer',
                onClick: () => toggleRoleStatus(row)
              },
              () => (row.enabled ? '启用' : '禁用')
            )
        },
        {
          prop: 'createTime',
          label: '创建日期',
          minWidth: 180,
          sortable: true,
          formatter: (row) => formatDateTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'permission',
                    label: '菜单权限',
                    icon: 'ri:user-3-line'
                  },
                  {
                    key: 'resource',
                    label: '资源权限',
                    icon: 'ri:database-2-line'
                  },
                  {
                    key: 'edit',
                    label: '编辑角色',
                    icon: 'ri:edit-2-line'
                  },
                  {
                    key: 'delete',
                    label: '删除角色',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row)
              })
            ])
        }
      ]
    }
  })

  const dialogType = ref<'add' | 'edit'>('add')

  const showDialog = (type: 'add' | 'edit', row?: RoleListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentRoleData.value = row
  }

  const handleSearch = (params: Api.SystemManage.RoleSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleResetSearch = () => {
    resetSearchParams()
    getData()
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: RoleListItem) => {
    switch (item.key) {
      case 'permission':
        showPermissionDialog(row)
        break
      case 'resource':
        showResourceDialog(row)
        break
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteRole(row)
        break
    }
  }

  const showPermissionDialog = (row?: RoleListItem) => {
    permissionDialog.value = true
    currentRoleData.value = row
  }

  const showResourceDialog = (row?: RoleListItem) => {
    resourceDialog.value = true
    currentRoleData.value = row
  }

  const toggleRoleStatus = async (row: RoleListItem) => {
    const nextStatus = row.enabled ? 0 : 1
    const confirmText = nextStatus === 1 ? '确认启用该角色？' : '确认禁用该角色？'

    await ElMessageBox.confirm(confirmText, '角色状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await fetchUpdateRoleStatus(row.id ?? row.roleId, nextStatus)
    row.enabled = nextStatus === 1
    row.status = nextStatus
  }

  const deleteRole = async (row: RoleListItem) => {
    await ElMessageBox.confirm(`确定删除角色"${row.roleName}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await fetchDeleteRole(row.id ?? row.roleId)
    refreshData()
  }
</script>
