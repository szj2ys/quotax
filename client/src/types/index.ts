// 用户类型
export interface UserInfo {
  id: string
  openid: string
  nickName: string
  avatarUrl: string
  companyName?: string
  companyLogo?: string
  contactName?: string
  contactPhone?: string
  companyAddress?: string
  companyIntro?: string
}

// 产品规格
export interface ProductSpec {
  name: string
  value: string
}

// 产品类型
export interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  categoryId: string
  categoryName: string
  price: number
  priceType: 'retail' | 'wholesale' | 'agent'
  specs: ProductSpec[]
  unit: string
  stock: number
  status: 'on' | 'off'
  createdAt: string
  updatedAt?: string
  contactPhone?: string
}

// 分类类型
export interface Category {
  id: string
  name: string
  sort: number
  productCount: number
}

// 购物车商品
export interface CartItem {
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
  specs: ProductSpec[]
  selected?: boolean
}

// 购物车数据
export interface CartData {
  items: CartItem[]
  totalCount: number
  totalAmount: number
}

// 收藏商品
export interface FavoriteItem {
  productId: string
  productName: string
  productImage: string
  price: number
  createdAt: string
}

// 公司信息
export interface CompanyInfo {
  companyName: string
  companyLogo?: string
  contactName?: string
  contactPhone?: string
  companyAddress?: string
  companyIntro?: string
}

// 分页数据
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 订单导出项
export interface OrderExportItem {
  productId: string
  quantity: number
}
