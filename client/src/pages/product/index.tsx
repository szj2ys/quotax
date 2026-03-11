import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { showToast } from '@tarojs/taro'
import { getProductList } from '@/api/product'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'
import './index.scss'

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getProductList({
        page: 1,
        pageSize: 20,
        status: 'on'
      })
      setProducts(res.list)
    } catch (error) {
      console.error('获取产品列表失败:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (_productId: string) => {
    showToast({ title: '已加入购物车', icon: 'success' })
  }

  const handleAddProduct = () => {
    navigateTo({ url: '/pages/product/add/index' })
  }

  return (
    <View className='product-list-page'>
      {/* 顶部导航 */}
      <View className='nav-header'>
        <Text className='nav-title'>全部产品</Text>
      </View>

      <ScrollView className='content-scroll' scrollY>
        {/* 加载中 */}
        {loading && (
          <View className='loading-container'>
            <View className='loading-spinner'></View>
            <Text className='loading-text'>加载中...</Text>
          </View>
        )}

        {/* 产品网格 */}
        {!loading && !error && products.length > 0 && (
          <View className='product-grid'>
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                image={product.images[0]}
                price={product.price}
                unit={product.unit}
                specs={product.specs}
                onAddToCart={handleAddToCart}
              />
            ))}
          </View>
        )}

        {/* 空状态 */}
        {!loading && !error && products.length === 0 && (
          <View className='empty-wrapper'>
            <View className='empty-icon-wrapper'>
              <Text className='empty-icon'>📦</Text>
            </View>
            <Text className='empty-title'>暂无产品</Text>
            <Text className='empty-desc'>还没有添加任何产品，快去添加吧</Text>
            <View className='empty-action' onClick={handleAddProduct}>
              <Text className='action-text'>添加产品</Text>
            </View>
          </View>
        )}

        {/* 错误状态 */}
        {!loading && error && (
          <View className='empty-wrapper'>
            <View className='empty-icon-wrapper'>
              <Text className='empty-icon'>📡</Text>
            </View>
            <Text className='empty-title'>网络连接失败</Text>
            <Text className='empty-desc'>请检查网络设置后重试</Text>
            <View className='empty-action' onClick={fetchProducts}>
              <Text className='action-text'>🔄 重新加载</Text>
            </View>
          </View>
        )}

        <View className='safe-area-bottom' />
      </ScrollView>
    </View>
  )
}
