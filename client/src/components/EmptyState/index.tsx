import { Component } from 'react'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'

type EmptyType = 'default' | 'product' | 'cart' | 'favorite' | 'search' | 'error' | 'network'

interface EmptyStateProps {
  type?: EmptyType
  icon?: string
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  showRetry?: boolean
  onRetry?: () => void
}

// 预定义的空状态配置
const emptyConfig: Record<EmptyType, { icon: string; title: string; description: string }> = {
  default: {
    icon: '📦',
    title: '暂无数据',
    description: '这里还没有内容哦'
  },
  product: {
    icon: '📦',
    title: '暂无产品',
    description: '还没有添加任何产品，快去添加吧'
  },
  cart: {
    icon: '🛒',
    title: '购物车空空如也',
    description: '快去选购心仪的产品吧'
  },
  favorite: {
    icon: '⭐',
    title: '暂无收藏',
    description: '收藏喜欢的产品，方便下次查看'
  },
  search: {
    icon: '🔍',
    title: '未找到结果',
    description: '换个关键词试试看'
  },
  error: {
    icon: '⚠️',
    title: '出错了',
    description: '系统繁忙，请稍后再试'
  },
  network: {
    icon: '📡',
    title: '网络连接失败',
    description: '请检查网络设置后重试'
  }
}

export default class EmptyState extends Component<EmptyStateProps> {
  static defaultProps = {
    type: 'default' as EmptyType,
    showRetry: false
  }

  render() {
    const { type = 'default', icon: customIcon, title: customTitle, description: customDescription, actionText, onAction, showRetry, onRetry } = this.props

    const config = emptyConfig[type]
    const icon = customIcon || config.icon
    const title = customTitle || config.title
    const description = customDescription || config.description

    return (
      <View className='empty-state'>
        <View className='empty-icon-wrapper'>
          <Text className='empty-icon'>{icon}</Text>
        </View>
        <Text className='empty-title'>{title}</Text>
        <Text className='empty-description'>{description}</Text>

        {/* 操作按钮 */}
        {actionText && onAction && (
          <View className='empty-action' onClick={onAction}>
            <Text className='empty-action-text'>{actionText}</Text>
          </View>
        )}

        {/* 重试按钮 */}
        {showRetry && onRetry && (
          <View className='empty-action empty-action-secondary' onClick={onRetry}>
            <Text className='empty-action-text'>🔄 重新加载</Text>
          </View>
        )}
      </View>
    )
  }
}
