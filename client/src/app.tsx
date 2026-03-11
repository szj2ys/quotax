import { Component, PropsWithChildren } from 'react'
import { navigateTo, getCurrentPages } from '@tarojs/taro'
import { isLoggedIn } from '@/utils/auth'
import './app.scss'

class App extends Component<PropsWithChildren<any>> {
  componentDidMount() {
    // 检查登录状态（公开页面不需要登录）
    this.checkLoginStatus()
  }

  componentDidShow() {
    // 每次显示时检查登录状态
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    // 公开页面路径，无需登录
    const publicPages = [
      'pages/quotation/share/index',
      'pages/quotation/product/index',
      'pages/login/index'
    ]

    // 获取当前页面路径
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage ? currentPage.route : ''

    // 如果是公开页面，不需要检查登录状态
    if (publicPages.some(page => currentRoute?.includes(page))) {
      return
    }

    // 检查是否已登录
    if (!isLoggedIn()) {
      console.log('用户未登录，跳转登录页')
      // 未登录时跳转到登录页
      navigateTo({ url: '/pages/login/index' })
    }
  }

  render() {
    return this.props.children
  }
}

export default App
