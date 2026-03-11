import { Component } from 'react'
import { View, Text, Image } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export default class EmptyState extends Component<EmptyStateProps> {
  static defaultProps = {
    title: '暂无数据',
    description: '这里还没有内容哦'
  }

  render() {
    const { icon, title, description, actionText, onAction } = this.props

    return (
      <View className='empty-state'>
        {icon ? (
          <Image className='empty-icon' src={icon} mode='aspectFit' />
        ) : (
          <View className='empty-icon-placeholder'>
            <Text className='empty-icon-text'>📦</Text>
          </View>
        )}
        <Text className='empty-title'>{title}</Text>
        <Text className='empty-description'>{description}</Text>
        {actionText && onAction && (
          <View className='empty-action' onClick={onAction}>
            <Text className='empty-action-text'>{actionText}</Text>
          </View>
        )}
      </View>
    )
  }
}
