import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import { navigateTo, showToast, usePullDownRefresh, stopPullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import ProductCard from '@/components/ProductCard'
import { getCategoryList, getProductList, addToCart } from '@/api'
import { getUserInfo } from '@/utils/auth'
import type { Category, Product } from '@/types'
import './index.scss'

export default function Index() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)

  // 获取分类
  const fetchCategories = async () => {
    try {
      const res = await getCategoryList()
      setCategories(res.list)
      if (res.list.length > 0 && !currentCategory) {
        setCurrentCategory(res.list[0].id)
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 获取产品列表
  const fetchProducts = async (pageNum = 1, categoryId = currentCategory, isRefresh = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getProductList({
        page: pageNum,
        pageSize: 10,
        categoryId: categoryId || undefined,
        status: 'on'
      })

      if (isRefresh) {
        setProducts(res.list)
      } else {
        setProducts(prev => [...prev, ...res.list])
      }

      setHasMore(pageNum < res.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error('获取产品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
    fetchCategories()
  }, [])

  // 分类切换时获取产品
  useEffect(() => {
    if (currentCategory) {
      fetchProducts(1, currentCategory, true)
    }
  }, [currentCategory])

  // 下拉刷新
  usePullDownRefresh(async () => {
    await fetchCategories()
    await fetchProducts(1, currentCategory, true)
    stopPullDownRefresh()
  })

  // 加载更多
  // @ts-expect-error 保留供后续使用
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1)
    }
  }

  // 分类切换
  const handleCategoryChange = (id: string) => {
    setCurrentCategory(id)
  }

  // 添加到购物车
  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId)
      showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      showToast({ title: '添加失败', icon: 'error' })
    }
  }

  // 查看所有产品
  const handleViewAllProducts = () => {
    navigateTo({ url: '/pages/product/index' })
  }

  // 配置分享
  useShareAppMessage(() => {
    return {
      title: `${userInfo?.companyName || '我的'}的产品报价单`,
      path: `/pages/quotation/share/index?userId=${userInfo?.id || ''}`,
      imageUrl: userInfo?.companyLogo || '/assets/images/share-default.png'
    }
  })

  return (
    <View className='index-page'>
      {/* 公司信息头部 */}
      <View className='company-header'>
        <View className='company-info'>
          {userInfo?.companyLogo ? (
            <Image className='company-logo' src={userInfo.companyLogo} mode='aspectFit' />
          ) : (
            <View className='company-logo-placeholder'>
              <Text className='company-logo-text'>🏢</Text>
            </View>
          )}
          <View className='company-meta'>
            <Text className='company-name'>{userInfo?.companyName || '我的公司'}</Text>
            <Text className='company-contact'>
              {userInfo?.contactName ? `联系人: ${userInfo.contactName}` : '暂无联系人信息'}
            </Text>
          </View>
        </View>
        <View className='share-btn' onClick={() => navigateTo({ url: '/pages/user/index' })}>
          <Text className='share-icon'>📤</Text>
          <Text className='share-text'>分享报价</Text>
        </View>
      </View>

      {/* 轮播图 */}
      <Swiper className='banner-swiper' indicatorColor='#999' indicatorActiveColor='#1890ff' circular autoplay>
        <SwiperItem>
          <View className='banner-item'>
            <Text className='banner-title'>专业B2B报价工具</Text>
            <Text className='banner-subtitle'>一键生成专业报价单，提升业务效率</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-item-2'>
            <Text className='banner-title'>产品分类管理</Text>
            <Text className='banner-subtitle'>清晰分类，快速查找</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-item-3'>
            <Text className='banner-title'>购物车批量导出</Text>
            <Text className='banner-subtitle'>支持PDF/Excel格式导出</Text>
          </View>
        </SwiperItem>
      </Swiper>

      {/* 分类栏 */}
      <View className='category-section'>
        <View className='section-header'>
          <Text className='section-title'>产品分类</Text>
          <Text className='section-more' onClick={handleViewAllProducts}>查看全部 &gt;</Text>
        </View>
        <ScrollView className='category-scroll' scrollX showScrollbar={false}>
          <View className='category-list'>
            {categories.map(category => (
              <View
                key={category.id}
                className={`category-item ${currentCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <Text className='category-name'>{category.name}</Text>
                <Text className='category-count'>{category.productCount}件</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 产品列表 */}
      <View className='product-section'>
        <View className='section-header'>
          <Text className='section-title'>热门产品</Text>
        </View>
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
        {loading && <View className='loading-text'>加载中...</View>}
        {!hasMore && products.length > 0 && <View className='no-more-text'>没有更多了</View>}
        {products.length === 0 && !loading && (
          <View className='empty-products'>
            <Text className='empty-text'>暂无产品</Text>
          </View>
        )}
      </View>

      {/* 底部安全区域 */}
      <View className='safe-area-bottom' />
    </View>
  )
}
