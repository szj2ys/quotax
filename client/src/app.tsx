import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

class App extends Component {
  componentDidMount() {
    // 检查登录状态
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    const token = Taro.getStorageSync('token')
    if (!token) {
      console.log('用户未登录')
    }
  }

  render() {
    return this.props.children
  }
}

export default App
