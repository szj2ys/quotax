import { post } from './request'

// 生成报价单小程序码
export const generateQRCode = () => {
  return post<{ qrCodeUrl: string }>('/qrcode/quotation')
}
