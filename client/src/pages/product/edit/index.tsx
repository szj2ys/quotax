import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Picker, Switch } from '@tarojs/components'
import Taro, { navigateBack, showToast, showLoading, hideLoading } from '@tarojs/taro'
import ImageUploader from '@/components/ImageUploader'
import { updateProduct, getCategoryList, getProductDetail } from '@/api'
import type { ProductSpec } from '@/types'
import './index.scss'

interface FormData {
  name: string
  images: string[]
  categoryId: string
  price: string
  priceType: 'retail' | 'wholesale' | 'agent'
  unit: string
  specs: ProductSpec[]
  description: string
  stock: string
  status: 'on' | 'off'
}

interface Category {
  id: string
  name: string
}

export default function ProductEdit() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [priceTypeIndex, setPriceTypeIndex] = useState(1)
  const [productId, setProductId] = useState('')
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    images: [],
    categoryId: '',
    price: '',
    priceType: 'wholesale',
    unit: '件',
    specs: [],
    description: '',
    stock: '0',
    status: 'on'
  })

  const priceTypes = [
    { label: '零售价', value: 'retail' },
    { label: '批发价', value: 'wholesale' },
    { label: '代理价', value: 'agent' }
  ]

  // 获取URL参数和产品数据
  useEffect(() => {
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1]
    const options = (current as any).options || {}
    const id = options.id

    if (id) {
      setProductId(id)
      initData(id)
    } else {
      showToast({ title: '产品ID不存在', icon: 'error' })
      navigateBack()
    }
  }, [])

  const initData = async (id: string) => {
    try {
      showLoading({ title: '加载中...' })

      // 同时获取分类和产品详情
      const [categoryRes, product] = await Promise.all([
        getCategoryList(),
        getProductDetail(id)
      ])

      setCategories(categoryRes.list)

      // 设置表单数据
      setFormData({
        name: product.name,
        images: product.images || [],
        categoryId: product.categoryId,
        price: product.price.toString(),
        priceType: product.priceType,
        unit: product.unit,
        specs: product.specs || [],
        description: product.description || '',
        stock: product.stock.toString(),
        status: product.status
      })

      // 设置分类索引
      const catIndex = categoryRes.list.findIndex(c => c.id === product.categoryId)
      if (catIndex >= 0) {
        setCategoryIndex(catIndex)
      }

      // 设置价格类型索引
      const ptIndex = priceTypes.findIndex(p => p.value === product.priceType)
      if (ptIndex >= 0) {
        setPriceTypeIndex(ptIndex)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      showToast({ title: '获取产品信息失败', icon: 'error' })
    } finally {
      hideLoading()
      setLoading(false)
    }
  }

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    setCategoryIndex(index)
    setFormData(prev => ({
      ...prev,
      categoryId: categories[index]?.id || ''
    }))
  }

  const handlePriceTypeChange = (e: any) => {
    const index = e.detail.value
    setPriceTypeIndex(index)
    setFormData(prev => ({
      ...prev,
      priceType: priceTypes[index].value as 'retail' | 'wholesale' | 'agent'
    }))
  }

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }))
  }

  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { name: '', value: '' }]
    }))
  }

  const removeSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }))
  }

  const updateSpec = (index: number, key: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.map((spec, i) =>
        i === index ? { ...spec, [key]: value } : spec
      )
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast({ title: '请输入产品名称', icon: 'none' })
      return false
    }
    if (!formData.categoryId) {
      showToast({ title: '请选择产品分类', icon: 'none' })
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showToast({ title: '请输入有效的产品价格', icon: 'none' })
      return false
    }
    if (!formData.unit.trim()) {
      showToast({ title: '请输入产品单位', icon: 'none' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      showLoading({ title: '保存中...' })

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        specs: formData.specs.filter(spec => spec.name.trim() && spec.value.trim())
      }

      await updateProduct(productId, submitData)
      showToast({ title: '修改成功', icon: 'success' })

      setTimeout(() => {
        navigateBack()
      }, 1000)
    } catch (error) {
      console.error('更新产品失败:', error)
      showToast({ title: '修改失败', icon: 'error' })
    } finally {
      hideLoading()
    }
  }

  if (loading) {
    return (
      <View className='product-edit-page'>
        <View className='loading-wrapper'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='product-edit-page'>
      <View className='form-section'>
        {/* 产品名称 */}
        <View className='form-item required'>
          <Text className='label'>产品名称</Text>
          <Input
            className='input'
            placeholder='请输入产品名称'
            value={formData.name}
            onInput={(e) => setFormData(prev => ({ ...prev, name: e.detail.value }))}
          />
        </View>

        {/* 产品图片 */}
        <View className='form-item'>
          <Text className='label'>产品图片</Text>
          <ImageUploader
            value={formData.images}
            onChange={handleImagesChange}
            maxCount={5}
          />
        </View>

        {/* 产品分类 */}
        <View className='form-item required'>
          <Text className='label'>产品分类</Text>
          <Picker
            mode='selector'
            range={categories}
            rangeKey='name'
            value={categoryIndex}
            onChange={handleCategoryChange}
          >
            <View className='picker-value'>
              {formData.categoryId ? (
                <Text className='picker-text'>
                  {categories.find(c => c.id === formData.categoryId)?.name}
                </Text>
              ) : (
                <Text className='picker-placeholder'>请选择分类</Text>
              )}
              <Text className='picker-arrow'>></Text>
            </View>
          </Picker>
        </View>

        {/* 产品价格 */}
        <View className='form-item required'>
          <Text className='label'>产品价格</Text>
          <View className='price-row'>
            <Text className='price-symbol'>¥</Text>
            <Input
              className='input price-input'
              type='digit'
              placeholder='请输入价格'
              value={formData.price}
              onInput={(e) => setFormData(prev => ({ ...prev, price: e.detail.value }))}
            />
          </View>
        </View>

        {/* 价格类型 */}
        <View className='form-item required'>
          <Text className='label'>价格类型</Text>
          <Picker
            mode='selector'
            range={priceTypes}
            rangeKey='label'
            value={priceTypeIndex}
            onChange={handlePriceTypeChange}
          >
            <View className='picker-value'>
              <Text className='picker-text'>{priceTypes[priceTypeIndex]?.label}</Text>
              <Text className='picker-arrow'>></Text>
            </View>
          </Picker>
        </View>

        {/* 产品单位 */}
        <View className='form-item required'>
          <Text className='label'>产品单位</Text>
          <Input
            className='input'
            placeholder='如：件、个、箱'
            value={formData.unit}
            onInput={(e) => setFormData(prev => ({ ...prev, unit: e.detail.value }))}
          />
        </View>

        {/* 库存数量 */}
        <View className='form-item'>
          <Text className='label'>库存数量</Text>
          <Input
            className='input'
            type='number'
            placeholder='请输入库存数量'
            value={formData.stock}
            onInput={(e) => setFormData(prev => ({ ...prev, stock: e.detail.value }))}
          />
        </View>

        {/* 规格参数 */}
        <View className='form-item'>
          <View className='spec-header'>
            <Text className='label'>规格参数</Text>
            <View className='add-spec-btn' onClick={addSpec}>
              <Text className='add-icon'>+</Text>
              <Text>添加规格</Text>
            </View>
          </View>
          {formData.specs.map((spec, index) => (
            <View key={index} className='spec-row'>
              <Input
                className='spec-input'
                placeholder='参数名'
                value={spec.name}
                onInput={(e) => updateSpec(index, 'name', e.detail.value)}
              />
              <Text className='spec-colon'>:</Text>
              <Input
                className='spec-input'
                placeholder='参数值'
                value={spec.value}
                onInput={(e) => updateSpec(index, 'value', e.detail.value)}
              />
              <Text className='remove-spec' onClick={() => removeSpec(index)}>删除</Text>
            </View>
          ))}
          {formData.specs.length === 0 && (
            <Text className='spec-tip'>点击上方按钮添加规格参数</Text>
          )}
        </View>

        {/* 产品描述 */}
        <View className='form-item'>
          <Text className='label'>产品描述</Text>
          <Textarea
            className='textarea'
            placeholder='请输入产品描述（可选）'
            value={formData.description}
            onInput={(e) => setFormData(prev => ({ ...prev, description: e.detail.value }))}
            maxlength={500}
          />
          <Text className='char-count'>{formData.description.length}/500</Text>
        </View>

        {/* 上架状态 */}
        <View className='form-item switch-item'>
          <Text className='label'>上架状态</Text>
          <Switch
            checked={formData.status === 'on'}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              status: e.detail.value ? 'on' : 'off'
            }))}
          />
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View className='submit-btn' onClick={handleSubmit}>
          <Text>保存修改</Text>
        </View>
      </View>
    </View>
  )
}
