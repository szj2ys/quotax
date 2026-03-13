import { get, post } from './request'

/**
 * Analytics API
 * Tracking and dashboard data
 */

// Track a page view
export const trackView = (data: {
  userId: string
  visitorId: string
  page: string
  duration?: number
  scrollDepth?: number
  clickedProducts?: string[]
  source?: string
}) => {
  return post('/analytics/track', data, { showLoading: false })
}

// Track an event (click, scroll, duration)
export const trackEvent = (data: {
  userId: string
  visitorId: string
  eventType: 'product_click' | 'scroll' | 'duration'
  eventData: Record<string, any>
}) => {
  return post('/analytics/track-event', data, { showLoading: false })
}

// Get dashboard data (requires login)
export const getDashboardData = () => {
  return get<{
    summary: {
      today: { pv: number; uv: number }
      week: { pv: number; uv: number }
      month: { pv: number; uv: number }
      total: number
    }
    trend: Array<{
      date: string
      pv: number
      uv: number
    }>
    recentVisits: Array<{
      visitorId: string
      timestamp: string
      location: string
      duration: number
      scrollDepth: number
    }>
    popularProducts: Array<{
      productId: string
      clicks: number
      name: string
      image: string
    }>
  }>('/analytics/dashboard')
}

// Get summary data for user page
export const getAnalyticsSummary = () => {
  return get<{
    today: { pv: number; uv: number }
    week: { pv: number; uv: number }
    hasNewData: boolean
  }>('/analytics/summary')
}
