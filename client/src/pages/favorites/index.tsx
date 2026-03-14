import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { showToast, showLoading, hideLoading } from '@tarojs/taro'
import { getFavorites, removeFavorite } from '@/api/favorite'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import './index.scss'

interface Product {
  _id: string
  name: string
  price: number
  unit: string
  image: string
  categoryName?: string
  companyName?: string
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const loadFavorites = useCallback(async (refresh = false) => {
    if (loading) return

    setLoading(true)
    try {
      const res = await getFavorites()
      const newFavorites = res.list || []
      setFavorites(newFavorites)
    } catch (error) {
      console.error('加载收藏失败:', error)
      showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      if (refresh) {
        Taro.stopPullDownRefresh()
      }
    }
  }, [loading])

  useEffect(() => {
    loadFavorites()
  }, [])

  const handleRemoveFavorite = async (productId: string) => {
    try {
      showLoading({ title: '取消中...' })
      await removeFavorite(productId)
      setFavorites(prev => prev.filter(item => item._id !== productId))
      showToast({ title: '已取消收藏', icon: 'success' })
    } catch (error) {
      console.error('取消收藏失败:', error)
      showToast({ title: '操作失败', icon: 'none' })
    } finally {
      hideLoading()
    }
  }

  const handleProductClick = (productId: string) => {
    Taro.navigateTo({
      url: `/pages/product/detail/index?id=${productId}`
    })
  }

  if (favorites.length === 0 && !loading) {
    return (
      <View className='favorites-page'>
        <EmptyState
          icon='⭐'
          title='暂无收藏'
          description='收藏感兴趣的产品，方便随时查看'
          action={{
            text: '去浏览产品',
            onClick: () => Taro.switchTab({ url: '/pages/product/index' })
          }}
        />
      </View>
    )
  }

  return (
    <View className='favorites-page'>
      <ScrollView
        className='favorites-list'
        scrollY
        refresherEnabled
        onRefresherRefresh={() => loadFavorites(true)}
      >
        {favorites.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            showFavorite
            isFavorite
            onFavoriteClick={() => handleRemoveFavorite(product._id)}
            onClick={() => handleProductClick(product._id)}
          />
        ))}

        {loading && (
          <View className='loading-state'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
