import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

const USERS_BASE_PATH = '/api/v1/admin/users'
const ROLES_BASE_PATH = '/api/v1/admin/roles'

interface PageResultDTO<T> {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: T[]
}

interface AdminRespVO {
  id: number
  username: string
  password?: string
  icon?: string
  email?: string
  nickName?: string
  note?: string
  createTime?: string
  loginTime?: string
  status: number
}

interface AdminReqVO {
  id?: number
  username: string
  password?: string
  icon?: string
  email?: string
  nickName?: string
  note?: string
  status?: number
}

interface RoleRespVO {
  id: number
  name: string
  description?: string
  adminCount?: number
  createTime?: string
  status: number
  sort?: number
  roleCode?: string
}

interface AllocRoleReqVO {
  adminId: number
  roleIds: number[]
}

function toUserListItem(item: AdminRespVO): Api.SystemManage.UserListItem {
  const avatar = item.icon || ''
  const email = item.email || ''

  return {
    id: item.id,
    username: item.username,
    userName: item.username,
    avatar,
    icon: avatar,
    status: Number(item.status ?? 0),
    nickName: item.nickName || '',
    email,
    userEmail: email,
    note: item.note || '',
    userRoles: [],
    createTime: item.createTime || '',
    loginTime: item.loginTime || '',
    createBy: '',
    updateBy: '',
    updateTime: '',
    userGender: '',
    userPhone: ''
  }
}

function toRoleListItem(item: RoleRespVO): Api.SystemManage.RoleListItem {
  const enabled = Number(item.status ?? 0) === 1

  return {
    id: item.id,
    roleId: item.id,
    name: item.name,
    roleName: item.name,
    roleCode: item.roleCode || '',
    description: item.description || '',
    adminCount: item.adminCount ?? 0,
    status: Number(item.status ?? 0),
    enabled,
    createTime: item.createTime || '',
    sort: item.sort ?? 0
  }
}

function toUserListResponse(response: PageResultDTO<AdminRespVO>): Api.SystemManage.UserList {
  return {
    records: (response.list || []).map(toUserListItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0
  }
}

function toRoleListResponse(response: PageResultDTO<RoleRespVO>): Api.SystemManage.RoleList {
  return {
    records: (response.list || []).map(toRoleListItem),
    current: response.pageNum || 1,
    size: response.pageSize || 10,
    total: response.total || 0
  }
}

function buildUserSearchParams(params: Api.SystemManage.UserSearchParams) {
  return {
    keyword: params.keyword || undefined,
    pageNum: params.current,
    pageSize: params.size
  }
}

function buildRoleSearchParams(params: Api.SystemManage.RoleSearchParams) {
  return {
    keyword:
      params.keyword || params.roleName || params.roleCode || params.description || undefined,
    pageNum: params.current,
    pageSize: params.size
  }
}

function toAdminReqVO(payload: Api.SystemManage.UserSavePayload): AdminReqVO {
  return {
    id: payload.id,
    username: String(payload.username || '').trim(),
    password: payload.password ? String(payload.password) : undefined,
    email: String(payload.email || '').trim() || undefined,
    nickName: String(payload.nickName || '').trim() || undefined,
    note: String(payload.note || '').trim() || undefined,
    icon: String(payload.icon || '').trim() || undefined,
    status: Number(payload.status ?? 1)
  }
}

export function fetchGetUserList(
  params: Api.SystemManage.UserSearchParams
): Promise<Api.SystemManage.UserList> {
  return request
    .get<PageResultDTO<AdminRespVO>>({
      url: USERS_BASE_PATH,
      params: buildUserSearchParams(params)
    })
    .then(toUserListResponse)
}

export function fetchCreateUser(payload: Api.SystemManage.UserSavePayload): Promise<number> {
  return request.post<number>({
    url: USERS_BASE_PATH,
    data: toAdminReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchUpdateUser(
  id: number,
  payload: Api.SystemManage.UserSavePayload
): Promise<number> {
  return request.put<number>({
    url: `${USERS_BASE_PATH}/${id}`,
    data: {
      ...toAdminReqVO(payload),
      id
    },
    showSuccessMessage: true
  })
}

export function fetchUpdateUserStatus(id: number, status: number): Promise<number> {
  return request.put<number>({
    url: `${USERS_BASE_PATH}/${id}/status`,
    params: { status },
    showSuccessMessage: true
  })
}

export function fetchDeleteUser(id: number): Promise<number> {
  return request.del<number>({
    url: `${USERS_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetUserRoles(adminId: number): Promise<Api.SystemManage.RoleListItem[]> {
  return request
    .get<RoleRespVO[]>({
      url: `${USERS_BASE_PATH}/${adminId}/roles`
    })
    .then((list) => (list || []).map(toRoleListItem))
}

export function fetchAllocUserRoles(payload: AllocRoleReqVO): Promise<number> {
  return request.post<number>({
    url: `${USERS_BASE_PATH}/roles`,
    data: payload,
    showSuccessMessage: true
  })
}

export function fetchGetRoleList(
  params: Api.SystemManage.RoleSearchParams
): Promise<Api.SystemManage.RoleList> {
  return request
    .get<PageResultDTO<RoleRespVO>>({
      url: ROLES_BASE_PATH,
      params: buildRoleSearchParams(params)
    })
    .then(toRoleListResponse)
}

export function fetchGetRoleListAll(): Promise<Api.SystemManage.RoleListItem[]> {
  return request
    .get<RoleRespVO[]>({
      url: `${ROLES_BASE_PATH}/all`
    })
    .then((list) => (list || []).map(toRoleListItem))
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}
