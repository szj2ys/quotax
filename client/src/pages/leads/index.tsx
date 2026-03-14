import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { showLoading, hideLoading, showToast, usePullDownRefresh } from '@tarojs/taro'
import { getLeads, updateLeadStatus } from '@/api/leads'
import EmptyState from '@/components/EmptyState'
import './index.scss'

type LeadStatus = 'new' | 'contacted' | 'deal' | 'invalid'

interface Lead {
  _id: string
  name: string
  company: string
  phone: string
  message: string
  productName: string
  status: LeadStatus
  createdAt: string
}

const statusMap: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: '新线索', color: '#1890ff' },
  contacted: { label: '已联系', color: '#faad14' },
  deal: { label: '已成交', color: '#52c41a' },
  invalid: { label: '无效', color: '#8c8c8c' }
}

const statusFilters: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新线索' },
  { value: 'contacted', label: '已联系' },
  { value: 'deal', label: '已成交' },
  { value: 'invalid', label: '无效' }
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<LeadStatus | 'all'>('all')

  useEffect(() => {
    loadLeads()
  }, [activeFilter])

  usePullDownRefresh(() => {
    loadLeads()
  })

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await getLeads(activeFilter === 'all' ? undefined : activeFilter)
      setLeads(res.list || [])
    } catch (error) {
      console.error('加载线索失败:', error)
      showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus)
      showToast({ title: '状态更新成功', icon: 'success' })
      // Update local state
      setLeads(prev => prev.map(lead =>
        lead._id === leadId ? { ...lead, status: newStatus } : lead
      ))
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (leads.length === 0 && !loading) {
    return (
      <View className='leads-page'>
        <View className='filter-bar'>
          {statusFilters.map(filter => (
            <View
              key={filter.value}
              className={`filter-item ${activeFilter === filter.value ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.value)}
            >
              <Text className='filter-text'>{filter.label}</Text>
            </View>
          ))}
        </View>
        <EmptyState
          icon='📋'
          title='暂无线索'
          description='分享产品给客户，收集销售线索'
        />
      </View>
    )
  }

  return (
    <View className='leads-page'>
      <View className='filter-bar'>
        {statusFilters.map(filter => (
          <View
            key={filter.value}
            className={`filter-item ${activeFilter === filter.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.value)}
          >
            <Text className='filter-text'>{filter.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className='leads-list' scrollY refresherEnabled onRefresherRefresh={loadLeads}>
        {leads.map(lead => (
          <View key={lead._id} className='lead-card'>
            <View className='lead-header'>
              <View className='lead-status' style={{ backgroundColor: `${statusMap[lead.status].color}20` }}>
                <Text className='status-text' style={{ color: statusMap[lead.status].color }}>
                  {statusMap[lead.status].label}
                </Text>
              </View>
              <Text className='lead-time'>{formatDate(lead.createdAt)}</Text>
            </View>

            <View className='lead-content'>
              <View className='info-row'>
                <Text className='info-label'>询价人</Text>
                <Text className='info-value'>{lead.name}</Text>
              </View>
              {lead.company && (
                <View className='info-row'>
                  <Text className='info-label'>公司</Text>
                  <Text className='info-value'>{lead.company}</Text>
                </View>
              )}
              <View className='info-row'>
                <Text className='info-label'>电话</Text>
                <Text className='info-value phone' onClick={() => {
                  Taro.makePhoneCall({ phoneNumber: lead.phone })
                }}>{lead.phone}</Text>
              </View>
              <View className='info-row'>
                <Text className='info-label'>询价产品</Text>
                <Text className='info-value product'>{lead.productName}</Text>
              </View>
              {lead.message && (
                <View className='info-row message-row'>
                  <Text className='info-label'>留言</Text>
                  <Text className='info-value message'>{lead.message}</Text>
                </View>
              )}
            </View>

            <View className='lead-actions'>
              {lead.status !== 'contacted' && (
                <View
                  className='action-btn contacted'
                  onClick={() => handleStatusChange(lead._id, 'contacted')}
                >
                  <Text>标记已联系</Text>
                </View>
              )}
              {lead.status !== 'deal' && (
                <View
                  className='action-btn deal'
                  onClick={() => handleStatusChange(lead._id, 'deal')}
                >
                  <Text>标记成交</Text>
                </View>
              )}
              {lead.status !== 'invalid' && (
                <View
                  className='action-btn invalid'
                  onClick={() => handleStatusChange(lead._id, 'invalid')}
                >
                  <Text>标记无效</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
