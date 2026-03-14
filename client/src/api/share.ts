import { get, post, put } from './request'

// 记录分享
export function recordShare(productId: string, shareType: 'wechat' | 'timeline' | 'poster') {
  return post('/shares', { productId, shareType })
}

// 获取分享统计
export function getShareStats(startDate?: string, endDate?: string) {
  return get('/shares/stats', { startDate, endDate })
}

// 获取分享访客列表
export function getShareVisitors(page = 1, limit = 20) {
  return get('/shares/visitors', { page, limit })
}
