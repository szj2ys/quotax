import { get, post, put } from './request'

// 提交留资
export function submitLead(data: {
  productId: string
  productName: string
  name: string
  company: string
  phone: string
  message: string
}) {
  return post('/leads', data)
}

// 获取线索列表
export function getLeads(status?: string) {
  return get<{ list: any[] }>('/leads', { status })
}

// 更新线索状态
export function updateLeadStatus(leadId: string, status: string) {
  return put(`/leads/${leadId}/status`, { status })
}
