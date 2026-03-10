import { get, post, del } from './request'
import type { FavoriteItem } from '@/types'

// 获取收藏列表
export const getFavorites = () => {
  return get<{ list: FavoriteItem[] }>('/favorites')
}

// 添加收藏
export const addFavorite = (productId: string) => {
  return post('/favorites', { productId })
}

// 取消收藏
export const removeFavorite = (productId: string) => {
  return del(`/favorites/${productId}`)
}
