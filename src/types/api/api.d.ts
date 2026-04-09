/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken?: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      username: string
      avatar: string
      icon?: string
      status: number | string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      email: string
      userEmail: string
      note?: string
      userRoles: string[]
      createBy: string
      createTime: string
      loginTime?: string
      updateBy: string
      updateTime: string
    }

    interface UserSavePayload {
      id?: number
      username: string
      password?: string
      icon?: string
      email?: string
      nickName?: string
      note?: string
      status?: number
      roleIds?: number[]
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams & {
          keyword: string
        }
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      id?: number
      roleId: number
      name?: string
      roleName: string
      roleCode: string
      description: string
      adminCount?: number
      status?: number
      enabled: boolean
      createTime: string
      sort?: number
    }

    interface RoleDetailItem extends RoleListItem {
      menuIds: number[]
      resourceIds: number[]
    }

    interface RoleSavePayload {
      id?: number
      name: string
      roleCode: string
      description?: string
      status?: number
      sort?: number
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          keyword: string
          startTime: string | null
          endTime: string | null
        }
    >

    interface MenuTreeItem {
      id: number
      parentId: number
      createTime?: string
      title: string
      level: number
      sort: number
      name: string
      icon?: string
      hidden: number
      children?: MenuTreeItem[]
    }

    interface MenuSavePayload {
      id?: number
      parentId: number
      title: string
      level?: number
      sort?: number
      name?: string
      icon?: string
      hidden?: number
    }

    type ResourceList = Api.Common.PaginatedResponse<ResourceListItem>

    interface ResourceListItem {
      id: number
      createTime?: string
      name: string
      url: string
      description?: string
      categoryId: number
    }

    interface ResourceCategoryItem {
      id: number
      createTime?: string
      name: string
      sort: number
    }

    interface ResourceSavePayload {
      id?: number
      name: string
      url: string
      description?: string
      categoryId?: number
    }

    type ResourceSearchParams = Partial<
      Pick<ResourceListItem, 'name' | 'url' | 'categoryId'> & Api.Common.CommonSearchParams
    >
  }
}
