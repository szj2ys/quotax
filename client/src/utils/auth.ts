import Taro from '@tarojs/taro'

const TOKEN_KEY = 'token'
const USER_KEY = 'userInfo'

/**
 * 存储 Token
 * @param token JWT token
 */
export const setToken = (token: string) => {
  Taro.setStorageSync(TOKEN_KEY, token)
}

/**
 * 获取 Token
 * @returns JWT token 或空字符串
 */
export const getToken = (): string => {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 清除 Token
 */
export const removeToken = () => {
  Taro.removeStorageSync(TOKEN_KEY)
}

/**
 * 清除 Token（别名，与 removeToken 相同）
 */
export const clearToken = removeToken

/**
 * 存储用户信息
 * @param userInfo 用户信息对象
 */
export const setUserInfo = (userInfo: any) => {
  Taro.setStorageSync(USER_KEY, userInfo)
}

/**
 * 获取用户信息
 * @returns 用户信息对象或 null
 */
export const getUserInfo = (): any => {
  return Taro.getStorageSync(USER_KEY) || null
}

/**
 * 清除用户信息
 */
export const clearUserInfo = () => {
  Taro.removeStorageSync(USER_KEY)
}

/**
 * 清除所有登录信息（Token + 用户信息）
 */
export const clearAuth = () => {
  removeToken()
  clearUserInfo()
}

/**
 * 检查是否已登录
 * @returns 是否已登录（有token且未过期）
 */
export const isLoggedIn = (): boolean => {
  const token = getToken()
  if (!token) {
    return false
  }
  // TODO: 如果需要检查 token 是否过期，可以解析 JWT 的 exp 字段
  // 目前简单判断有 token 就认为已登录
  return true
}
