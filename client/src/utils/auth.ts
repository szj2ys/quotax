import Taro from '@tarojs/taro'

const TOKEN_KEY = 'token'
const USER_KEY = 'userInfo'

// 存储Token
export const setToken = (token: string) => {
  Taro.setStorageSync(TOKEN_KEY, token)
}

// 获取Token
export const getToken = (): string => {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

// 清除Token
export const clearToken = () => {
  Taro.removeStorageSync(TOKEN_KEY)
}

// 存储用户信息
export const setUserInfo = (userInfo: any) => {
  Taro.setStorageSync(USER_KEY, userInfo)
}

// 获取用户信息
export const getUserInfo = (): any => {
  return Taro.getStorageSync(USER_KEY) || null
}

// 清除用户信息
export const clearUserInfo = () => {
  Taro.removeStorageSync(USER_KEY)
}

// 清除所有登录信息
export const clearAuth = () => {
  clearToken()
  clearUserInfo()
}

// 检查是否登录
export const isLoggedIn = (): boolean => {
  return !!getToken()
}
