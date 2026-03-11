import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { navigateTo, showToast } from '@tarojs/taro'
import { getProductList } from '@/api/product'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'
import './index.scss'

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await getProductList({
        page: 1,
        pageSize: 20,
        status: 'on'
      })
      setProducts(res.list)
    } catch (error) {
      console.error('获取产品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    showToast({ title: '已加入购物车', icon: 'success' })
  }

  return (
    <View className='product-list-page'>
      {/* 顶部导航 */}
      <View className='nav-header'>
        <Text className='nav-title'>全部产品</Text>
      </View>

      <ScrollView className='content-scroll' scrollY>
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

        {products.length === 0 && !loading && (
          <View className='empty-state'>
            <Text className='empty-icon'>📦</Text>
            <Text className='empty-text'>暂无产品</Text>
          </View>
        )}

        <View className='safe-area-bottom' />
      </ScrollView>
    </View>
  )
}
