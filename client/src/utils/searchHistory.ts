import Taro from '@tarojs/taro'

const SEARCH_HISTORY_KEY = 'searchHistory'
const MAX_HISTORY_ITEMS = 20

// 热门搜索关键词（模拟数据）
const HOT_SEARCH_KEYWORDS = [
  '热门产品',
  '新品上市',
  '爆款推荐',
  '促销商品',
  '限时优惠'
]

/**
 * 获取搜索历史
 * @returns 搜索历史数组
 */
export const getSearchHistory = (): string[] => {
  try {
    return Taro.getStorageSync(SEARCH_HISTORY_KEY) || []
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    return []
  }
}

/**
 * 添加搜索历史
 * @param keyword 搜索关键词
 */
export const addSearchHistory = (keyword: string): void => {
  if (!keyword || keyword.trim() === '') return

  const keywordTrimmed = keyword.trim()
  let history = getSearchHistory()

  // 移除重复项
  history = history.filter(item => item !== keywordTrimmed)

  // 添加到开头
  history.unshift(keywordTrimmed)

  // 限制数量
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS)
  }

  try {
    Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

/**
 * 删除指定搜索历史
 * @param keyword 要删除的关键词
 */
export const removeSearchHistory = (keyword: string): void => {
  let history = getSearchHistory()
  history = history.filter(item => item !== keyword)

  try {
    Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
  } catch (error) {
    console.error('删除搜索历史失败:', error)
  }
}

/**
 * 清空所有搜索历史
 */
export const clearSearchHistory = (): void => {
  try {
    Taro.removeStorageSync(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error('清空搜索历史失败:', error)
  }
}

/**
 * 获取热门搜索关键词
 * @returns 热门搜索数组
 */
export const getHotSearchKeywords = (): string[] => {
  // 可以后续从后端获取，目前使用静态数据
  return HOT_SEARCH_KEYWORDS
}

/**
 * 获取搜索建议（根据输入前缀匹配历史）
 * @param prefix 输入前缀
 * @returns 匹配的历史记录
 */
export const getSearchSuggestions = (prefix: string): string[] => {
  if (!prefix || prefix.trim() === '') return []

  const history = getSearchHistory()
  const prefixLower = prefix.toLowerCase()

  return history.filter(item =>
    item.toLowerCase().includes(prefixLower)
  ).slice(0, 5)
}
