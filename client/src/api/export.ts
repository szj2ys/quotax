import { get, post } from './request'

// 导出历史记录类型
export interface ExportHistoryItem {
  id: string
  userId: string
  type: 'pdf' | 'excel'
  url: string
  createdAt: string
  expiresAt: string
}

// 导出选项
export interface ExportOptions {
  categoryId?: string
  keyword?: string
  format: 'pdf' | 'excel'
}

// 导出响应
export interface ExportResponse {
  url: string
  expiresAt: string
  filename: string
}

// 生成PDF
export const exportPDF = (options?: Omit<ExportOptions, 'format'>) => {
  return post<ExportResponse>('/export/pdf', options || {})
}

// 生成Excel
export const exportExcel = (options?: Omit<ExportOptions, 'format'>) => {
  return post<ExportResponse>('/export/excel', options || {})
}

// 获取导出历史
export const getExportHistory = (params?: { page?: number; pageSize?: number }) => {
  return get<{
    list: ExportHistoryItem[]
    total: number
    page: number
    pageSize: number
  }>('/export/history', params)
}

// 下载文件
export const downloadExportFile = (url: string, filename: string) => {
  return new Promise<void>((resolve, reject) => {
    const { downloadFile, saveFile, showToast } = require('@tarojs/taro')

    downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存文件到本地
          saveFile({
            tempFilePath: res.tempFilePath,
            success: () => {
              showToast({ title: '下载成功', icon: 'success' })
              resolve()
            },
            fail: (err) => {
              console.error('保存文件失败:', err)
              reject(err)
            }
          })
        } else {
          reject(new Error('下载失败'))
        }
      },
      fail: (err) => {
        console.error('下载文件失败:', err)
        reject(err)
      }
    })
  })
}
