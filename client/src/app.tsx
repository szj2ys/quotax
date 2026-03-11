import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

class App extends Component {
  componentDidMount() {
    // 检查登录状态（公开页面不需要登录）
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    // 公开页面路径，无需登录
    const _publicPages = [
      'pages/quotation/share/index',
      'pages/quotation/product/index'
    ]

    const token = Taro.getStorageSync('token')
    if (!token) {
      console.log('用户未登录')
      // 当前是公开页面时不跳转
    }
  }

  render() {
    return this.props.children
  }
}

export default App
