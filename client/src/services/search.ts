import { get } from '@/api/request'
import type { Product, Category } from '@/types'

// 搜索参数
export interface SearchParams {
  keyword?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  pageSize?: number
  sortBy?: 'price_asc' | 'price_desc' | 'created_desc'
}

// 搜索结果
export interface SearchResult {
  list: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters?: {
    categories: Category[]
    priceRange: {
      min: number
      max: number
    }
  }
}

/**
 * 搜索产品
 * @param params 搜索参数
 * @returns 搜索结果
 */
export const searchProducts = (params: SearchParams): Promise<SearchResult> => {
  const defaultParams = {
    page: 1,
    pageSize: 10,
    ...params
  }

  return get<SearchResult>('/products/search', defaultParams)
}

/**
 * 获取搜索建议
 * @param keyword 关键词
 * @returns 建议列表
 */
export const getSearchSuggestions = (keyword: string): Promise<string[]> => {
  if (!keyword || keyword.trim() === '') {
    return Promise.resolve([])
  }

  return get<string[]>('/products/suggestions', { keyword })
}
