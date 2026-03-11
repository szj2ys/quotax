import { View, Text, Button } from '@tarojs/components'
import { showLoading, hideLoading, showToast, switchTab, getUserProfile, login } from '@tarojs/taro'
import { setToken, setUserInfo } from '@/utils/auth'
import { login as loginApi } from '@/api/auth'
import './index.scss'

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      showLoading({ title: '登录中...', mask: true })

      // 1. 调用微信登录获取 code
      const loginRes = await login()
      const code = loginRes.code

      if (!code) {
        throw new Error('获取微信登录凭证失败')
      }

      // 2. 获取用户信息
      let userProfile = null
      try {
        const profileRes = await getUserProfile({
          desc: '用于完善用户资料'
        })
        userProfile = profileRes.userInfo
      } catch (error) {
        // 用户拒绝授权，继续登录但不传用户信息
        console.log('用户拒绝获取用户信息')
      }

      // 3. 调用后端登录 API
      const loginData = await loginApi(
        code,
        userProfile
          ? {
              nickName: userProfile.nickName,
              avatarUrl: userProfile.avatarUrl
            }
          : undefined
      )

      // 4. 存储 token 和用户信息
      setToken(loginData.token)
      setUserInfo(loginData.user)

      hideLoading()
      showToast({ title: '登录成功', icon: 'success' })

      // 5. 登录成功后跳转到首页
      setTimeout(() => {
        switchTab({ url: '/pages/index/index' })
      }, 1000)
    } catch (error: any) {
      hideLoading()
      console.error('登录失败:', error)
      showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
    }
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
          <Button
            className='login-btn'
            type='primary'
            onClick={handleLogin}
            openType='getUserInfo'
          >
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
