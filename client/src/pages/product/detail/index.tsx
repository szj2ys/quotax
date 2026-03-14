import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { navigateBack, getCurrentInstance, showLoading, hideLoading, showToast, navigateTo, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getProductDetail } from '@/api/product'
import { addToCart } from '@/api/cart'
import { getUserInfo } from '@/utils/auth'
import { generateQRCode } from '@/api/qrcode'
import SharePoster from '@/components/SharePoster'
import type { Product, ProductSpec } from '@/types'
import './index.scss'

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showSharePoster, setShowSharePoster] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const instance = getCurrentInstance()
    const params = instance?.router?.params || {}
    const productId = params.id

    if (productId) {
      fetchProductDetail(productId)
    }

    // Load user info for share
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  const fetchProductDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await getProductDetail(id)
      setProduct(res)
    } catch (error) {
      console.error('获取产品详情失败:', error)
      showToast({ title: '获取产品信息失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigateBack()
  }

  const handleAddToCart = async () => {
    if (!product) return
    try {
      showLoading({ title: '添加中...' })
      await addToCart(product.id)
      hideLoading()
      showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      hideLoading()
      showToast({ title: '添加失败', icon: 'error' })
    }
  }

  const handleInquiry = () => {
    if (!product) return
    navigateTo({ url: `/pages/cart/index?productId=${product.id}&quantity=${quantity}` })
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  const getPriceTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      retail: '零售价',
      wholesale: '批发价',
      agent: '代理价'
    }
    return typeMap[type] || type
  }

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  // 分享配置 - 分享给朋友
  useShareAppMessage(() => {
    if (!product) return {}
    return {
      title: `${product.name} - ¥${product.price}/${product.unit}`,
      path: `/pages/product/detail/index?id=${product._id}&ref=${userInfo?.id || ''}`,
      imageUrl: product.images?.[0] || ''
    }
  })

  // 分享配置 - 分享到朋友圈
  useShareTimeline(() => {
    if (!product) return {}
    return {
      title: `${product.name} - ¥${product.price}/${product.unit}`,
      query: `id=${product._id}&ref=${userInfo?.id || ''}`,
      imageUrl: product.images?.[0] || ''
    }
  })

  // 打开分享海报
  const handleShare = async () => {
    if (!product) return

    showLoading({ title: '生成二维码...' })
    try {
      const qrRes = await generateQRCode({
        scene: `id=${product._id}`,
        page: 'pages/product/detail/index',
        width: 200
      })
      setQrCodeUrl(qrRes.qrCodeUrl)
      setShowSharePoster(true)
    } catch (error) {
      console.error('生成二维码失败:', error)
      showToast({ title: '生成二维码失败', icon: 'none' })
    } finally {
      hideLoading()
    }
  }

  if (loading || !product) {
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
        <View className='share-btn' onClick={handleShare}>
          <Text className='share-icon'>📤</Text>
        </View>
      </View>

      <ScrollView className='content-scroll' scrollY>
        {/* 图片轮播 */}
        <View className='image-section'>
          {product.images && product.images.length > 0 ? (
            <Swiper
              className='image-swiper'
              indicatorDots
              indicatorColor='#999'
              indicatorActiveColor='#1890ff'
              current={currentImage}
              onChange={(e) => setCurrentImage(e.detail.current)}
            >
              {product.images.map((image, index) => (
                <SwiperItem key={index}>
                  <Image
                    className='swiper-image'
                    src={image}
                    mode='aspectFill'
                    onClick={() => {
                      Taro.previewImage({
                        current: image,
                        urls: product.images
                      })
                    }}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className='no-image'>
              <Text>暂无图片</Text>
            </View>
          )}
          {product.images && product.images.length > 1 && (
            <View className='image-indicator'>
              <Text>{currentImage + 1} / {product.images.length}</Text>
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View className='product-info-section'>
          <View className='price-row'>
            <Text className='price-symbol'>¥</Text>
            <Text className='price'>{formatPrice(product.price)}</Text>
            <Text className='unit'>/{product.unit}</Text>
            <Text className='price-type'>{getPriceTypeText(product.priceType)}</Text>
          </View>

          <Text className='product-name'>{product.name}</Text>

          <View className='meta-row'>
            {product.categoryName && (
              <View className='category-tag'>
                <Text>{product.categoryName}</Text>
              </View>
            )}
            <Text className={`status-tag ${product.status}`}>
              {product.status === 'on' ? '上架中' : '已下架'}
            </Text>
          </View>
        </View>

        {/* 规格信息 */}
        {product.specs && product.specs.length > 0 && (
          <View className='specs-section'>
            <Text className='section-title'>产品规格</Text>
            {product.specs.map((spec: ProductSpec, index) => (
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

        {/* 库存信息 */}
        <View className='stock-section'>
          <Text className='stock-label'>库存</Text>
          <Text className='stock-value'>{product.stock} {product.unit}</Text>
        </View>

        <View className='safe-area-bottom' />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <View className='quantity-section'>
          <Text className='quantity-label'>数量</Text>
          <View className='quantity-control'>
            <View
              className={`quantity-btn ${quantity <= 1 ? 'disabled' : ''}`}
              onClick={decreaseQuantity}
            >
              <Text>-</Text>
            </View>
            <Text className='quantity-value'>{quantity}</Text>
            <View className='quantity-btn' onClick={increaseQuantity}>
              <Text>+</Text>
            </View>
          </View>
        </View>
        <View className='action-buttons'>
          <View className='cart-btn' onClick={handleAddToCart}>
            <Text>加入购物车</Text>
          </View>
          <View className='inquiry-btn' onClick={handleInquiry}>
            <Text>立即询价</Text>
          </View>
        </View>
      </View>

      {/* 分享海报弹窗 */}
      {product && (
        <SharePoster
          visible={showSharePoster}
          product={product}
          userInfo={userInfo || {}}
          qrCodeUrl={qrCodeUrl}
          onClose={() => setShowSharePoster(false)}
        />
      )}
    </View>
  )
}
