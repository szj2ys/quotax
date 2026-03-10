import { get, post, put, del } from './request'
import type { Product, Category } from '@/types'

// 获取产品列表
export const getProductList = (params: {
  page?: number
  pageSize?: number
  categoryId?: string
  keyword?: string
  status?: string
}) => {
  return get<{
    list: Product[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>('/products', params)
}

// 获取产品详情
export const getProductDetail = (id: string) => {
  return get<Product>(`/products/${id}`)
}

// 获取分类列表
export const getCategoryList = () => {
  return get<{ list: Category[] }>('/categories')
}

// 公开报价单接口（无需认证）
export const getQuotation = (userId: string, params?: {
  categoryId?: string
  keyword?: string
}) => {
  return get<{
    company: {
      name: string
      logo?: string
      contactName?: string
      contactPhone?: string
    }
    categories: Category[]
    products: Product[]
  }>(`/quotations/${userId}`, params, { showLoading: false })
}
