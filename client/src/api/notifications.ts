import { request } from './request';

/**
 * 获取通知设置
 */
export function getNotificationPreferences() {
  return request({
    url: '/notifications/preferences',
    method: 'GET'
  });
}

/**
 * 更新通知设置
 */
export function updateNotificationPreferences(data: {
  email?: string;
  preferences?: {
    daily?: boolean;
    weekly?: boolean;
    monthly?: boolean;
    newLead?: boolean;
  };
}) {
  return request({
    url: '/notifications/preferences',
    method: 'PUT',
    data
  });
}

/**
 * 发送测试邮件
 */
export function sendTestEmail(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return request({
    url: '/notifications/test',
    method: 'POST',
    data: { period }
  });
}
