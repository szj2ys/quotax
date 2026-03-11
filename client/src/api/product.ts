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

// 创建产品
export const createProduct = (data: Partial<Product>) => {
  return post<Product>('/products', data)
}

// 更新产品
export const updateProduct = (id: string, data: Partial<Product>) => {
  return put<Product>(`/products/${id}`, data)
}

// 删除产品
export const deleteProduct = (id: string) => {
  return del(`/products/${id}`)
}

// 获取分类列表
export const getCategoryList = () => {
  return get<{ list: Category[] }>('/categories')
}

// 创建分类
export const createCategory = (data: Partial<Category>) => {
  return post<Category>('/categories', data)
}

// 更新分类
export const updateCategory = (id: string, data: Partial<Category>) => {
  return put<Category>(`/categories/${id}`, data)
}

// 删除分类
export const deleteCategory = (id: string) => {
  return del(`/categories/${id}`)
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
