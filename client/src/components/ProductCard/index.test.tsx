import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '@/components/ProductCard'

// Mock Taro navigateTo
jest.mock('@tarojs/taro', () => ({
  navigateTo: jest.fn()
}))

import { navigateTo } from '@tarojs/taro'

describe('ProductCard', () => {
  const mockProps = {
    id: 'test-id-123',
    name: 'Test Product',
    image: 'https://example.com/image.jpg',
    price: 99.99,
    unit: 'piece',
    specs: [
      { name: 'Color', value: 'Red' },
      { name: 'Size', value: 'Large' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render product information correctly', () => {
    render(<ProductCard {...mockProps} />)

    expect(screen.getByText(mockProps.name)).toBeInTheDocument()
    expect(screen.getByText('¥')).toBeInTheDocument()
    expect(screen.getByText('99.99')).toBeInTheDocument()
    expect(screen.getByText('/piece')).toBeInTheDocument()
  }
  )

  it('should display product specs', () => {
    render(<ProductCard {...mockProps} />)

    expect(screen.getByText('Color:Red')).toBeInTheDocument()
    expect(screen.getByText('Size:Large')).toBeInTheDocument()
  })

  it('should format price correctly', () => {
    const propsWithIntPrice = { ...mockProps, price: 100 }
    render(<ProductCard {...propsWithIntPrice} />)

    expect(screen.getByText('100.00')).toBeInTheDocument()
  })

  it('should call onAddToCart when cart button is clicked', () => {
    const onAddToCart = jest.fn()
    render(<ProductCard {...mockProps} onAddToCart={onAddToCart} />)

    const cartButton = screen.getByText('+')
    fireEvent.click(cartButton)

    expect(onAddToCart).toHaveBeenCalledWith(mockProps.id)
  })

  it('should call onFavorite when favorite button is clicked', () => {
    const onFavorite = jest.fn()
    render(<ProductCard {...mockProps} onFavorite={onFavorite} isFavorite={false} />)

    const favoriteButton = screen.getByText('🤍')
    fireEvent.click(favoriteButton)

    expect(onFavorite).toHaveBeenCalledWith(mockProps.id)
  })

  it('should display favorite state correctly', () => {
    const { rerender } = render(<ProductCard {...mockProps} isFavorite={false} />)

    expect(screen.getByText('🤍')).toBeInTheDocument()

    rerender(<ProductCard {...mockProps} isFavorite={true} />)

    expect(screen.getByText('❤️')).toBeInTheDocument()
  })

  it('should navigate to product detail when clicked', () => {
    render(<ProductCard {...mockProps} />)

    const card = screen.getByText(mockProps.name).closest('.product-card') || screen.getByText(mockProps.name)
    fireEvent.click(card)

    expect(navigateTo).toHaveBeenCalledWith({
      url: `/pages/product/detail/index?id=${mockProps.id}`
    })
  })

  it('should render without specs', () => {
    const propsWithoutSpecs = { ...mockProps, specs: undefined }
    render(<ProductCard {...propsWithoutSpecs} />)

    expect(screen.getByText(mockProps.name)).toBeInTheDocument()
    expect(screen.queryByText('Color:Red')).not.toBeInTheDocument()
  })

  it('should render image placeholder when no image is provided', () => {
    const propsWithoutImage = { ...mockProps, image: '' }
    render(<ProductCard {...propsWithoutImage} />)

    expect(screen.getByText('暂无图片')).toBeInTheDocument()
    expect(screen.getByText('📷')).toBeInTheDocument()
  })
})
