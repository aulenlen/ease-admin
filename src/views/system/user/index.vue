<template>
  <div class="user-page art-full-height">
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增用户</ElButton>
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

      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDeleteUser, fetchGetUserList, fetchUpdateUserStatus } from '@/api/system-manage'
  import { formatDateTime } from '@/utils/date'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import { ElAvatar, ElTag, ElMessageBox } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'User' })

  type UserListItem = Api.SystemManage.UserListItem

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  const searchForm = ref<Api.SystemManage.UserSearchParams>({
    keyword: undefined
  })

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
      apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'userInfo',
          label: '管理员账号',
          minWidth: 260,
          formatter: (row) => {
            const avatarText = (row.nickName || row.username || row.userName || 'A').slice(0, 1)
            return h('div', { class: 'flex-c' }, [
              h(
                ElAvatar,
                {
                  size: 38,
                  src: row.avatar || row.icon || undefined,
                  shape: 'square'
                },
                () => avatarText
              ),
              h('div', { class: 'ml-2' }, [
                h('p', { class: 'font-medium text-[14px]' }, row.username || row.userName),
                h('p', { class: 'text-xs text-g-600 mt-1' }, row.email || row.userEmail || '—')
              ])
            ])
          }
        },
        {
          prop: 'nickName',
          label: '姓名/昵称',
          minWidth: 140,
          formatter: (row) => row.nickName || '—'
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row) =>
            h(
              ElTag,
              {
                type: Number(row.status) === 1 ? 'success' : 'danger',
                class: 'cursor-pointer',
                onClick: () => toggleUserStatus(row)
              },
              () => (Number(row.status) === 1 ? '启用中' : '已禁用')
            )
        },
        {
          prop: 'loginTime',
          label: '最后登录',
          minWidth: 170,
          formatter: (row) => (row.loginTime ? formatDateTime(row.loginTime) : '从未登录')
        },
        {
          prop: 'createTime',
          label: '创建时间',
          minWidth: 170,
          sortable: true,
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
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => deleteUser(row)
              })
            ])
        }
      ]
    }
  })

  const handleSearch = (params: Api.SystemManage.UserSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const toggleUserStatus = async (row: UserListItem) => {
    const nextStatus = Number(row.status) === 1 ? 0 : 1
    const confirmText = nextStatus === 1 ? '确认启用该账号？' : '确认禁用该账号？'

    await ElMessageBox.confirm(confirmText, '账号状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await fetchUpdateUserStatus(row.id, nextStatus)
    row.status = nextStatus
  }

  const deleteUser = async (row: UserListItem): Promise<void> => {
    await ElMessageBox.confirm('确定移除该账号？此操作不可恢复。', '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await fetchDeleteUser(row.id)
    refreshData()
  }

  const handleDialogSubmit = async () => {
    dialogVisible.value = false
    currentUserData.value = {}
    refreshData()
  }
</script>
