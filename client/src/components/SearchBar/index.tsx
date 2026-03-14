import { useState, useEffect, useCallback } from 'react'
import { View, Input, Text, ScrollView } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import {
  getSearchHistory,
  getHotSearchKeywords,
  addSearchHistory,
  clearSearchHistory,
  removeSearchHistory,
  getSearchSuggestions as getHistorySuggestions
} from '@/utils/searchHistory'
import { getSearchSuggestions } from '@/services/search'
import './index.scss'

interface SearchBarProps {
  placeholder?: string
  initialValue?: string
  onSearch?: (keyword: string) => void
  showHotSearch?: boolean
  showHistory?: boolean
}

export default function SearchBar({
  placeholder = '搜索产品名称',
  initialValue = '',
  onSearch,
  showHotSearch = true,
  showHistory = true
}: SearchBarProps) {
  const [keyword, setKeyword] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [hotKeywords, setHotKeywords] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 加载搜索历史和热门搜索
  useEffect(() => {
    setHistory(getSearchHistory())
    setHotKeywords(getHotSearchKeywords())
  }, [])

  // 防抖获取搜索建议
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      // 先尝试从本地历史匹配
      const localSuggestions = getHistorySuggestions(keyword)
      setSuggestions(localSuggestions)

      // 然后再从后端获取建议（可选）
      try {
        setLoading(true)
        const serverSuggestions = await getSearchSuggestions(keyword)
        // 合并本地和服务端建议，去重
        const combined = [...new Set([...serverSuggestions, ...localSuggestions])]
        setSuggestions(combined.slice(0, 8))
      } catch (error) {
        // 静默失败，使用本地建议
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [keyword])

  const handleSearch = useCallback((searchKeyword: string) => {
    const trimmed = searchKeyword.trim()
    if (!trimmed) return

    addSearchHistory(trimmed)
    setHistory(getSearchHistory())

    if (onSearch) {
      onSearch(trimmed)
    } else {
      navigateTo({ url: `/pages/search/index?keyword=${encodeURIComponent(trimmed)}` })
    }

    setIsFocused(false)
  }, [onSearch])

  const handleInputChange = (e: any) => {
    setKeyword(e.detail.value)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
  }

  const handleInputBlur = () => {
    // 延迟关闭，让点击事件先触发
    setTimeout(() => {
      setIsFocused(false)
    }, 200)
  }

  const handleClear = () => {
    setKeyword('')
    setSuggestions([])
  }

  const handleHistoryClick = (item: string) => {
    setKeyword(item)
    handleSearch(item)
  }

  const handleHotClick = (item: string) => {
    setKeyword(item)
    handleSearch(item)
  }

  const handleSuggestionClick = (item: string) => {
    setKeyword(item)
    handleSearch(item)
  }

  const handleRemoveHistory = (e: any, item: string) => {
    e.stopPropagation()
    removeSearchHistory(item)
    setHistory(getSearchHistory())
  }

  const handleClearAllHistory = () => {
    clearSearchHistory()
    setHistory([])
  }

  const showDropdown = isFocused && (keyword.trim() ? suggestions.length > 0 : (showHistory && history.length > 0) || (showHotSearch && hotKeywords.length > 0))

  return (
    <View className={`search-bar ${isFocused ? 'focused' : ''}`}>
      <View className='search-input-wrapper'>
        <View className='search-icon'>
          <Text className='icon'>🔍</Text>
        </View>
        <Input
          className='search-input'
          type='text'
          value={keyword}
          placeholder={placeholder}
          onInput={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onConfirm={() => handleSearch(keyword)}
          confirmType='search'
        />
        {keyword && (
          <View className='clear-btn' onClick={handleClear}>
            <Text className='clear-icon'>×</Text>
          </View>
        )}
        <View className='search-btn' onClick={() => handleSearch(keyword)}>
          <Text className='search-btn-text'>搜索</Text>
        </View>
      </View>

      {/* 搜索建议下拉框 */}
      {showDropdown && (
        <View className='search-dropdown'>
          {/* 输入时的搜索建议 */}
          {keyword.trim() && suggestions.length > 0 && (
            <View className='dropdown-section suggestions-section'>
              <View className='section-title'>搜索建议</View>
              <View className='suggestions-list'>
                {suggestions.map((item, index) => (
                  <View
                    key={index}
                    className='suggestion-item'
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <Text className='suggestion-icon'>🔍</Text>
                    <Text className='suggestion-text'>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 搜索历史 */}
          {showHistory && !keyword.trim() && history.length > 0 && (
            <View className='dropdown-section history-section'>
              <View className='section-header'>
                <Text className='section-title'>搜索历史</Text>
                <Text className='clear-all-btn' onClick={handleClearAllHistory}>清空</Text>
              </View>
              <View className='history-list'>
                {history.map((item, index) => (
                  <View
                    key={index}
                    className='history-item'
                    onClick={() => handleHistoryClick(item)}
                  >
                    <Text className='history-icon'>⏱️</Text>
                    <Text className='history-text'>{item}</Text>
                    <View
                      className='history-delete'
                      onClick={(e) => handleRemoveHistory(e, item)}
                    >
                      <Text className='delete-icon'>×</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 热门搜索 */}
          {showHotSearch && !keyword.trim() && hotKeywords.length > 0 && (
            <View className='dropdown-section hot-section'>
              <View className='section-title'>热门搜索</View>
              <View className='hot-list'>
                {hotKeywords.map((item, index) => (
                  <View
                    key={index}
                    className={`hot-item hot-item-${index}`}
                    onClick={() => handleHotClick(item)}
                  >
                    <Text className='hot-rank'>{index + 1}</Text>
                    <Text className='hot-text'>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
