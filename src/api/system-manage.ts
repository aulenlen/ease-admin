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

interface RoleDetailRespVO extends RoleRespVO {
  menuIds?: number[]
  resourceIds?: number[]
}

interface RoleReqVO {
  id?: number
  name: string
  roleCode: string
  description?: string
  status?: number
  sort?: number
}

interface MenuTreeRespVO {
  id: number
  parentId: number
  createTime?: string
  title: string
  level: number
  sort: number
  name: string
  icon?: string
  hidden: number
  children?: MenuTreeRespVO[]
}

interface MenuReqVO {
  id?: number
  parentId: number
  title: string
  level?: number
  sort?: number
  name?: string
  icon?: string
  hidden?: number
}

interface ResourceRespVO {
  id: number
  createTime?: string
  name: string
  url: string
  description?: string
  categoryId: number
}

interface ResourceReqVO {
  id?: number
  name: string
  url: string
  description?: string
  categoryId?: number
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

function toRoleDetailItem(item: RoleDetailRespVO): Api.SystemManage.RoleDetailItem {
  return {
    ...toRoleListItem(item),
    menuIds: item.menuIds || [],
    resourceIds: item.resourceIds || []
  }
}

function toResourceListItem(item: ResourceRespVO): Api.SystemManage.ResourceListItem {
  return {
    id: item.id,
    createTime: item.createTime,
    name: item.name,
    url: item.url,
    description: item.description,
    categoryId: item.categoryId
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

function toResourceListResponse(
  response: PageResultDTO<ResourceRespVO>
): Api.SystemManage.ResourceList {
  return {
    records: (response.list || []).map(toResourceListItem),
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

function buildResourceSearchParams(params: Api.SystemManage.ResourceSearchParams) {
  return {
    name: params.name || undefined,
    url: params.url || undefined,
    categoryId: params.categoryId,
    pageNum: params.current,
    pageSize: params.size
  }
}

function toRoleReqVO(payload: Api.SystemManage.RoleSavePayload): RoleReqVO {
  return {
    id: payload.id,
    name: String(payload.name || '').trim(),
    roleCode: String(payload.roleCode || '')
      .trim()
      .toUpperCase(),
    description: String(payload.description || '').trim() || undefined,
    status: Number(payload.status ?? 1),
    sort: Number(payload.sort ?? 0)
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

function toResourceReqVO(payload: Api.SystemManage.ResourceSavePayload): ResourceReqVO {
  return {
    id: payload.id,
    name: String(payload.name || '').trim(),
    url: String(payload.url || '').trim(),
    description: String(payload.description || '').trim() || undefined,
    categoryId: payload.categoryId
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

export function fetchGetRoleDetail(id: number): Promise<Api.SystemManage.RoleDetailItem> {
  return request
    .get<RoleDetailRespVO>({
      url: `${ROLES_BASE_PATH}/${id}`
    })
    .then(toRoleDetailItem)
}

export function fetchCreateRole(payload: Api.SystemManage.RoleSavePayload): Promise<number> {
  return request.post<number>({
    url: ROLES_BASE_PATH,
    data: toRoleReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchUpdateRole(payload: Api.SystemManage.RoleSavePayload): Promise<number> {
  return request.put<number>({
    url: ROLES_BASE_PATH,
    data: toRoleReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchUpdateRoleStatus(id: number, status: number): Promise<number> {
  return request.put<number>({
    url: `${ROLES_BASE_PATH}/${id}/status`,
    params: { status },
    showSuccessMessage: true
  })
}

export function fetchDeleteRole(id: number): Promise<number> {
  return request.del<number>({
    url: `${ROLES_BASE_PATH}/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetMenuTree(): Promise<Api.SystemManage.MenuTreeItem[]> {
  return request.get<MenuTreeRespVO[]>({
    url: '/api/v1/admin/menus/tree'
  })
}

function toMenuReqVO(payload: Api.SystemManage.MenuSavePayload): MenuReqVO {
  return {
    id: payload.id,
    parentId: Number(payload.parentId ?? 0),
    title: String(payload.title || '').trim(),
    level: payload.level,
    sort: Number(payload.sort ?? 0),
    name: String(payload.name || '').trim() || undefined,
    icon: String(payload.icon || '').trim() || undefined,
    hidden: Number(payload.hidden ?? 0)
  }
}

export function fetchCreateMenu(payload: Api.SystemManage.MenuSavePayload): Promise<number> {
  return request.post<number>({
    url: '/api/v1/admin/menus',
    data: toMenuReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchUpdateMenu(payload: Api.SystemManage.MenuSavePayload): Promise<number> {
  return request.put<number>({
    url: '/api/v1/admin/menus',
    data: toMenuReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchDeleteMenu(id: number): Promise<number> {
  return request.del<number>({
    url: `/api/v1/admin/menus/${id}`,
    showSuccessMessage: true
  })
}

export function fetchAllocRoleMenus(roleId: number, menuIds: number[]): Promise<number> {
  return request.post<number>({
    url: `${ROLES_BASE_PATH}/menus`,
    data: { roleId, menuIds },
    showSuccessMessage: true
  })
}

export function fetchAllocRoleResources(roleId: number, resourceIds: number[]): Promise<number> {
  return request.post<number>({
    url: `${ROLES_BASE_PATH}/resources`,
    data: { roleId, resourceIds },
    showSuccessMessage: true
  })
}

export function fetchGetResourceList(
  params: Api.SystemManage.ResourceSearchParams
): Promise<Api.SystemManage.ResourceList> {
  return request
    .get<PageResultDTO<ResourceRespVO>>({
      url: '/api/v1/admin/resources',
      params: buildResourceSearchParams(params)
    })
    .then(toResourceListResponse)
}

export function fetchGetResourceListAll(): Promise<Api.SystemManage.ResourceListItem[]> {
  return request
    .get<ResourceRespVO[]>({
      url: '/api/v1/admin/resources/all'
    })
    .then((list) => (list || []).map(toResourceListItem))
}

export function fetchCreateResource(
  payload: Api.SystemManage.ResourceSavePayload
): Promise<number> {
  return request.post<number>({
    url: '/api/v1/admin/resources',
    data: toResourceReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchUpdateResource(
  payload: Api.SystemManage.ResourceSavePayload
): Promise<number> {
  return request.put<number>({
    url: '/api/v1/admin/resources',
    data: toResourceReqVO(payload),
    showSuccessMessage: true
  })
}

export function fetchDeleteResource(id: number): Promise<number> {
  return request.del<number>({
    url: `/api/v1/admin/resources/${id}`,
    showSuccessMessage: true
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}
