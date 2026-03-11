import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh, stopPullDownRefresh, navigateTo, showToast, showModal } from '@tarojs/taro'
import EmptyState from '@/components/EmptyState'
import { getProductList, getCategoryList, deleteProduct, updateProduct } from '@/api'
import type { Product, Category } from '@/types'
import './index.scss'

const PAGE_SIZE = 10

export default function ProductManage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [status, setStatus] = useState<string>('')

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await getCategoryList()
      setCategories(res.list)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 获取产品列表
  const fetchProducts = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getProductList({
        page: pageNum,
        pageSize: PAGE_SIZE,
        categoryId: currentCategory || undefined,
        keyword: searchKeyword || undefined,
        status: status || undefined
      })

      if (isRefresh) {
        setProducts(res.list)
      } else {
        setProducts(prev => [...prev, ...res.list])
      }

      setHasMore(pageNum < res.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error('获取产品列表失败:', error)
      showToast({ title: '获取列表失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentCategory, searchKeyword, status, loading])

  // 初始化
  useEffect(() => {
    fetchCategories()
    fetchProducts(1, true)
  }, [])

  // 筛选变化时重新加载
  useEffect(() => {
    fetchProducts(1, true)
  }, [currentCategory, status])

  // 下拉刷新
  usePullDownRefresh(async () => {
    await fetchCategories()
    await fetchProducts(1, true)
    stopPullDownRefresh()
  })

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1)
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchProducts(1, true)
  }

  // 切换状态
  const toggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'on' ? 'off' : 'on'
      await updateProduct(product.id, { ...product, status: newStatus })
      showToast({ title: newStatus === 'on' ? '已上架' : '已下架', icon: 'success' })
      fetchProducts(1, true)
    } catch (error) {
      showToast({ title: '操作失败', icon: 'error' })
    }
  }

  // 删除产品
  const handleDelete = (product: Product) => {
    showModal({
      title: '确认删除',
      content: `确定删除产品"${product.name}"吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteProduct(product.id)
            showToast({ title: '删除成功', icon: 'success' })
            fetchProducts(1, true)
          } catch (error) {
            showToast({ title: '删除失败', icon: 'error' })
          }
        }
      }
    })
  }

  // 编辑产品
  const handleEdit = (productId: string) => {
    navigateTo({ url: `/pages/product/edit/index?id=${productId}` })
  }

  // 添加产品
  const handleAdd = () => {
    navigateTo({ url: '/pages/product/add/index' })
  }

  // 查看详情
  const handleView = (productId: string) => {
    navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  // 获取价格类型文本
  const getPriceTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      retail: '零售价',
      wholesale: '批发价',
      agent: '代理价'
    }
    return typeMap[type] || type
  }

  return (
    <View className='product-manage-page'>
      {/* 搜索栏 */}
      <View className='search-section'>
        <View className='search-input-wrapper'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            placeholder='搜索产品名称'
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
          {searchKeyword && (
            <Text className='clear-icon' onClick={() => { setSearchKeyword(''); handleSearch() }}>×</Text>
          )}
        </View>
      </View>

      {/* 筛选栏 */}
      <View className='filter-section'>
        <ScrollView className='category-scroll' scrollX showScrollbar={false}>
          <View className='category-list'>
            <View
              className={`category-item ${currentCategory === '' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('')}
            >
              <Text className='category-text'>全部分类</Text>
            </View>
            {categories.map(category => (
              <View
                key={category.id}
                className={`category-item ${currentCategory === category.id ? 'active' : ''}`}
                onClick={() => setCurrentCategory(category.id)}
              >
                <Text className='category-text'>{category.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className='status-filter'>
          <View
            className={`status-item ${status === '' ? 'active' : ''}`}
            onClick={() => setStatus('')}
          >
            <Text>全部</Text>
          </View>
          <View
            className={`status-item ${status === 'on' ? 'active' : ''}`}
            onClick={() => setStatus('on')}
          >
            <Text>上架中</Text>
          </View>
          <View
            className={`status-item ${status === 'off' ? 'active' : ''}`}
            onClick={() => setStatus('off')}
          >
            <Text>已下架</Text>
          </View>
        </View>
      </View>

      {/* 产品列表 */}
      <ScrollView
        className='product-list'
        scrollY
        enableFlex
        onScrollToLower={handleLoadMore}
      >
        {products.length === 0 && !loading ? (
          <EmptyState
            title='暂无产品'
            description='还没有添加任何产品，点击下方按钮添加'
            actionText='添加产品'
            onAction={handleAdd}
          />
        ) : (
          <>
            {products.map(product => (
              <View key={product.id} className='product-item' onClick={() => handleView(product.id)}>
                <Image
                  className='product-image'
                  src={product.images[0] || 'https://via.placeholder.com/200x200?text=No+Image'}
                  mode='aspectFill'
                />
                <View className='product-info'>
                  <View className='product-header'>
                    <Text className='product-name'>{product.name}</Text>
                    <View className={`status-tag ${product.status}`}>
                      <Text>{product.status === 'on' ? '上架中' : '已下架'}</Text>
                    </View>
                  </View>
                  <Text className='product-category'>{product.categoryName}</Text>
                  <View className='product-price-row'>
                    <Text className='product-price'>¥{product.price.toFixed(2)}</Text>
                    <Text className='price-type'>/{product.unit}</Text>
                    <Text className='price-type-tag'>{getPriceTypeText(product.priceType)}</Text>
                  </View>
                  <View className='product-actions'>
                    <View
                      className={`action-btn ${product.status === 'on' ? 'warning' : 'success'}`}
                      onClick={(e) => { e.stopPropagation(); toggleStatus(product) }}
                    >
                      <Text>{product.status === 'on' ? '下架' : '上架'}</Text>
                    </View>
                    <View
                      className='action-btn primary'
                      onClick={(e) => { e.stopPropagation(); handleEdit(product.id) }}
                    >
                      <Text>编辑</Text>
                    </View>
                    <View
                      className='action-btn danger'
                      onClick={(e) => { e.stopPropagation(); handleDelete(product) }}
                    >
                      <Text>删除</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {loading && <View className='loading-text'>加载中...</View>}
            {!hasMore && products.length > 0 && <View className='no-more-text'>没有更多了</View>}
          </>
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      <View className='bottom-bar'>
        <View className='add-btn' onClick={handleAdd}>
          <Text className='add-icon'>+</Text>
          <Text className='add-text'>添加产品</Text>
        </View>
      </View>
    </View>
  )
}
