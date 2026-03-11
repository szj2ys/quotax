import { get, post, put, del } from './request'
import type { CartData, OrderExportItem } from '@/types'

// 获取购物车
export const getCart = () => {
  return get<CartData>('/cart')
}

// 添加商品到购物车
export const addToCart = (productId: string, quantity = 1) => {
  return post('/cart/items', { productId, quantity })
}

// 更新购物车商品数量
export const updateCartItem = (productId: string, quantity: number) => {
  return put(`/cart/items/${productId}`, { quantity })
}

// 删除购物车商品
export const removeCartItem = (productId: string) => {
  return del(`/cart/items/${productId}`)
}

// 清空购物车
export const clearCart = () => {
  return del('/cart')
}

// 导出订货单
export const exportOrder = (data: {
  format: 'pdf' | 'excel'
  items: OrderExportItem[]
  remark?: string
}) => {
  return post<{ downloadUrl: string }>('/orders/export', data)
}
