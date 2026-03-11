import { View, Text, Button } from '@tarojs/components'
import { navigateBack } from '@tarojs/taro'
import './index.scss'

export default function LoginPage() {
  const handleLogin = () => {
    // 登录逻辑稍后实现
    navigateBack()
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='logo'>🏢</Text>
        <Text className='title'>B2B报价工具</Text>
        <Text className='subtitle'>专业的产品报价管理解决方案</Text>
      </View>

      <View className='login-content'>
        <View className='login-card'>
          <Text className='card-title'>欢迎登录</Text>
          <Text className='card-desc'>使用微信一键登录，快速开始</Text>
          <Button className='login-btn' type='primary' onClick={handleLogin}>
            微信一键登录
          </Button>
        </View>
      </View>

      <View className='login-footer'>
        <Text className='footer-text'>登录即表示同意用户协议和隐私政策</Text>
      </View>
    </View>
  )
}
