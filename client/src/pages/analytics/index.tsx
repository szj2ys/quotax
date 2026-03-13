import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import {
  showLoading,
  hideLoading,
  usePullDownRefresh,
  stopPullDownRefresh,
  navigateBack,
} from '@tarojs/taro'
import { getDashboardData } from '@/api/analytics'
import './index.scss'

// Simple trend chart component using CSS
const TrendChart = ({ data }: { data: Array<{ date: string; pv: number; uv: number }> }) => {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map(d => Math.max(d.pv, d.uv)), 1)
  const chartHeight = 120

  return (
    <View className='trend-chart'>
      <View className='chart-container'>
        {/* Y-axis labels */}
        <View className='y-axis'>
          <Text className='y-label'>{maxValue}</Text>
          <Text className='y-label'>{Math.round(maxValue / 2)}</Text>
          <Text className='y-label'>0</Text>
        </View>

        {/* Bars */}
        <View className='bars-container'>
          {data.map((item, index) => (
            <View key={item.date} className='bar-group'>
              <View className='bar-wrapper'>
                {/* PV bar */}
                <View
                  className='bar pv-bar'
                  style={{
                    height: `${(item.pv / maxValue) * chartHeight}px`,
                  }}
                />
                {/* UV bar */}
                <View
                  className='bar uv-bar'
                  style={{
                    height: `${(item.uv / maxValue) * chartHeight}px`,
                  }}
                />
              </View>
              <Text className='x-label'>
                {item.date.slice(5)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View className='chart-legend'>
        <View className='legend-item'>
          <View className='legend-dot pv-dot' />
          <Text className='legend-text'>浏览量(PV)</Text>
        </View>
        <View className='legend-item'>
          <View className='legend-dot uv-dot' />
          <Text className='legend-text'>访客数(UV)</Text>
        </View>
      </View>
    </View>
  )
}

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

// Format duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    today: { pv: 0, uv: 0 },
    week: { pv: 0, uv: 0 },
    month: { pv: 0, uv: 0 },
    total: 0,
  })
  const [trend, setTrend] = useState<Array<{ date: string; pv: number; uv: number }>>([])
  const [recentVisits, setRecentVisits] = useState<Array<{
    visitorId: string
    timestamp: string
    location: string
    duration: number
    scrollDepth: number
  }>>([])
  const [popularProducts, setPopularProducts] = useState<Array<{
    productId: string
    clicks: number
    name: string
    image: string
  }>>([])

  const fetchData = async () => {
    if (loading) return
    setLoading(true)
    showLoading({ title: '加载中...' })

    try {
      const res = await getDashboardData()
      setSummary(res.summary)
      setTrend(res.trend)
      setRecentVisits(res.recentVisits)
      setPopularProducts(res.popularProducts)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
      hideLoading()
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  usePullDownRefresh(async () => {
    await fetchData()
    stopPullDownRefresh()
  })

  return (
    <View className='analytics-page'>
      {/* Header */}
      <View className='analytics-header'>
        <View className='header-back' onClick={() => navigateBack()}>
          <Text className='back-icon'>‹</Text>
        </View>
        <Text className='header-title'>数据洞察</Text>
      </View>

      <ScrollView scrollY className='analytics-content'>
        {/* Summary Cards */}
        <View className='summary-section'>
          <View className='summary-card today'>
            <Text className='card-label'>今日浏览</Text>
            <View className='card-numbers'>
              <View className='number-item'>
                <Text className='number-value'>{summary.today.pv}</Text>
                <Text className='number-label'>浏览量</Text>
              </View>
              <View className='number-divider' />
              <View className='number-item'>
                <Text className='number-value'>{summary.today.uv}</Text>
                <Text className='number-label'>访客数</Text>
              </View>
            </View>
          </View>

          <View className='stats-row'>
            <View className='stat-card'>
              <Text className='stat-value'>{summary.week.pv}</Text>
              <Text className='stat-label'>本周浏览</Text>
            </View>
            <View className='stat-card'>
              <Text className='stat-value'>{summary.month.pv}</Text>
              <Text className='stat-label'>本月浏览</Text>
            </View>
            <View className='stat-card'>
              <Text className='stat-value'>{summary.total}</Text>
              <Text className='stat-label'>总浏览</Text>
            </View>
          </View>
        </View>

        {/* Trend Chart */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>访问趋势 (7天)</Text>
          </View>
          <TrendChart data={trend} />
        </View>

        {/* Recent Visits */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>最近访问</Text>
          </View>
          {recentVisits.length > 0 ? (
            <View className='visit-list'>
              {recentVisits.map((visit, index) => (
                <View key={index} className='visit-item'>
                  <View className='visit-avatar'>
                    <Text className='avatar-text'>👤</Text>
                  </View>
                  <View className='visit-info'>
                    <View className='visit-meta'>
                      <Text className='visit-location'>{visit.location}</Text>
                      <Text className='visit-time'>
                        {formatRelativeTime(visit.timestamp)}
                      </Text>
                    </View>
                    <View className='visit-stats'>
                      {visit.duration > 0 && (
                        <Text className='visit-stat'>停留 {formatDuration(visit.duration)}</Text>
                      )}
                      {visit.scrollDepth > 0 && (
                        <Text className='visit-stat'>阅读 {visit.scrollDepth}%</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='empty-state'>
              <Text className='empty-text'>暂无访问记录</Text>
            </View>
          )}
        </View>

        {/* Popular Products */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>热门产品</Text>
          </View>
          {popularProducts.length > 0 ? (
            <View className='product-rank-list'>
              {popularProducts.map((product, index) => (
                <View key={product.productId} className='rank-item'>
                  <View className={`rank-number rank-${index + 1}`}>
                    <Text className='rank-text'>{index + 1}</Text>
                  </View>
                  <View className='rank-product-image'>
                    {product.image ? (
                      <Text className='product-img'>🖼️</Text>
                    ) : (
                      <Text className='product-img-placeholder'>📦</Text>
                    )}
                  </View>
                  <View className='rank-product-info'>
                    <Text className='rank-product-name' numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className='rank-product-clicks'>
                      {product.clicks} 次点击
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='empty-state'>
              <Text className='empty-text'>暂无产品点击数据</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className='analytics-footer'>
          <Text className='footer-text'>数据每 5 分钟更新一次</Text>
          <Text className='footer-privacy'>仅展示匿名访问数据，保护客户隐私</Text>
        </View>
      </ScrollView>
    </View>
  )
}
