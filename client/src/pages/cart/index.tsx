import { View, Text } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import './index.scss'

export default function CartPage() {
  const handleGoShopping = () => {
    navigateTo({ url: '/pages/product/index' })
  }

  return (
    <View className='cart-page'>
      <View className='empty-cart'>
        <Text className='empty-icon'>🛒</Text>
        <Text className='empty-text'>购物车空空如也</Text>
        <Text className='empty-hint'>快去选购产品吧</Text>
        <View className='empty-action' onClick={handleGoShopping}>
          <Text className='action-text'>去选购</Text>
        </View>
      </View>
    </View>
  )
}
