import { View, Text } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { isLoggedIn } from '@/utils/auth'
import './index.scss'

export default function SettingsPage() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  const menuItems = [
    { icon: '🔔', label: '通知设置', path: '/pages/settings/notifications/index' },
  ]

  const handleNavigate = (path: string) => {
    if (!loggedIn) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    navigateTo({ url: path })
  }

  return (
    <View className='settings-page'>
      <View className='menu-section'>
        {menuItems.map((item, index) => (
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

      {/* 底部安全区域 */}
      <View className='safe-area-bottom' />
    </View>
  )
}
