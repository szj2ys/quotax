import { Component } from 'react'
import { View, Image, Text } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import './index.scss'

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  unit: string
  specs?: { name: string; value: string }[]
  onAddToCart?: (id: string) => void
  onFavorite?: (id: string) => void
  isFavorite?: boolean
}

export default class ProductCard extends Component<ProductCardProps> {
  handleClick = () => {
    navigateTo({ url: `/pages/product/detail/index?id=${this.props.id}` })
  }

  handleAddToCart = (e: any) => {
    e.stopPropagation()
    this.props.onAddToCart?.(this.props.id)
  }

  handleFavorite = (e: any) => {
    e.stopPropagation()
    this.props.onFavorite?.(this.props.id)
  }

  formatPrice(price: number) {
    return price.toFixed(2)
  }

  render() {
    const { name, image, price, unit, specs = [], isFavorite } = this.props

    return (
      <View className='product-card' onClick={this.handleClick}>
        <View className='product-image-wrapper'>
          <Image
            className='product-image'
            src={image || 'https://via.placeholder.com/300x300?text=No+Image'}
            mode='aspectFill'
          />
          <View
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={this.handleFavorite}
          >
            <Text className='icon'>{isFavorite ? '❤' : '♡'}</Text>
          </View>
        </View>
        <View className='product-info'>
          <Text className='product-name'>{name}</Text>
          {specs.length > 0 && (
            <View className='product-specs'>
              {specs.slice(0, 2).map((spec, index) => (
                <Text key={index} className='spec-tag'>
                  {spec.name}:{spec.value}
                </Text>
              ))}
            </View>
          )}
          <View className='product-footer'>
            <View className='price-wrapper'>
              <Text className='price-symbol'>¥</Text>
              <Text className='price-value'>{this.formatPrice(price)}</Text>
              <Text className='price-unit'>/{unit}</Text>
            </View>
            <View className='cart-btn' onClick={this.handleAddToCart}>
              <Text className='cart-icon'>+</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
