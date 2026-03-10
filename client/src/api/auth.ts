import { post, put } from './request'
import type { UserInfo } from '@/types'

// 微信登录
export const login = (code: string, userInfo?: {
  nickName?: string
  avatarUrl?: string
}) => {
  return post<{
    token: string
    user: UserInfo
  }>('/auth/login', { code, userInfo })
}

// 更新用户信息
export const updateProfile = (data: {
  companyName?: string
  contactName?: string
  contactPhone?: string
  companyLogo?: string
}) => {
  return put('/auth/profile', data)
}
