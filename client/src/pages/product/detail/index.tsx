import { View, Text, Image, ScrollView } from '@tarojs/components'
import { navigateBack, getCurrentInstance } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getProductDetail } from '@/api/product'
import type { Product } from '@/types'
import './index.scss'

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const instance = getCurrentInstance()
    const params = instance?.router?.params || {}
    const productId = params.id

    if (productId) {
      fetchProductDetail(productId)
    }
  }, [])

  const fetchProductDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await getProductDetail(id)
      setProduct(res)
    } catch (error) {
      console.error('获取产品详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigateBack()
  }

  if (!product) {
    return (
      <View className='product-detail-page'>
        <View className='loading-state'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='product-detail-page'>
      {/* 顶部导航 */}
      <View className='nav-header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
        </View>
        <Text className='nav-title'>产品详情</Text>
        <View className='nav-placeholder' />
      </View>

      <ScrollView className='content-scroll' scrollY>
        {/* 产品图片 */}
        <View className='product-image-wrapper'>
          <Image
            className='product-image'
            src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
            mode='aspectFill'
          />
        </View>

        {/* 产品信息 */}
        <View className='product-info-section'>
          <View className='price-row'>
            <Text className='price'>¥{product.price.toFixed(2)}</Text>
            <Text className='unit'>/{product.unit}</Text>
          </View>
          <Text className='product-name'>{product.name}</Text>
          {product.categoryName && (
            <View className='category-tag'>
              <Text>{product.categoryName}</Text>
            </View>
          )}
        </View>

        {/* 规格信息 */}
        {product.specs && product.specs.length > 0 && (
          <View className='specs-section'>
            <Text className='section-title'>产品规格</Text>
            {product.specs.map((spec, index) => (
              <View key={index} className='spec-row'>
                <Text className='spec-label'>{spec.name}</Text>
                <Text className='spec-value'>{spec.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 产品描述 */}
        {product.description && (
          <View className='description-section'>
            <Text className='section-title'>产品描述</Text>
            <Text className='description-text'>{product.description}</Text>
          </View>
        )}

        <View className='safe-area-bottom' />
      </ScrollView>
    </View>
  )
}
