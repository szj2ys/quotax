import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import {
  showLoading,
  hideLoading,
  showToast,
  useDidShow,
  setClipboardData,
  navigateBack
} from '@tarojs/taro'
import { getExportHistory, ExportHistoryItem } from '@/api/export'
import './index.scss'

export default function ExportHistoryPage() {
  const [historyList, setHistoryList] = useState<ExportHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 加载导出历史
  const loadHistory = useCallback(async (isRefresh = false) => {
    if (loading) return
    if (!isRefresh && !hasMore) return

    setLoading(true)
    if (isRefresh) {
      showLoading({ title: '加载中...' })
    }

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await getExportHistory({ page: currentPage, pageSize: 20 })

      if (isRefresh) {
        setHistoryList(res.list)
      } else {
        setHistoryList(prev => [...prev, ...res.list])
      }

      setHasMore(res.list.length === 20)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('加载导出历史失败:', error)
      showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
      if (isRefresh) {
        hideLoading()
      }
    }
  }, [loading, hasMore, page])

  // 页面显示时加载数据
  useDidShow(() => {
    loadHistory(true)
  })

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 判断链接是否已过期
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  // 复制下载链接
  const handleCopyLink = (item: ExportHistoryItem) => {
    if (isExpired(item.expiresAt)) {
      showToast({ title: '链接已过期', icon: 'error' })
      return
    }

    setClipboardData({
      data: item.url,
      success: () => {
        showToast({ title: '链接已复制', icon: 'success' })
      },
      fail: () => {
        showToast({ title: '复制失败', icon: 'error' })
      }
    })
  }

  // 返回上一页
  const handleBack = () => {
    navigateBack()
  }

  // 加载更多
  const handleLoadMore = () => {
    loadHistory(false)
  }

  return (
    <View className='export-history-page'>
      {/* 顶部导航 */}
      <View className='nav-header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>←</Text>
        </View>
        <Text className='nav-title'>导出历史</Text>
        <View className='nav-placeholder' />
      </View>

      <ScrollView
        className='history-scroll'
        scrollY
        enableBackToTop
        onScrollToLower={handleLoadMore}
      >
        {historyList.length > 0 ? (
          <View className='history-list'>
            {historyList.map((item, index) => (
              <View key={item.id} className='history-item'>
                <View className='item-header'>
                  <View className='file-type'>
                    <Text className='type-icon'>
                      {item.type === 'pdf' ? '📄' : '📊'}
                    </Text>
                    <Text className='type-label'>
                      {item.type === 'pdf' ? 'PDF 文件' : 'Excel 文件'}
                    </Text>
                  </View>
                  <View className={`status-badge ${isExpired(item.expiresAt) ? 'expired' : 'valid'}`}>
                    <Text className='status-text'>
                      {isExpired(item.expiresAt) ? '已过期' : '有效'}
                    </Text>
                  </View>
                </View>

                <View className='item-info'>
                  <Text className='info-row'>
                    <Text className='info-label'>导出时间：</Text>
                    <Text className='info-value'>{formatDate(item.createdAt)}</Text>
                  </Text>
                  <Text className='info-row'>
                    <Text className='info-label'>过期时间：</Text>
                    <Text className='info-value'>{formatDate(item.expiresAt)}</Text>
                  </Text>
                </View>

                <View className='item-actions'>
                  {!isExpired(item.expiresAt) ? (
                    <View
                      className='action-btn primary'
                      onClick={() => handleCopyLink(item)}
                    >
                      <Text className='action-text'>复制下载链接</Text>
                    </View>
                  ) : (
                    <View className='action-btn disabled'>
                      <Text className='action-text'>链接已过期</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <View className='load-more' onClick={handleLoadMore}>
                <Text className='load-text'>{loading ? '加载中...' : '点击加载更多'}</Text>
              </View>
            )}

            {!hasMore && historyList.length > 0 && (
              <View className='no-more'>
                <Text className='no-more-text'>没有更多记录了</Text>
              </View>
            )}
          </View>
        ) : (
          <View className='empty-state'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>暂无导出记录</Text>
            <Text className='empty-hint'>导出的报价单将显示在这里</Text>
          </View>
        )}

        {/* 底部安全区域 */}
        <View className='safe-area-bottom' />
      </ScrollView>
    </View>
  )
}
