import Taro from '@tarojs/taro'

// 显示加载
export const showLoading = (title = '加载中...') => {
  Taro.showLoading({ title, mask: true })
}

// 隐藏加载
export const hideLoading = () => {
  Taro.hideLoading()
}

// 显示成功提示
export const showSuccess = (title: string) => {
  Taro.showToast({ title, icon: 'success', duration: 2000 })
}

// 显示错误提示
export const showError = (title: string) => {
  Taro.showToast({ title, icon: 'error', duration: 2000 })
}

// 显示普通提示
export const showToast = (title: string, duration = 2000) => {
  Taro.showToast({ title, icon: 'none', duration })
}

// 显示确认弹窗
export const showConfirm = (options: {
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title: options.title || '提示',
      content: options.content,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 格式化价格
export const formatPrice = (price: number): string => {
  return price.toFixed(2)
}

// 格式化日期
export const formatDate = (dateStr: string, format = 'YYYY-MM-DD'): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}
