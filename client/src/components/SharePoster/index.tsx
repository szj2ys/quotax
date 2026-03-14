import { useState, useEffect, useRef } from 'react'
import { View, Text, Image, Canvas, Button } from '@tarojs/components'
import Taro, { showLoading, hideLoading, showToast, saveImageToPhotosAlbum, getSystemInfoSync } from '@tarojs/taro'
import './index.scss'

interface SharePosterProps {
  visible: boolean
  product: {
    _id: string
    name: string
    price: number
    unit: string
    images: string[]
    description?: string
  }
  userInfo: {
    companyName?: string
    contactName?: string
  }
  qrCodeUrl: string
  onClose: () => void
}

export default function SharePoster({ visible, product, userInfo, qrCodeUrl, onClose }: SharePosterProps) {
  const [posterUrl, setPosterUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<any>(null)

  useEffect(() => {
    if (visible && product && qrCodeUrl) {
      generatePoster()
    }
  }, [visible, product, qrCodeUrl])

  const generatePoster = async () => {
    if (!product || !qrCodeUrl) return

    setIsGenerating(true)
    showLoading({ title: '生成海报中...' })

    try {
      const systemInfo = getSystemInfoSync()
      const pixelRatio = systemInfo.pixelRatio || 2

      // Canvas dimensions - 9:16 ratio for mobile
      const canvasWidth = 375
      const canvasHeight = 667

      const ctx = Taro.createCanvasContext('sharePosterCanvas')

      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Draw product image
      const imageY = 60
      const imageHeight = 280
      if (product.images && product.images[0]) {
        ctx.drawImage(product.images[0], 40, imageY, 295, imageHeight)
      }

      // Draw gradient overlay at bottom of image
      const gradient = ctx.createLinearGradient(0, imageY + imageHeight - 60, 0, imageY + imageHeight)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(1, 'rgba(255,255,255,1)')
      ctx.fillStyle = gradient
      ctx.fillRect(40, imageY + imageHeight - 60, 295, 60)

      // Draw product name
      ctx.fillStyle = '#262626'
      ctx.font = 'bold 20px sans-serif'
      const nameY = imageY + imageHeight + 30
      ctx.fillText(product.name.substring(0, 20), 40, nameY)
      if (product.name.length > 20) {
        ctx.fillText(product.name.substring(20, 40) + (product.name.length > 40 ? '...' : ''), 40, nameY + 26)
      }

      // Draw price
      ctx.fillStyle = '#f5222d'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText(`¥${product.price.toFixed(2)}`, 40, nameY + 60)

      ctx.fillStyle = '#8c8c8c'
      ctx.font = '14px sans-serif'
      ctx.fillText(`/${product.unit}`, 40 + ctx.measureText(`¥${product.price.toFixed(2)}`).width + 5, nameY + 60)

      // Draw divider line
      ctx.strokeStyle = '#e8e8e8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, nameY + 85)
      ctx.lineTo(335, nameY + 85)
      ctx.stroke()

      // Draw company info
      ctx.fillStyle = '#595959'
      ctx.font = '14px sans-serif'
      ctx.fillText(userInfo.companyName || '优质供应商', 40, nameY + 110)
      ctx.fillText(`联系人: ${userInfo.contactName || '待定'}`, 40, nameY + 135)

      // Draw QR code section
      const qrY = nameY + 160
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(40, qrY, 295, 120)

      // Draw QR code
      ctx.drawImage(qrCodeUrl, 200, qrY + 10, 100, 100)

      // Draw scan hint text
      ctx.fillStyle = '#8c8c8c'
      ctx.font = '12px sans-serif'
      ctx.fillText('长按识别二维码', 60, qrY + 50)
      ctx.fillText('查看产品详情', 60, qrY + 70)

      // Draw brand watermark
      ctx.fillStyle = '#d9d9d9'
      ctx.font = '12px sans-serif'
      ctx.fillText('QuotaX B2B报价工具', canvasWidth / 2 - 60, canvasHeight - 30)

      // Render canvas
      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: 'sharePosterCanvas',
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth * pixelRatio,
          destHeight: canvasHeight * pixelRatio,
          success: (res) => {
            setPosterUrl(res.tempFilePath)
            hideLoading()
            setIsGenerating(false)
          },
          fail: (err) => {
            console.error('生成海报失败:', err)
            showToast({ title: '生成海报失败', icon: 'none' })
            hideLoading()
            setIsGenerating(false)
          }
        })
      })
    } catch (error) {
      console.error('生成海报失败:', error)
      showToast({ title: '生成海报失败', icon: 'none' })
      hideLoading()
      setIsGenerating(false)
    }
  }

  const handleSavePoster = async () => {
    if (!posterUrl) return

    try {
      await saveImageToPhotosAlbum({ filePath: posterUrl })
      showToast({ title: '已保存到相册', icon: 'success' })
    } catch (error) {
      console.error('保存海报失败:', error)
      showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleShare = () => {
    // Share functionality handled by Taro's native share
    showToast({ title: '请点击右上角分享', icon: 'none' })
  }

  if (!visible) return null

  return (
    <View className='share-poster-modal'>
      <View className='modal-overlay' onClick={onClose} />
      <View className='modal-content'>
        <View className='poster-header'>
          <Text className='poster-title'>分享海报</Text>
          <Text className='close-btn' onClick={onClose}>✕</Text>
        </View>

        <View className='poster-canvas-wrapper'>
          {isGenerating ? (
            <View className='generating-state'>
              <Text className='generating-text'>生成中...</Text>
            </View>
          ) : (
            <>
              <Canvas
                ref={canvasRef}
                canvasId='sharePosterCanvas'
                className='poster-canvas'
                style={{ width: '375px', height: '667px' }}
              />
              {posterUrl && (
                <Image
                  className='poster-preview'
                  src={posterUrl}
                  mode='widthFix'
                />
              )}
            </>
          )}
        </View>

        <View className='poster-actions'>
          <Button className='action-btn save-btn' onClick={handleSavePoster}>
            <Text className='btn-icon'>💾</Text>
            <Text className='btn-text'>保存海报</Text>
          </Button>
          <Button className='action-btn share-btn' onClick={handleShare}>
            <Text className='btn-icon'>📤</Text>
            <Text className='btn-text'>分享给好友</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
