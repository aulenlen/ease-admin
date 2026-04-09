import request from '@/utils/http'

const AUTH_BASE_PATH = '/api/v1/admin/auth'
const USERS_BASE_PATH = '/api/v1/admin/users'

interface LegacyLoginResponse {
  token: string
  refreshToken?: string
  tokenHead?: string
}

interface LegacyCurrentUserResponse {
  username: string
  icon?: string
  roles?: string[]
  menus?: unknown[]
}

function normalizeAccessToken(token: string, tokenHead?: string): string {
  const normalizedToken = token.trim()
  if (!normalizedToken) return normalizedToken
  if (normalizedToken.includes(' ')) return normalizedToken

  const normalizedTokenHead = tokenHead?.trim()
  return normalizedTokenHead
    ? `${normalizedTokenHead} ${normalizedToken}`
    : `Bearer ${normalizedToken}`
}

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request
    .post<LegacyLoginResponse>({
      url: `${AUTH_BASE_PATH}/login`,
      params: {
        username: params.userName,
        password: params.password
      }
      // showSuccessMessage: true // 显示成功消息
      // showErrorMessage: false // 不显示错误消息
    })
    .then(({ token, refreshToken, tokenHead }) => ({
      token: normalizeAccessToken(token, tokenHead),
      refreshToken
    }))
}

function transformLegacyUserInfo(userInfo: LegacyCurrentUserResponse): Api.Auth.UserInfo {
  return {
    buttons: [],
    roles: userInfo.roles ?? [],
    userId: 0,
    userName: userInfo.username,
    email: '',
    avatar: userInfo.icon
  }
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request
    .get<LegacyCurrentUserResponse>({
      url: `${USERS_BASE_PATH}/me`
      // 自定义请求头
      // headers: {
      //   'X-Custom-Header': 'your-custom-value'
      // }
    })
    .then(transformLegacyUserInfo)
}
