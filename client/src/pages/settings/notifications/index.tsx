import { useState, useEffect } from 'react'
import { View, Text, Input, Switch, Button } from '@tarojs/components'
import { showLoading, hideLoading, showToast } from '@tarojs/taro'
import { getNotificationPreferences, updateNotificationPreferences, sendTestEmail } from '@/api/notifications'
import './index.scss'

export default function NotificationSettingsPage() {
  const [email, setEmail] = useState('')
  const [preferences, setPreferences] = useState({
    daily: true,
    weekly: true,
    monthly: true,
    newLead: true
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const res = await getNotificationPreferences()
      if (res.code === 200 && res.data) {
        setEmail(res.data.email || '')
        setPreferences({
          daily: res.data.preferences?.daily ?? true,
          weekly: res.data.preferences?.weekly ?? true,
          monthly: res.data.preferences?.monthly ?? true,
          newLead: res.data.preferences?.newLead ?? true
        })
      }
    } catch (error) {
      console.error('加载通知设置失败:', error)
      showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // 验证邮箱格式
    if (email && !isValidEmail(email)) {
      showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }

    setSaving(true)
    showLoading({ title: '保存中...' })

    try {
      const res = await updateNotificationPreferences({
        email: email.trim(),
        preferences
      })

      if (res.code === 200) {
        showToast({ title: '保存成功', icon: 'success' })
      } else {
        showToast({ title: res.message || '保存失败', icon: 'error' })
      }
    } catch (error) {
      console.error('保存通知设置失败:', error)
      showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
      hideLoading()
    }
  }

  const handleSendTestEmail = async (period: 'daily' | 'weekly' | 'monthly') => {
    if (!email) {
      showToast({ title: '请先设置邮箱地址', icon: 'none' })
      return
    }

    setTesting(true)
    showLoading({ title: '发送中...' })

    try {
      const res = await sendTestEmail(period)
      if (res.code === 200) {
        showToast({ title: '测试邮件已发送', icon: 'success' })
      } else {
        showToast({ title: res.message || '发送失败', icon: 'error' })
      }
    } catch (error) {
      console.error('发送测试邮件失败:', error)
      showToast({ title: '发送失败', icon: 'error' })
    } finally {
      setTesting(false)
      hideLoading()
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <View className='notification-settings-page'>
      {/* 邮箱设置 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>📧 邮箱设置</Text>
          <Text className='section-desc'>用于接收数据报告和通知</Text>
        </View>
        <View className='form-item'>
          <Text className='form-label'>邮箱地址</Text>
          <Input
            className='form-input'
            type='text'
            placeholder='请输入邮箱地址'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>
      </View>

      {/* 日报推送设置 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>📊 数据报告</Text>
          <Text className='section-desc'>选择您希望接收的数据报告类型</Text>
        </View>

        <View className='preference-item'>
          <View className='preference-info'>
            <Text className='preference-name'>日报推送</Text>
            <Text className='preference-desc'>每天早上9点发送昨日数据摘要</Text>
          </View>
          <Switch
            className='preference-switch'
            checked={preferences.daily}
            onChange={() => handlePreferenceChange('daily')}
            color='#1890ff'
          />
        </View>

        <View className='preference-item'>
          <View className='preference-info'>
            <Text className='preference-name'>周报推送</Text>
            <Text className='preference-desc'>每周一早上9点发送上周数据汇总</Text>
          </View>
          <Switch
            className='preference-switch'
            checked={preferences.weekly}
            onChange={() => handlePreferenceChange('weekly')}
            color='#1890ff'
          />
        </View>

        <View className='preference-item'>
          <View className='preference-info'>
            <Text className='preference-name'>月报推送</Text>
            <Text className='preference-desc'>每月1日早上9点发送上月数据报告</Text>
          </View>
          <Switch
            className='preference-switch'
            checked={preferences.monthly}
            onChange={() => handlePreferenceChange('monthly')}
            color='#1890ff'
          />
        </View>
      </View>

      {/* 实时通知设置 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>🔔 实时通知</Text>
          <Text className='section-desc'>重要事件的即时邮件通知</Text>
        </View>

        <View className='preference-item'>
          <View className='preference-info'>
            <Text className='preference-name'>新询价通知</Text>
            <Text className='preference-desc'>当有新客户提交询价时立即通知</Text>
          </View>
          <Switch
            className='preference-switch'
            checked={preferences.newLead}
            onChange={() => handlePreferenceChange('newLead')}
            color='#1890ff'
          />
        </View>
      </View>

      {/* 测试按钮 */}
      {email && (
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>🧪 测试邮件</Text>
            <Text className='section-desc'>发送测试邮件验证配置是否正确</Text>
          </View>
          <View className='test-buttons'>
            <Button
              className='test-btn'
              onClick={() => handleSendTestEmail('daily')}
              disabled={testing}
            >
              <Text className='btn-text'>测试日报</Text>
            </Button>
            <Button
              className='test-btn'
              onClick={() => handleSendTestEmail('weekly')}
              disabled={testing}
            >
              <Text className='btn-text'>测试周报</Text>
            </Button>
            <Button
              className='test-btn'
              onClick={() => handleSendTestEmail('monthly')}
              disabled={testing}
            >
              <Text className='btn-text'>测试月报</Text>
            </Button>
          </View>
        </View>
      )}

      {/* 保存按钮 */}
      <View className='save-section'>
        <Button
          className='save-btn'
          onClick={handleSave}
          disabled={saving}
        >
          <Text className='save-btn-text'>{saving ? '保存中...' : '保存设置'}</Text>
        </Button>
      </View>

      {/* 底部安全区域 */}
      <View className='safe-area-bottom' />
    </View>
  )
}
