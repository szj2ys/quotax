import { View, Text } from '@tarojs/components'
import './index.scss'

export default function CartPage() {
  return (
    <View className='cart-page'>
      <View className='empty-cart'>
        <Text className='empty-icon'>🛒</Text>
        <Text className='empty-text'>购物车空空如也</Text>
        <Text className='empty-hint'>快去选购产品吧</Text>
      </View>
    </View>
  )
}
