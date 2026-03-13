import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import { showToast, showLoading, hideLoading, showActionSheet } from '@tarojs/taro'
import { exportPDF, exportExcel, ExportOptions } from '@/api/export'
import './index.scss'

interface ExportButtonProps {
  /** 用户ID */
  userId: string
  /** 产品数量（用于判断是否可导出） */
  productCount: number
  /** 导出选项 */
  options?: Omit<ExportOptions, 'format'>
  /** 按钮样式类型 */
  type?: 'primary' | 'secondary' | 'float'
  /** 自定义按钮文本 */
  buttonText?: string
}

export default function ExportButton({
  userId,
  productCount,
  options = {},
  type = 'primary',
  buttonText = '导出报价单'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  // 检查是否可以导出
  const canExport = useCallback(() => {
    if (!userId) {
      showToast({ title: '请先登录', icon: 'none' })
      return false
    }
    if (productCount === 0) {
      showToast({ title: '暂无产品可导出', icon: 'none' })
      return false
    }
    return true
  }, [userId, productCount])

  // 处理PDF导出
  const handleExportPDF = async () => {
    if (!canExport()) return
    if (isExporting) return

    setIsExporting(true)
    showLoading({ title: '生成PDF中...' })

    try {
      const res = await exportPDF(options)
      hideLoading()
      showToast({ title: 'PDF生成成功', icon: 'success' })

      // 复制下载链接到剪贴板
      const { setClipboardData } = require('@tarojs/taro')
      setClipboardData({
        data: res.url,
        success: () => {
          showToast({ title: '下载链接已复制', icon: 'success' })
        }
      })
    } catch (error) {
      hideLoading()
      console.error('PDF导出失败:', error)
      showToast({ title: '导出失败，请重试', icon: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // 处理Excel导出
  const handleExportExcel = async () => {
    if (!canExport()) return
    if (isExporting) return

    setIsExporting(true)
    showLoading({ title: '生成Excel中...' })

    try {
      const res = await exportExcel(options)
      hideLoading()
      showToast({ title: 'Excel生成成功', icon: 'success' })

      // 复制下载链接到剪贴板
      const { setClipboardData } = require('@tarojs/taro')
      setClipboardData({
        data: res.url,
        success: () => {
          showToast({ title: '下载链接已复制', icon: 'success' })
        }
      })
    } catch (error) {
      hideLoading()
      console.error('Excel导出失败:', error)
      showToast({ title: '导出失败，请重试', icon: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // 显示导出选项
  const showExportOptions = () => {
    if (!canExport()) return

    showActionSheet({
      itemList: ['导出为 PDF', '导出为 Excel', '查看导出历史'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            handleExportPDF()
            break
          case 1:
            handleExportExcel()
            break
          case 2:
            // 跳转到导出历史页面
            const { navigateTo } = require('@tarojs/taro')
            navigateTo({ url: '/pages/user/export-history/index' })
            break
        }
      }
    })
  }

  // 根据类型渲染不同样式的按钮
  const renderButton = () => {
    const isDisabled = !userId || productCount === 0

    switch (type) {
      case 'float':
        return (
          <View
            className={`export-float-btn ${isDisabled ? 'disabled' : ''} ${isExporting ? 'exporting' : ''}`}
            onClick={showExportOptions}
          >
            <Text className='float-btn-icon'>{isExporting ? '⏳' : '📋'}</Text>
            <Text className='float-btn-text'>
              {isExporting ? '导出中...' : buttonText}
            </Text>
          </View>
        )

      case 'secondary':
        return (
          <View
            className={`export-secondary-btn ${isDisabled ? 'disabled' : ''} ${isExporting ? 'exporting' : ''}`}
            onClick={showExportOptions}
          >
            <Text className='btn-icon'>{isExporting ? '⏳' : '📋'}</Text>
            <Text className='btn-label'>
              {isExporting ? '导出中...' : buttonText}
            </Text>
          </View>
        )

      case 'primary':
      default:
        return (
          <View
            className={`export-primary-btn ${isDisabled ? 'disabled' : ''} ${isExporting ? 'exporting' : ''}`}
            onClick={showExportOptions}
          >
            <Text className='btn-icon'>{isExporting ? '⏳' : '📋'}</Text>
            <Text className='btn-label'>
              {isExporting ? '导出中...' : buttonText}
            </Text>
          </View>
        )
    }
  }

  return (
    <View className='export-button-wrapper'>
      {renderButton()}
    </View>
  )
}
