import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, Textarea, Image } from '@tarojs/components'
import Taro, { showToast, showLoading, hideLoading, useDidShow } from '@tarojs/taro'
import { getUserInfo, setUserInfo } from '@/utils/auth'
import { updateCompany, uploadImage } from '@/api/auth'
import './index.scss'

interface FormData {
  companyName: string
  companyLogo: string
  contactName: string
  contactPhone: string
  companyAddress: string
  companyIntro: string
}

interface FormErrors {
  companyName?: string
  contactPhone?: string
}

export default function CompanySettings() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyLogo: '',
    contactName: '',
    contactPhone: '',
    companyAddress: '',
    companyIntro: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDirty, setIsDirty] = useState(false)

  // 加载用户信息
  const loadUserInfo = useCallback(() => {
    const userInfo = getUserInfo()
    if (userInfo) {
      setFormData({
        companyName: userInfo.companyName || '',
        companyLogo: userInfo.companyLogo || '',
        contactName: userInfo.contactName || '',
        contactPhone: userInfo.contactPhone || '',
        companyAddress: userInfo.companyAddress || '',
        companyIntro: userInfo.companyIntro || ''
      })
    }
  }, [])

  useDidShow(() => {
    loadUserInfo()
  })

  useEffect(() => {
    loadUserInfo()
  }, [loadUserInfo])

  // 验证手机号格式
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = '请输入公司名称'
    }

    if (formData.contactPhone && !validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = '请输入正确的手机号格式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理字段变化
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // 选择并上传Logo
  const handleChooseLogo = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = res.tempFilePaths[0]

      // 检查文件大小
      const fileInfo = await Taro.getFileInfo({ filePath: tempFilePath }) as { size: number }
      if (fileInfo.size > 5 * 1024 * 1024) {
        showToast({ title: '图片大小不能超过5MB', icon: 'none' })
        return
      }

      setUploading(true)
      setUploadProgress(0)

      // 上传图片
      const imageUrl = await uploadImage(tempFilePath, (progress) => {
        setUploadProgress(progress)
      })

      setFormData(prev => ({ ...prev, companyLogo: imageUrl }))
      setIsDirty(true)
      showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      console.error('上传Logo失败:', error)
      showToast({ title: '上传失败', icon: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // 移除Logo
  const handleRemoveLogo = () => {
    Taro.showModal({
      title: '提示',
      content: '确定删除公司Logo吗？',
      success: (res) => {
        if (res.confirm) {
          setFormData(prev => ({ ...prev, companyLogo: '' }))
          setIsDirty(true)
        }
      }
    })
  }

  // 保存公司信息
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({ title: '请检查表单填写', icon: 'none' })
      return
    }

    // 只提交有变化的字段
    const userInfo = getUserInfo()
    const changedData: Partial<FormData> = {}

    if (formData.companyName !== (userInfo?.companyName || '')) {
      changedData.companyName = formData.companyName
    }
    if (formData.companyLogo !== (userInfo?.companyLogo || '')) {
      changedData.companyLogo = formData.companyLogo
    }
    if (formData.contactName !== (userInfo?.contactName || '')) {
      changedData.contactName = formData.contactName
    }
    if (formData.contactPhone !== (userInfo?.contactPhone || '')) {
      changedData.contactPhone = formData.contactPhone
    }
    if (formData.companyAddress !== (userInfo?.companyAddress || '')) {
      changedData.companyAddress = formData.companyAddress
    }
    if (formData.companyIntro !== (userInfo?.companyIntro || '')) {
      changedData.companyIntro = formData.companyIntro
    }

    // 如果没有变化，直接返回
    if (Object.keys(changedData).length === 0) {
      showToast({ title: '没有需要保存的更改', icon: 'none' })
      return
    }

    try {
      showLoading({ title: '保存中...' })
      await updateCompany(changedData)

      // 更新本地存储的用户信息
      const updatedUserInfo = { ...userInfo, ...changedData }
      setUserInfo(updatedUserInfo)
      setIsDirty(false)

      showToast({ title: '保存成功', icon: 'success' })

      // 延迟返回
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('保存公司信息失败:', error)
      showToast({ title: '保存失败', icon: 'error' })
    } finally {
      hideLoading()
    }
  }

  return (
    <View className='company-settings-page'>
      {/* 公司预览 */}
      <View className='company-preview'>
        {formData.companyLogo ? (
          <Image className='company-logo' src={formData.companyLogo} mode='aspectFill' />
        ) : (
          <View className='company-logo-placeholder'>
            <Text className='placeholder-icon'>🏢</Text>
          </View>
        )}
        <View className='company-info'>
          <Text className='company-name'>
            {formData.companyName || '暂未设置公司名称'}
          </Text>
          <Text className='company-status'>
            {isDirty ? '有未保存的更改' : '公司信息完整'}
          </Text>
        </View>
      </View>

      {/* 基本信息表单 */}
      <View className='form-section'>
        <Text className='section-title'>
          <Text className='section-icon'>🏢</Text>
          基本信息
        </Text>

        {/* 公司Logo */}
        <View className='form-item logo-item'>
          <Text className='label'>
            <Text className='label-icon'>🖼️</Text>
            公司Logo
          </Text>
          <View className='logo-uploader'>
            {formData.companyLogo ? (
              <Image className='logo-preview' src={formData.companyLogo} mode='aspectFill' />
            ) : (
              <View className='logo-preview' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '40px' }}>🏢</Text>
              </View>
            )}
            <View className='logo-actions'>
              <View
                className={`upload-btn ${uploading ? 'uploading' : ''}`}
                onClick={handleChooseLogo}
              >
                {uploading ? (
                  <>
                    <Text className='btn-icon'>⏳</Text>
                    <Text className='btn-text'>{uploadProgress}%</Text>
                  </>
                ) : (
                  <>
                    <Text className='btn-icon'>📷</Text>
                    <Text className='btn-text'>{formData.companyLogo ? '更换Logo' : '上传Logo'}</Text>
                  </>
                )}
              </View>
              {formData.companyLogo && (
                <View className='remove-btn' onClick={handleRemoveLogo}>
                  <Text className='btn-icon'>🗑️</Text>
                  <Text className='btn-text'>删除</Text>
                </View>
              )}
              <Text className='upload-tip'>支持 jpg、png 格式，≤5MB</Text>
            </View>
          </View>
        </View>

        {/* 公司名称 */}
        <View className={`form-item ${errors.companyName ? 'error' : ''} required`}>
          <Text className='label'>
            <Text className='label-icon'>📝</Text>
            公司名称
          </Text>
          <Input
            className={`input ${errors.companyName ? 'error' : ''}`}
            placeholder='请输入公司名称'
            value={formData.companyName}
            onInput={(e) => handleChange('companyName', e.detail.value)}
            maxlength={50}
          />
          {errors.companyName && (
            <Text className='error-msg'>
              <Text className='error-icon'>⚠️</Text>
              {errors.companyName}
            </Text>
          )}
        </View>
      </View>

      {/* 联系信息 */}
      <View className='form-section'>
        <Text className='section-title'>
          <Text className='section-icon'>📞</Text>
          联系信息
        </Text>

        {/* 联系人 */}
        <View className='form-item'>
          <Text className='label'>
            <Text className='label-icon'>👤</Text>
            联系人
          </Text>
          <Input
            className='input'
            placeholder='请输入联系人姓名'
            value={formData.contactName}
            onInput={(e) => handleChange('contactName', e.detail.value)}
            maxlength={20}
          />
        </View>

        {/* 联系电话 */}
        <View className={`form-item ${errors.contactPhone ? 'error' : ''}`}>
          <Text className='label'>
            <Text className='label-icon'>📱</Text>
            联系电话
          </Text>
          <Input
            className={`input ${errors.contactPhone ? 'error' : ''}`}
            placeholder='请输入联系电话'
            type='number'
            value={formData.contactPhone}
            onInput={(e) => handleChange('contactPhone', e.detail.value)}
            maxlength={11}
          />
          {errors.contactPhone && (
            <Text className='error-msg'>
              <Text className='error-icon'>⚠️</Text>
              {errors.contactPhone}
            </Text>
          )}
        </View>

        {/* 公司地址 */}
        <View className='form-item'>
          <Text className='label'>
            <Text className='label-icon'>📍</Text>
            公司地址
          </Text>
          <Input
            className='input'
            placeholder='请输入公司地址'
            value={formData.companyAddress}
            onInput={(e) => handleChange('companyAddress', e.detail.value)}
            maxlength={100}
          />
        </View>
      </View>

      {/* 公司简介 */}
      <View className='form-section'>
        <Text className='section-title'>
          <Text className='section-icon'>📋</Text>
          公司简介
        </Text>

        <View className='form-item'>
          <Textarea
            className='textarea'
            placeholder='请输入公司简介（选填）'
            value={formData.companyIntro}
            onInput={(e) => handleChange('companyIntro', e.detail.value)}
            maxlength={500}
          />
          <Text className='char-count'>{formData.companyIntro.length}/500</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View className='submit-btn' onClick={handleSubmit}>
          <Text className='btn-icon'>💾</Text>
          <Text>保存设置</Text>
        </View>
      </View>
    </View>
  )
}
