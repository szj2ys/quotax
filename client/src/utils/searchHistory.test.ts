import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  getHotSearchKeywords,
  getSearchSuggestions
} from '@/utils/searchHistory'

import Taro from '@tarojs/taro'

describe('searchHistory', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    Taro.setStorageSync('searchHistory', [])
    jest.clearAllMocks()
  })

  describe('getSearchHistory', () => {
    it('should return empty array when no history exists', () => {
      Taro.setStorageSync('searchHistory', null)
      const result = getSearchHistory()
      expect(result).toEqual([])
    })

    it('should return stored search history', () => {
      const history = ['product1', 'product2', 'product3']
      Taro.setStorageSync('searchHistory', history)
      const result = getSearchHistory()
      expect(result).toEqual(history)
    })
  })

  describe('addSearchHistory', () => {
    it('should add new keyword to history', () => {
      addSearchHistory('new-product')
      const result = getSearchHistory()
      expect(result).toContain('new-product')
    })

    it('should move existing keyword to front of history', () => {
      Taro.setStorageSync('searchHistory', ['product1', 'product2'])
      addSearchHistory('product1')
      const result = getSearchHistory()
      expect(result[0]).toBe('product1')
    })

    it('should remove duplicate keywords', () => {
      Taro.setStorageSync('searchHistory', ['product1', 'product2', 'product1'])
      addSearchHistory('product1')
      const result = getSearchHistory()
      const product1Count = result.filter(item => item === 'product1').length
      expect(product1Count).toBe(1)
    })

    it('should not add empty keyword', () => {
      addSearchHistory('')
      const result = getSearchHistory()
      expect(result).toEqual([])
    })

    it('should not add whitespace-only keyword', () => {
      addSearchHistory('   ')
      const result = getSearchHistory()
      expect(result).toEqual([])
    })

    it('should trim keyword before adding', () => {
      addSearchHistory('  trimmed-product  ')
      const result = getSearchHistory()
      expect(result).toContain('trimmed-product')
      expect(result).not.toContain('  trimmed-product  ')
    })

    it('should limit history to 20 items', () => {
      // Add 25 items
      for (let i = 0; i < 25; i++) {
        addSearchHistory(`product-${i}`)
      }
      const result = getSearchHistory()
      expect(result.length).toBeLessThanOrEqual(20)
    })
  })

  describe('removeSearchHistory', () => {
    it('should remove specific keyword from history', () => {
      Taro.setStorageSync('searchHistory', ['product1', 'product2', 'product3'])
      removeSearchHistory('product2')
      const result = getSearchHistory()
      expect(result).not.toContain('product2')
      expect(result).toContain('product1')
      expect(result).toContain('product3')
    })

    it('should handle removing non-existent keyword', () => {
      Taro.setStorageSync('searchHistory', ['product1', 'product2'])
      removeSearchHistory('non-existent')
      const result = getSearchHistory()
      expect(result).toEqual(['product1', 'product2'])
    })
  })

  describe('clearSearchHistory', () => {
    it('should clear all search history', () => {
      Taro.setStorageSync('searchHistory', ['product1', 'product2', 'product3'])
      clearSearchHistory()
      const result = getSearchHistory()
      expect(result).toEqual([])
    })

    it('should handle clearing empty history', () => {
      Taro.setStorageSync('searchHistory', [])
      clearSearchHistory()
      const result = getSearchHistory()
      expect(result).toEqual([])
    })
  })

  describe('getHotSearchKeywords', () => {
    it('should return array of hot keywords', () => {
      const result = getHotSearchKeywords()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should contain expected keywords', () => {
      const result = getHotSearchKeywords()
      expect(result).toContain('热门产品')
      expect(result).toContain('新品上市')
      expect(result).toContain('爆款推荐')
    })
  })

  describe('getSearchSuggestions', () => {
    beforeEach(() => {
      Taro.setStorageSync('searchHistory', [
        'apple product',
        'apple watch',
        'banana',
        'apricot',
        'cherry',
        'blueberry'
      ])
    })

    it('should return empty array for empty prefix', () => {
      const result = getSearchSuggestions('')
      expect(result).toEqual([])
    })

    it('should return suggestions matching prefix', () => {
      const result = getSearchSuggestions('app')
      expect(result).toContain('apple product')
      expect(result).toContain('apple watch')
    })

    it('should be case insensitive', () => {
      const result = getSearchSuggestions('APPLE')
      expect(result).toContain('apple product')
      expect(result).toContain('apple watch')
    })

    it('should limit results to 5 items', () => {
      Taro.setStorageSync('searchHistory', [
        'apple 1', 'apple 2', 'apple 3', 'apple 4', 'apple 5', 'apple 6'
      ])
      const result = getSearchSuggestions('apple')
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should return empty array when no matches found', () => {
      const result = getSearchSuggestions('xyz')
      expect(result).toEqual([])
    })

    it('should handle whitespace-only prefix', () => {
      const result = getSearchSuggestions('   ')
      expect(result).toEqual([])
    })
  })
})
