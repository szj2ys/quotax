import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import { navigateBack, showToast, makePhoneCall, getCurrentInstance } from '@tarojs/taro'
import { getProductDetail } from '@/api/product'
import { addToCart } from '@/api/cart'
import { getUserInfo } from '@/utils/auth'
import type { Product } from '@/types'
import './index.scss'

export default function QuotationProductDetail() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [supplierId, setSupplierId] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const instance = getCurrentInstance()
    const params = instance?.router?.params || {}
    const productId = params.id
    const targetSupplierId = params.supplierId

    if (productId) {
      fetchProductDetail(productId)
    }

    if (targetSupplierId) {
      setSupplierId(targetSupplierId)
    }

    // 检查登录状态
    const user = getUserInfo()
    setIsLoggedIn(!!user)
  }, [])

  const fetchProductDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await getProductDetail(id)
      setProduct(res)
    } catch (error) {
      console.error('获取产品详情失败:', error)
      showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 加入购物车
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }

    if (!product) return

    try {
      await addToCart(product.id)
      showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      showToast({ title: '添加失败', icon: 'error' })
    }
  }

  // 电话咨询
  const handleCall = () => {
    if (product?.contactPhone) {
      makePhoneCall({ phoneNumber: product.contactPhone })
    } else {
      showToast({ title: '暂无联系方式', icon: 'none' })
    }
  }

  // 返回
  const handleBack = () => {
    navigateBack()
  }

  // 格式化价格
  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  if (!product) {
    return (
      <View className='quotation-product-detail'>
        <View className='loading-state'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='quotation-product-detail'>
      {/* 顶部导航 */}
      <View className='nav-header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
        </View>
        <Text className='nav-title'>产品详情</Text>
        <View className='nav-placeholder' />
      </View>

      <ScrollView className='content-scroll' scrollY>
        {/* 图片轮播 */}
        <View className='image-gallery'>
          <Swiper
            className='image-swiper'
            indicatorColor='#999'
            indicatorActiveColor='#1890ff'
            circular
            autoplay
            onChange={(e) => setCurrentImageIndex(e.detail.current)}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((image, index) => (
                <SwiperItem key={index}>
                  <Image className='gallery-image' src={image} mode='aspectFill' />
                </SwiperItem>
              ))
            ) : (
              <SwiperItem>
                <View className='gallery-image-placeholder'>
                  <Text className='placeholder-icon'>📷</Text>
                </View>
              </SwiperItem>
            )}
          </Swiper>
          {product.images && product.images.length > 1 && (
            <View className='image-indicator'>
              <Text className='indicator-text'>
                {currentImageIndex + 1} / {product.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* 产品信息 */}
        <View className='product-info-section'>
          <View className='price-row'>
            <View className='price-wrapper'>
              <Text className='price-symbol'>¥</Text>
              <Text className='price-value'>{formatPrice(product.price)}</Text>
              <Text className='price-unit'>/{product.unit}</Text>
            </View>
            <Text className='price-type'>
              {product.priceType === 'retail' && '零售价'}
              {product.priceType === 'wholesale' && '批发价'}
              {product.priceType === 'agent' && '代理价'}
            </Text>
          </View>

          <Text className='product-name'>{product.name}</Text>

          {product.categoryName && (
            <View className='category-tag'>
              <Text className='tag-text'>{product.categoryName}</Text>
            </View>
          )}
        </View>

        {/* 规格信息 */}
        {product.specs && product.specs.length > 0 && (
          <View className='specs-section'>
            <Text className='section-title'>产品规格</Text>
            <View className='specs-list'>
              {product.specs.map((spec, index) => (
                <View key={index} className='spec-item'>
                  <Text className='spec-name'>{spec.name}</Text>
                  <Text className='spec-value'>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 产品描述 */}
        {product.description && (
          <View className='description-section'>
            <Text className='section-title'>产品描述</Text>
            <Text className='description-text'>{product.description}</Text>
          </View>
        )}

        {/* 库存信息 */}
        <View className='stock-section'>
          <View className='stock-item'>
            <Text className='stock-label'>库存状态</Text>
            <Text className={`stock-value ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
              {product.stock > 0 ? `现货充足 (${product.stock}${product.unit})` : '暂时缺货'}
            </Text>
          </View>
        </View>

        {/* 底部安全区域 */}
        <View className='safe-area-bottom' />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-btn call-btn' onClick={handleCall}>
          <Text className='btn-icon'>📞</Text>
          <Text className='btn-text'>电话咨询</Text>
        </View>
        {isLoggedIn && (
          <View className='action-btn cart-btn' onClick={handleAddToCart}>
            <Text className='btn-icon'>🛒</Text>
            <Text className='btn-text'>加入购物车</Text>
          </View>
        )}
        <View className='action-btn share-btn' onClick={() => showToast({ title: '点击右上角分享', icon: 'none' })}>
          <Text className='btn-icon'>📤</Text>
          <Text className='btn-text'>分享</Text>
        </View>
      </View>
    </View>
  )
}
