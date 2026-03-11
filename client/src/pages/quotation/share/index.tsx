import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { navigateTo, showToast, showLoading, hideLoading, usePullDownRefresh, stopPullDownRefresh, makePhoneCall, getCurrentInstance } from '@tarojs/taro'
import { getQuotation } from '@/api/product'
import type { Category, Product, CompanyInfo } from '@/types'
import './index.scss'

export default function QuotationShare() {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // 获取路由参数
  useEffect(() => {
    const instance = getCurrentInstance()
    const params = instance?.router?.params || {}
    const scene = params.scene
    let targetUserId = params.userId

    // 处理扫码场景值
    if (scene) {
      // scene 是二维码参数，格式如 "userId=xxx"
      const sceneParams = decodeURIComponent(scene)
      const match = sceneParams.match(/userId=([^&]+)/)
      if (match) {
        targetUserId = match[1]
      }
    }

    if (targetUserId) {
      setUserId(targetUserId)
      fetchQuotation(targetUserId)
    } else {
      showToast({ title: '无效链接', icon: 'error' })
    }
  }, [])

  // 获取报价单数据
  const fetchQuotation = async (targetUserId: string) => {
    if (loading) return
    setLoading(true)
    showLoading({ title: '加载中...' })

    try {
      const res = await getQuotation(targetUserId)
      setCompany(res.company)
      setCategories(res.categories)
      setProducts(res.products)
      setFilteredProducts(res.products)

      if (res.categories.length > 0) {
        setCurrentCategory(res.categories[0].id)
      }
    } catch (error) {
      console.error('获取报价单失败:', error)
      showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
      hideLoading()
    }
  }

  // 下拉刷新
  usePullDownRefresh(async () => {
    if (userId) {
      await fetchQuotation(userId)
    }
    stopPullDownRefresh()
  })

  // 分类筛选
  const handleCategoryChange = (id: string) => {
    setCurrentCategory(id)
    filterProducts(id, keyword)
  }

  // 搜索
  const handleSearch = (e: any) => {
    const value = e.detail.value
    setKeyword(value)
    filterProducts(currentCategory, value)
  }

  // 筛选产品
  const filterProducts = (categoryId: string, searchKeyword: string) => {
    let result = products

    if (categoryId) {
      result = result.filter(p => p.categoryId === categoryId)
    }

    if (searchKeyword) {
      const lowerKeyword = searchKeyword.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerKeyword) ||
        p.categoryName.toLowerCase().includes(lowerKeyword)
      )
    }

    setFilteredProducts(result)
  }

  // 查看产品详情
  const handleViewProduct = (productId: string) => {
    if (!userId) return
    navigateTo({
      url: `/pages/quotation/product/index?id=${productId}&supplierId=${userId}`
    })
  }

  // 电话联系
  const handleCall = () => {
    if (company?.contactPhone) {
      makePhoneCall({ phoneNumber: company.contactPhone })
    } else {
      showToast({ title: '暂无联系方式', icon: 'none' })
    }
  }

  // 格式化价格
  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  return (
    <View className='quotation-share-page'>
      {/* 公司信息头部 */}
      <View className='company-header'>
        <View className='company-info'>
          {company?.logo ? (
            <Image className='company-logo' src={company.logo} mode='aspectFit' />
          ) : (
            <View className='company-logo-placeholder'>
              <Text className='company-logo-text'>🏢</Text>
            </View>
          )}
          <View className='company-meta'>
            <Text className='company-name'>{company?.name || '产品报价单'}</Text>
            <Text className='company-contact'>
              {company?.contactName ? `联系人: ${company.contactName}` : '欢迎咨询采购'}
            </Text>
          </View>
        </View>
        {company?.contactPhone && (
          <View className='contact-btn' onClick={handleCall}>
            <Text className='contact-icon'>📞</Text>
            <Text className='contact-text'>询价</Text>
          </View>
        )}
      </View>

      {/* 搜索栏 */}
      <View className='search-bar'>
        <View className='search-input-wrapper'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            placeholder='搜索产品名称'
            value={keyword}
            onInput={handleSearch}
            confirmType='search'
          />
        </View>
      </View>

      {/* 分类栏 */}
      {categories.length > 0 && (
        <View className='category-section'>
          <ScrollView className='category-scroll' scrollX showScrollbar={false}>
            <View className='category-list'>
              <View
                className={`category-item ${currentCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                <Text className='category-name'>全部</Text>
                <Text className='category-count'>{products.length}件</Text>
              </View>
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
      )}

      {/* 产品列表 */}
      <View className='product-section'>
        <View className='section-header'>
          <Text className='section-title'>产品报价</Text>
          <Text className='section-count'>共{filteredProducts.length}件</Text>
        </View>

        <View className='product-grid'>
          {filteredProducts.map(product => (
            <View
              key={product.id}
              className='product-card'
              onClick={() => handleViewProduct(product.id)}
            >
              <Image
                className='product-image'
                src={product.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                mode='aspectFill'
              />
              <View className='product-info'>
                <Text className='product-name'>{product.name}</Text>
                {product.specs && product.specs.length > 0 && (
                  <View className='product-specs'>
                    {product.specs.slice(0, 2).map((spec, index) => (
                      <Text key={index} className='spec-tag'>
                        {spec.value}
                      </Text>
                    ))}
                  </View>
                )}
                <View className='product-footer'>
                  <View className='price-wrapper'>
                    <Text className='price-symbol'>¥</Text>
                    <Text className='price-value'>{formatPrice(product.price)}</Text>
                    <Text className='price-unit'>/{product.unit}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {filteredProducts.length === 0 && !loading && (
          <View className='empty-state'>
            <Text className='empty-icon'>📦</Text>
            <Text className='empty-text'>暂无产品</Text>
            {keyword && <Text className='empty-hint'>试试其他关键词</Text>}
          </View>
        )}
      </View>

      {/* 底部安全区域 */}
      <View className='safe-area-bottom' />

      {/* 联系按钮浮动 */}
      {company?.contactPhone && (
        <View className='float-contact-btn' onClick={handleCall}>
          <Text className='float-btn-icon'>📞</Text>
          <Text className='float-btn-text'>电话咨询</Text>
        </View>
      )}
    </View>
  )
}
