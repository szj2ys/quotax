import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { navigateTo, showToast, getCurrentInstance, usePullDownRefresh, stopPullDownRefresh } from '@tarojs/taro'
import ProductCard from '@/components/ProductCard'
import { searchProducts } from '@/services/search'
import { getCategoryList, addToCart } from '@/api'
import type { Product, Category } from '@/types'
import './index.scss'

// 筛选选项
interface FilterOptions {
  categoryId: string
  minPrice: string
  maxPrice: string
  sortBy: 'default' | 'price_asc' | 'price_desc'
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'default'
  })

  // 获取URL参数中的关键词
  useEffect(() => {
    const instance = getCurrentInstance()
    const searchKeyword = instance?.router?.params?.keyword || ''
    if (searchKeyword) {
      setKeyword(decodeURIComponent(searchKeyword))
    }
  }, [])

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategoryList()
        setCategories(res.list)
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    }
    fetchCategories()
  }, [])

  // 搜索产品
  const fetchSearchResults = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading) return

    if (!keyword.trim()) {
      setProducts([])
      setHasMore(false)
      return
    }

    setLoading(true)
    try {
      const params = {
        keyword,
        page: pageNum,
        pageSize: 10,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.minPrice && { minPrice: parseFloat(filters.minPrice) }),
        ...(filters.maxPrice && { maxPrice: parseFloat(filters.maxPrice) }),
        ...(filters.sortBy !== 'default' && { sortBy: filters.sortBy })
      }

      const res = await searchProducts(params)

      if (isRefresh) {
        setProducts(res.list)
      } else {
        setProducts(prev => [...prev, ...res.list])
      }

      setHasMore(pageNum < res.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error('搜索失败:', error)
      showToast({ title: '搜索失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [keyword, filters, loading])

  // 关键词变化时重新搜索
  useEffect(() => {
    if (keyword) {
      fetchSearchResults(1, true)
    }
  }, [keyword, filters.categoryId, filters.sortBy])

  // 下拉刷新
  usePullDownRefresh(async () => {
    await fetchSearchResults(1, true)
    stopPullDownRefresh()
  })

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchSearchResults(page + 1)
    }
  }

  // 搜索框输入变化
  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
    setPage(1)
    setProducts([])
  }

  // 点击返回搜索
  const handleGoBackSearch = () => {
    navigateTo({ url: '/pages/index/index' })
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

  // 筛选操作
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'default'
    })
    setPage(1)
    setShowFilter(false)
  }

  // 应用筛选
  const handleApplyFilters = () => {
    setPage(1)
    fetchSearchResults(1, true)
    setShowFilter(false)
  }

  // 格式化价格
  const formatPrice = (price: number) => price.toFixed(2)

  return (
    <View className='search-page'>
      {/* 顶部搜索栏 */}
      <View className='search-header'>
        <View className='search-input-wrapper'>
          <View className='back-btn' onClick={handleGoBackSearch}>
            <Text className='back-icon'>←</Text>
          </View>
          <View className='search-input-box'>
            <Text className='search-icon'>🔍</Text>
            <Text className='search-text'>{keyword || '搜索产品名称'}</Text>
          </View>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className='filter-bar'>
        <View className='filter-tabs'>
          <View
            className={`filter-tab ${filters.sortBy === 'default' ? 'active' : ''}`}
            onClick={() => handleFilterChange('sortBy', 'default')}
          >
            <Text className='tab-text'>综合</Text>
          </View>
          <View
            className={`filter-tab ${filters.sortBy === 'price_asc' ? 'active' : ''}`}
            onClick={() => handleFilterChange('sortBy', filters.sortBy === 'price_asc' ? 'default' : 'price_asc')}
          >
            <Text className='tab-text'>价格</Text>
            <View className={`sort-icon ${filters.sortBy === 'price_asc' ? 'asc' : ''}`}>
              <Text className='arrow'>↑</Text>
            </View>
          </View>
          <View
            className={`filter-tab ${filters.sortBy === 'price_desc' ? 'active' : ''}`}
            onClick={() => handleFilterChange('sortBy', filters.sortBy === 'price_desc' ? 'default' : 'price_desc')}
          >
            <Text className='tab-text'>价格</Text>
            <View className={`sort-icon ${filters.sortBy === 'price_desc' ? 'desc' : ''}`}>
              <Text className='arrow'>↓</Text>
            </View>
          </View>
          <View
            className={`filter-tab ${showFilter ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <Text className='tab-text'>筛选</Text>
            <Text className='filter-icon'>🔧</Text>
          </View>
        </View>
      </View>

      {/* 筛选面板 */}
      {showFilter && (
        <View className='filter-panel'>
          {/* 分类筛选 */}
          <View className='filter-section'>
            <Text className='filter-title'>分类</Text>
            <View className='filter-options'>
              <View
                className={`filter-option ${filters.categoryId === '' ? 'active' : ''}`}
                onClick={() => handleFilterChange('categoryId', '')}
              >
                <Text className='option-text'>全部</Text>
              </View>
              {categories.map(category => (
                <View
                  key={category.id}
                  className={`filter-option ${filters.categoryId === category.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange('categoryId', category.id)}
                >
                  <Text className='option-text'>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 价格区间筛选 */}
          <View className='filter-section'>
            <Text className='filter-title'>价格区间</Text>
            <View className='price-range'>
              <View className='price-input-wrapper'>
                <Text className='price-symbol'>¥</Text>
                <input
                  className='price-input'
                  type='digit'
                  placeholder='最低价'
                  value={filters.minPrice}
                  onInput={(e) => handleFilterChange('minPrice', e.detail.value)}
                />
              </View>
              <Text className='price-separator'>-</Text>
              <View className='price-input-wrapper'>
                <Text className='price-symbol'>¥</Text>
                <input
                  className='price-input'
                  type='digit'
                  placeholder='最高价'
                  value={filters.maxPrice}
                  onInput={(e) => handleFilterChange('maxPrice', e.detail.value)}
                />
              </View>
            </View>
          </View>

          {/* 筛选操作按钮 */}
          <View className='filter-actions'>
            <View className='reset-btn' onClick={handleResetFilters}>
              <Text className='btn-text'>重置</Text>
            </View>
            <View className='confirm-btn' onClick={handleApplyFilters}>
              <Text className='btn-text'>确定</Text>
            </View>
          </View>
        </View>
      )}

      {/* 产品列表 */}
      <ScrollView
        className='product-list'
        scrollY
        onScrollToLower={handleLoadMore}
        lowerThreshold={50}
      >
        {products.length > 0 ? (
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
        ) : (
          <View className='empty-state'>
            <Text className='empty-icon'>🔍</Text>
            <Text className='empty-text'>
              {loading ? '搜索中...' : (keyword ? '暂无相关产品' : '请输入关键词搜索')}
            </Text>
          </View>
        )}

        {/* 加载状态 */}
        {loading && products.length > 0 && (
          <View className='loading-more'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        )}

        {/* 没有更多 */}
        {!hasMore && products.length > 0 && (
          <View className='no-more'>
            <Text className='no-more-text'>没有更多了</Text>
          </View>
        )}

        {/* 底部安全区域 */}
        <View className='safe-area-bottom' />
      </ScrollView>
    </View>
  )
}
