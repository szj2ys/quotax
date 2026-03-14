import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import {
  showLoading,
  hideLoading,
  showToast,
  saveImageToPhotosAlbum,
  useDidShow,
  navigateTo,
  downloadFile,
  setClipboardData
} from '@tarojs/taro'
import { getUserInfo, clearAuth, isLoggedIn } from '@/utils/auth'
import { generateQRCode } from '@/api/qrcode'
import { getAnalyticsSummary } from '@/api/analytics'
import { getShareStats } from '@/api/share'
import './index.scss'

export default function UserPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [todayViews, setTodayViews] = useState(0)
  const [hasNewData, setHasNewData] = useState(false)
  const [shareStats, setShareStats] = useState({
    totalShares: 0,
    totalViews: 0,
    totalConversions: 0
  })

  // 管理菜单
  const managementMenuItems = [
    { icon: '📦', label: '产品管理', path: '/pages/product/manage/index' },
    { icon: '📂', label: '分类管理', path: '/pages/category/manage/index' }
  ]

  // 其他菜单
  const otherMenuItems = [
    { icon: '📊', label: '数据洞察', path: '/pages/analytics/index', badge: hasNewData ? todayViews : 0, showBadge: hasNewData },
    { icon: '🛒', label: '购物车', path: '/pages/cart/index' },
    { icon: '⭐', label: '收藏夹', path: '/pages/favorites/index' },
    { icon: '⚙️', label: '设置', path: '/pages/settings/index' }
  ]

  useDidShow(() => {
    loadUserInfo()
    if (loggedIn) {
      loadAnalyticsSummary()
    }
  })

  useEffect(() => {
    if (loggedIn) {
      loadAnalyticsSummary()
      loadShareStats()
    }
  }, [loggedIn])

  const loadShareStats = async () => {
    try {
      const res = await getShareStats()
      setShareStats({
        totalShares: res.totalShares || 0,
        totalViews: res.totalViews || 0,
        totalConversions: res.totalConversions || 0
      })
    } catch (error) {
      console.error('加载分享统计失败:', error)
    }
  }

  const loadAnalyticsSummary = async () => {
    try {
      const res = await getAnalyticsSummary()
      setTodayViews(res.today.uv)
      setHasNewData(res.hasNewData)
    } catch (error) {
      console.error('加载数据摘要失败:', error)
    }
  }

  const loadUserInfo = () => {
    const isUserLoggedIn = isLoggedIn()
    setLoggedIn(isUserLoggedIn)

    if (isUserLoggedIn) {
      const user = getUserInfo()
      setUserInfo(user)
    } else {
      setUserInfo(null)
    }
  }

  // 跳转到登录页
  const handleLogin = () => {
    navigateTo({ url: '/pages/login/index' })
  }

  // 跳转到页面
  const handleNavigate = (path: string) => {
    if (!loggedIn) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    navigateTo({ url: path })
  }

  // 跳转到公司信息
  const handleCompanyInfo = () => {
    if (!loggedIn) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    navigateTo({ url: '/pages/settings/company/index' })
  }

  // 生成小程序码
  const handleGenerateQRCode = async () => {
    if (!loggedIn || !userInfo?.id) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }

    showLoading({ title: '生成中...' })

    try {
      const res = await generateQRCode()
      setQrCodeUrl(res.qrCodeUrl)
      setShowQRCode(true)
    } catch (error) {
      console.error('生成小程序码失败:', error)
      showToast({ title: '生成失败', icon: 'error' })
    } finally {
      hideLoading()
    }
  }

  // 保存小程序码
  const handleSaveQRCode = async () => {
    if (!qrCodeUrl) return

    showLoading({ title: '保存中...' })

    try {
      // 先下载图片
      const downloadRes = await downloadFile({
        url: qrCodeUrl
      })

      if (downloadRes.statusCode === 200) {
        await saveImageToPhotosAlbum({ filePath: downloadRes.tempFilePath })
        showToast({ title: '已保存到相册', icon: 'success' })
      }
    } catch (error) {
      console.error('保存失败:', error)
      showToast({ title: '保存失败', icon: 'error' })
    } finally {
      hideLoading()
    }
  }

  // 关闭小程序码弹窗
  const handleCloseQRCode = () => {
    setShowQRCode(false)
  }

  // 复制链接
  const handleCopyLink = () => {
    if (!loggedIn || !userInfo?.id) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const link = `pages/quotation/share/index?userId=${userInfo.id}`

    setClipboardData({
      data: link,
      success: () => {
        showToast({ title: '链接已复制', icon: 'success' })
      },
      fail: () => {
        showToast({ title: '复制失败', icon: 'error' })
      }
    })
  }

  // 分享给好友
  const handleShareToFriend = () => {
    if (!loggedIn) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    // 触发右上角分享菜单
    showToast({ title: '点击右上角分享按钮', icon: 'none' })
  }

  // 退出登录
  const handleLogout = () => {
    clearAuth()
    setUserInfo(null)
    setLoggedIn(false)
    showToast({ title: '已退出登录', icon: 'success' })
  }

  return (
    <View className='user-page'>
      {/* 用户信息头部 */}
      <View className='user-header'>
        <View className='user-info'>
          {userInfo?.avatarUrl ? (
            <Image className='user-avatar' src={userInfo.avatarUrl} mode='aspectFill' />
          ) : (
            <View className='user-avatar-placeholder'>
              <Text className='avatar-icon'>👤</Text>
            </View>
          )}
          <View className='user-meta'>
            <Text className='user-name'>{userInfo?.nickName || '未登录'}</Text>
            <Text className='company-name'>
              {userInfo?.companyName || (loggedIn ? '暂未设置公司' : '点击登录查看更多功能')}
            </Text>
            {loggedIn && hasNewData && (
              <Text className='analytics-preview'>
                今日 {todayViews} 人查看你的报价
              </Text>
            )}
          </View>
          {!loggedIn && (
            <Button
              className='login-btn-small'
              type='primary'
              size='mini'
              onClick={handleLogin}
            >
              去登录
            </Button>
          )}
        </View>
      </View>

      {/* 分享功能区域 */}
      <View className='share-section'>
        <Text className='section-title'>分享报价单</Text>
        <View className='share-grid'>
          <View
            className={`share-item ${!loggedIn ? 'disabled' : ''}`}
            onClick={handleGenerateQRCode}
          >
            <View className='share-icon-wrapper qrcode'>
              <Text className='share-icon'>📱</Text>
            </View>
            <Text className='share-label'>生成小程序码</Text>
          </View>
          <View
            className={`share-item ${!loggedIn ? 'disabled' : ''}`}
            onClick={handleShareToFriend}
          >
            <View className='share-icon-wrapper wechat'>
              <Text className='share-icon'>💬</Text>
            </View>
            <Text className='share-label'>转发给好友</Text>
          </View>
          <View
            className={`share-item ${!loggedIn ? 'disabled' : ''}`}
            onClick={handleCopyLink}
          >
            <View className='share-icon-wrapper link'>
              <Text className='share-icon'>🔗</Text>
            </View>
            <Text className='share-label'>复制链接</Text>
          </View>
        </View>
      </View>

      {/* 分享统计区域 */}
      {loggedIn && (
        <View className='stats-section'>
          <View className='stats-header'>
            <Text className='stats-title'>分享效果</Text>
          </View>
          <View className='stats-grid'>
            <View className='stat-item'>
              <Text className='stat-value'>{shareStats.totalShares}</Text>
              <Text className='stat-label'>分享次数</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{shareStats.totalViews}</Text>
              <Text className='stat-label'>带来访客</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{shareStats.totalConversions}</Text>
              <Text className='stat-label'>转化次数</Text>
            </View>
          </View>
        </View>
      )}

      {/* 产品管理区域 */}
      <View className='menu-section'>
        <View className='menu-header'>
          <Text className='menu-title'>产品管理</Text>
        </View>
        {managementMenuItems.map((item, index) => (
          <View
            key={index}
            className={`menu-item ${!loggedIn ? 'disabled' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            <Text className='menu-icon'>{item.icon}</Text>
            <Text className='menu-label'>{item.label}</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 公司信息区域 */}
      <View className='menu-section'>
        <View className='menu-header'>
          <Text className='menu-title'>公司信息</Text>
        </View>
        <View
          className={`menu-item company-menu-item ${!loggedIn ? 'disabled' : ''}`}
          onClick={handleCompanyInfo}
        >
          <Text className='menu-icon'>🏢</Text>
          <View className='menu-content'>
            <Text className='menu-label'>
              {userInfo?.companyName || '公司信息'}
            </Text>
            {loggedIn && userInfo?.companyName ? (
              <Text className='menu-subtitle'>点击编辑公司信息</Text>
            ) : (
              <Text className='menu-subtitle'>设置公司名称、联系方式等</Text>
            )}
          </View>
          <Text className='menu-arrow'>›</Text>
        </View>
        {/* 公司信息摘要 */}
        {loggedIn && (
          <View className='company-summary'>
            <View className='company-summary-item'>
              <Text className='summary-icon'>👤</Text>
              <Text className='summary-text'>{userInfo?.contactName || '未设置联系人'}</Text>
            </View>
            <View className='company-summary-item'>
              <Text className='summary-icon'>📱</Text>
              <Text className='summary-text'>{userInfo?.contactPhone || '未设置电话'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 其他功能区域 */}
      <View className='menu-section'>
        <View className='menu-header'>
          <Text className='menu-title'>其他</Text>
        </View>
        {otherMenuItems.map((item, index) => (
          <View
            key={index}
            className={`menu-item ${!loggedIn ? 'disabled' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            <Text className='menu-icon'>{item.icon}</Text>
            <View className='menu-content'>
              <Text className='menu-label'>{item.label}</Text>
            </View>
            {item.showBadge && item.badge > 0 && (
              <View className='menu-badge'>
                <Text className='badge-text'>{item.badge > 99 ? '99+' : item.badge}</Text>
              </View>
            )}
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      {loggedIn && (
        <View className='logout-section'>
          <View className='logout-btn' onClick={handleLogout}>
            <Text className='logout-text'>退出登录</Text>
          </View>
        </View>
      )}

      {/* 小程序码弹窗 */}
      {showQRCode && (
        <View className='qrcode-modal' onClick={handleCloseQRCode}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>扫码查看报价单</Text>
              <Text className='modal-close' onClick={handleCloseQRCode}>✕</Text>
            </View>
            <View className='qrcode-wrapper'>
              {qrCodeUrl ? (
                <Image className='qrcode-image' src={qrCodeUrl} mode='aspectFit' />
              ) : (
                <View className='qrcode-placeholder'>
                  <Text className='placeholder-text'>加载中...</Text>
                </View>
              )}
            </View>
            <Text className='qrcode-tip'>客户扫码即可查看您的产品报价单</Text>
            <View className='modal-actions'>
              <View className='action-btn save-btn' onClick={handleSaveQRCode}>
                <Text className='btn-text'>保存到相册</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 底部安全区域 */}
      <View className='safe-area-bottom' />
    </View>
  )
}
