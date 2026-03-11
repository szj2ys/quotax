import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

// 公共页面白名单 - 不需要登录即可访问
const PUBLIC_PAGES = [
  'pages/quotation/share/index',
  'pages/quotation/product/index'
]

class App extends Component {
  componentDidMount() {
    // 检查登录状态
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    const token = Taro.getStorageSync('token')
    const currentPath = this.getCurrentPagePath()

    // 如果是公共页面，不需要检查登录
    if (PUBLIC_PAGES.some(page => currentPath.includes(page))) {
      return
    }

    if (!token) {
      console.log('用户未登录')
    }
  }

  getCurrentPagePath(): string {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      return pages[pages.length - 1].route || ''
    }
    return ''
  }

  render() {
    return this.props.children
  }
}

export default App
