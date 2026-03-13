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

// 更新公司信息（专用接口）
export const updateCompany = (data: {
  companyName?: string
  companyLogo?: string
  contactName?: string
  contactPhone?: string
  companyAddress?: string
  companyIntro?: string
}) => {
  return put('/auth/company', data)
}

// 上传图片（用于公司logo等）
export const uploadImage = (filePath: string, onProgress?: (progress: number) => void) => {
  return new Promise<string>((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/upload/image`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data.data.url)
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })

    // 监听上传进度
    if (onProgress && uploadTask) {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress)
      })
    }
  })
}
