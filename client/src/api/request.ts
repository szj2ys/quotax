import Taro from '@tarojs/taro'
import { getToken, clearAuth } from '@/utils/auth'
import { showError } from '@/utils/common'

// API基础配置 - 使用环境变量
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'

// 请求配置
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
  loadingText?: string
}

// 请求封装
export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {}, showLoading = true, loadingText = '加载中...' } = options

  // 显示loading
  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true })
  }

  // 添加token到请求头
  const token = getToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // 添加默认header
  header['Content-Type'] = 'application/json'

  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header
    })

    Taro.hideLoading()

    // 处理响应
    const { statusCode, data: responseData } = res

    if (statusCode >= 200 && statusCode < 300) {
      const { code, message, data: result } = responseData as any

      if (code === 200) {
        return result as T
      } else if (code === 401) {
        // Token过期或无效，清除登录状态并跳转登录页
        clearAuth()
        Taro.navigateTo({ url: '/pages/login/index' })
        throw new Error('登录已过期，请重新登录')
      } else {
        showError(message || '请求失败')
        throw new Error(message || '请求失败')
      }
    } else {
      // 处理 HTTP 401 状态码
      if (statusCode === 401) {
        clearAuth()
        Taro.navigateTo({ url: '/pages/login/index' })
        throw new Error('登录已过期，请重新登录')
      }
      showError('网络请求失败')
      throw new Error('网络请求失败')
    }
  } catch (error: any) {
    Taro.hideLoading()
    console.error('Request error:', error)
    throw error
  }
}

// GET请求
export const get = <T = any>(url: string, params?: any, options?: Partial<RequestOptions>) => {
  // 处理查询参数
  let fullUrl = url
  if (params) {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    if (queryString) {
      fullUrl = `${url}?${queryString}`
    }
  }
  return request<T>({ url: fullUrl, method: 'GET', ...options })
}

// POST请求
export const post = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request<T>({ url, method: 'POST', data, ...options })
}

// PUT请求
export const put = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request<T>({ url, method: 'PUT', data, ...options })
}

// DELETE请求
export const del = <T = any>(url: string, options?: Partial<RequestOptions>) => {
  return request<T>({ url, method: 'DELETE', ...options })
}
