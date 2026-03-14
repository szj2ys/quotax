import { useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { showToast, showLoading, hideLoading } from '@tarojs/taro'
import { submitLead } from '@/api/leads'
import { getUserInfo } from '@/utils/auth'
import './index.scss'

interface LeadFormProps {
  visible: boolean
  productId: string
  productName: string
  onClose: () => void
  onSuccess?: () => void
}

interface FormData {
  name: string
  company: string
  phone: string
  message: string
}

interface FormErrors {
  name?: string
  phone?: string
}

export default function LeadForm({ visible, productId, productName, onClose, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    phone: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Auto-fill user info if logged in
  const userInfo = getUserInfo()
  if (userInfo && !formData.name && !formData.phone) {
    setFormData(prev => ({
      ...prev,
      name: userInfo.contactName || '',
      company: userInfo.companyName || ''
    }))
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入联系电话'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '请输入正确的手机号格式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    showLoading({ title: '提交中...' })
    try {
      await submitLead({
        productId,
        productName,
        ...formData
      })

      hideLoading()
      showToast({ title: '提交成功', icon: 'success' })
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        name: '',
        company: '',
        phone: '',
        message: ''
      })
    } catch (error) {
      hideLoading()
      console.error('提交留资失败:', error)
      showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!visible) return null

  return (
    <View className='lead-form-modal'>
      <View className='modal-overlay' onClick={onClose} />
      <View className='modal-content'>
        <View className='modal-header'>
          <Text className='modal-title'>我要询价</Text>
          <Text className='close-btn' onClick={onClose}>✕</Text>
        </View>

        <View className='product-info'>
          <Text className='product-label'>询价产品</Text>
          <Text className='product-name'>{productName}</Text>
        </View>

        <View className='form-section'>
          <View className={`form-item ${errors.name ? 'error' : ''}`}>
            <Text className='form-label'>
              姓名 <Text className='required'>*</Text>
            </Text>
            <Input
              className='form-input'
              placeholder='请输入您的姓名'
              value={formData.name}
              onInput={(e) => handleChange('name', e.detail.value)}
              maxlength={20}
            />
            {errors.name && <Text className='error-text'>{errors.name}</Text>}
          </View>

          <View className='form-item'>
            <Text className='form-label'>公司名称</Text>
            <Input
              className='form-input'
              placeholder='请输入公司名称（选填）'
              value={formData.company}
              onInput={(e) => handleChange('company', e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className={`form-item ${errors.phone ? 'error' : ''}`}>
            <Text className='form-label'>
              联系电话 <Text className='required'>*</Text>
            </Text>
            <Input
              className='form-input'
              placeholder='请输入手机号'
              type='number'
              value={formData.phone}
              onInput={(e) => handleChange('phone', e.detail.value)}
              maxlength={11}
            />
            {errors.phone && <Text className='error-text'>{errors.phone}</Text>}
          </View>

          <View className='form-item'>
            <Text className='form-label'>留言</Text>
            <Textarea
              className='form-textarea'
              placeholder='请输入您的需求或问题（选填）'
              value={formData.message}
              onInput={(e) => handleChange('message', e.detail.value)}
              maxlength={200}
            />
            <Text className='char-count'>{formData.message.length}/200</Text>
          </View>
        </View>

        <View className='form-actions'>
          <Button className='submit-btn' onClick={handleSubmit}>
            <Text className='btn-text'>提交询价</Text>
          </Button>
          <Text className='privacy-tip'>
            提交后，供应商将尽快与您联系
          </Text>
        </View>
      </View>
    </View>
  )
}
