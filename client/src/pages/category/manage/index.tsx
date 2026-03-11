import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { usePullDownRefresh, stopPullDownRefresh, showToast, showModal, showLoading, hideLoading } from '@tarojs/taro'
import EmptyState from '@/components/EmptyState'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '@/api'
import type { Category } from '@/types'
import './index.scss'

export default function CategoryManage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getCategoryList()
      // 按sort排序
      const sortedList = res.list.sort((a: Category, b: Category) => a.sort - b.sort)
      setCategories(sortedList)
    } catch (error) {
      console.error('获取分类失败:', error)
      showToast({ title: '获取分类失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 初始化
  useEffect(() => {
    fetchCategories()
  }, [])

  // 下拉刷新
  usePullDownRefresh(async () => {
    await fetchCategories()
    stopPullDownRefresh()
  })

  // 开始编辑分类
  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  // 保存编辑
  const saveEdit = async (categoryId: string) => {
    if (!editingName.trim()) {
      showToast({ title: '分类名称不能为空', icon: 'none' })
      return
    }

    try {
      showLoading({ title: '保存中...' })
      await updateCategory(categoryId, { name: editingName.trim() })
      hideLoading()
      showToast({ title: '修改成功', icon: 'success' })
      setEditingId(null)
      setEditingName('')
      fetchCategories()
    } catch (error) {
      hideLoading()
      showToast({ title: '修改失败', icon: 'error' })
    }
  }

  // 删除分类
  const handleDelete = (category: Category) => {
    if (category.productCount > 0) {
      showModal({
        title: '无法删除',
        content: `该分类下有${category.productCount}个产品，请先移除产品后再删除分类。`,
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    showModal({
      title: '确认删除',
      content: `确定删除分类"${category.name}"吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading({ title: '删除中...' })
            await deleteCategory(category.id)
            hideLoading()
            showToast({ title: '删除成功', icon: 'success' })
            fetchCategories()
          } catch (error) {
            hideLoading()
            showToast({ title: '删除失败', icon: 'error' })
          }
        }
      }
    })
  }

  // 添加分类
  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    try {
      showLoading({ title: '添加中...' })
      await createCategory({
        name: newCategoryName.trim(),
        sort: categories.length
      })
      hideLoading()
      showToast({ title: '添加成功', icon: 'success' })
      setNewCategoryName('')
      setShowAddForm(false)
      fetchCategories()
    } catch (error) {
      hideLoading()
      showToast({ title: '添加失败', icon: 'error' })
    }
  }

  // 上移分类
  const moveUp = async (index: number) => {
    if (index <= 0) return

    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index - 1]
    newCategories[index - 1] = temp

    // 更新sort值
    const updatedCategories = newCategories.map((cat, i) => ({ ...cat, sort: i }))
    setCategories(updatedCategories)

    // 批量更新（实际项目中应该调用专门的排序API）
    try {
      await Promise.all(updatedCategories.map(cat =>
        updateCategory(cat.id, { sort: cat.sort })
      ))
    } catch (error) {
      console.error('更新排序失败:', error)
      fetchCategories()
    }
  }

  // 下移分类
  const moveDown = async (index: number) => {
    if (index >= categories.length - 1) return

    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index + 1]
    newCategories[index + 1] = temp

    const updatedCategories = newCategories.map((cat, i) => ({ ...cat, sort: i }))
    setCategories(updatedCategories)

    try {
      await Promise.all(updatedCategories.map(cat =>
        updateCategory(cat.id, { sort: cat.sort })
      ))
    } catch (error) {
      console.error('更新排序失败:', error)
      fetchCategories()
    }
  }

  return (
    <View className='category-manage-page'>
      {/* 添加表单 */}
      {showAddForm && (
        <View className='add-form'>
          <View className='form-header'>
            <Text className='form-title'>添加新分类</Text>
            <Text className='close-btn' onClick={() => setShowAddForm(false)}>✕</Text>
          </View>
          <View className='form-content'>
            <Input
              className='form-input'
              placeholder='请输入分类名称'
              value={newCategoryName}
              onInput={(e) => setNewCategoryName(e.detail.value)}
              focus={showAddForm}
            />
            <View className='form-actions'>
              <View className='cancel-btn' onClick={() => setShowAddForm(false)}>
                <Text>取消</Text>
              </View>
              <View className='confirm-btn' onClick={handleAdd}>
                <Text>确认添加</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 分类列表 */}
      <ScrollView className='category-list' scrollY enableFlex>
        {categories.length === 0 && !loading ? (
          <EmptyState
            title='暂无分类'
            description='还没有添加任何分类，点击下方按钮添加'
            actionText='添加分类'
            onAction={() => setShowAddForm(true)}
          />
        ) : (
          <>
            {categories.map((category, index) => (
              <View key={category.id} className='category-item'>
                <View className='category-info'>
                  {editingId === category.id ? (
                    <Input
                      className='edit-input'
                      value={editingName}
                      onInput={(e) => setEditingName(e.detail.value)}
                      focus={editingId === category.id}
                    />
                  ) : (
                    <>
                      <Text className='category-name'>{category.name}</Text>
                      <Text className='product-count'>{category.productCount}个产品</Text>
                    </>
                  )}
                </View>

                <View className='category-actions'>
                  {editingId === category.id ? (
                    <>
                      <View className='action-btn save' onClick={() => saveEdit(category.id)}>
                        <Text>保存</Text>
                      </View>
                      <View className='action-btn cancel' onClick={cancelEdit}>
                        <Text>取消</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* 排序按钮 */}
                      <View
                        className={`action-btn sort ${index === 0 ? 'disabled' : ''}`}
                        onClick={() => moveUp(index)}
                      >
                        <Text>↑</Text>
                      </View>
                      <View
                        className={`action-btn sort ${index === categories.length - 1 ? 'disabled' : ''}`}
                        onClick={() => moveDown(index)}
                      >
                        <Text>↓</Text>
                      </View>
                      <View className='action-btn edit' onClick={() => startEdit(category)}>
                        <Text>编辑</Text>
                      </View>
                      <View className='action-btn delete' onClick={() => handleDelete(category)}>
                        <Text>删除</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      <View className='bottom-bar'>
        <View className='add-btn' onClick={() => setShowAddForm(true)}>
          <Text className='add-icon'>+</Text>
          <Text className='add-text'>添加分类</Text>
        </View>
      </View>
    </View>
  )
}
