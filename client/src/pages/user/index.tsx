import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import {
  showLoading,
  hideLoading,
  showToast,
  saveImageToPhotosAlbum,
  getUserProfile,
  useDidShow
} from '@tarojs/taro'
import { getUserInfo, clearAuth } from '@/utils/auth'
import { generateQRCode } from '@/api/qrcode'
import './index.scss'

export default function UserPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [menuItems] = useState([
    { icon: '📦', label: '我的产品', path: '/pages/product/index' },
    { icon: '📋', label: '报价记录', path: '/pages/cart/index' },
    { icon: '⭐', label: '收藏夹', path: '/pages/favorites/index' },
    { icon: '⚙️', label: '设置', path: '/pages/settings/index' }
  ])

  useDidShow(() => {
    loadUserInfo()
  })

  const loadUserInfo = () => {
    const user = getUserInfo()
    setUserInfo(user)
  }

  // 生成小程序码
  const handleGenerateQRCode = async () => {
    if (!userInfo?.id) {
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
      const downloadRes = await new Promise<any>((resolve, reject) => {
        wx.downloadFile({
          url: qrCodeUrl,
          success: resolve,
          fail: reject
        })
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
    if (!userInfo?.id) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const link = `pages/quotation/share/index?userId=${userInfo.id}`

    wx.setClipboardData({
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
    // 触发右上角分享菜单
    showToast({ title: '点击右上角分享按钮', icon: 'none' })
  }

  // 退出登录
  const handleLogout = () => {
    clearAuth()
    setUserInfo(null)
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
            <Text className='company-name'>{userInfo?.companyName || '点击登录'}</Text>
          </View>
        </View>
      </View>

      {/* 分享功能区域 */}
      <View className='share-section'>
        <Text className='section-title'>分享报价单</Text>
        <View className='share-grid'>
          <View className='share-item' onClick={handleGenerateQRCode}>
            <View className='share-icon-wrapper qrcode'>
              <Text className='share-icon'>📱</Text>
            </View>
            <Text className='share-label'>生成小程序码</Text>
          </View>
          <View className='share-item' onClick={handleShareToFriend}>
            <View className='share-icon-wrapper wechat'>
              <Text className='share-icon'>💬</Text>
            </View>
            <Text className='share-label'>转发给好友</Text>
          </View>
          <View className='share-item' onClick={handleCopyLink}>
            <View className='share-icon-wrapper link'>
              <Text className='share-icon'>🔗</Text>
            </View>
            <Text className='share-label'>复制链接</Text>
          </View>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className='menu-section'>
        {menuItems.map((item, index) => (
          <View key={index} className='menu-item'>
            <Text className='menu-icon'>{item.icon}</Text>
            <Text className='menu-label'>{item.label}</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      {userInfo && (
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
