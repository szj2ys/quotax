import { useState, useCallback } from 'react'
import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ImageUploaderProps {
  value?: string[]
  onChange?: (images: string[]) => void
  maxCount?: number
  maxSize?: number // 单位MB
}

export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 5,
  maxSize = 5
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const chooseImage = useCallback(async () => {
    if (value.length >= maxCount) {
      Taro.showToast({ title: `最多上传${maxCount}张图片`, icon: 'none' })
      return
    }

    try {
      const res = await Taro.chooseImage({
        count: maxCount - value.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      // 检查文件大小
      for (const tempFilePath of res.tempFilePaths) {
        const fileInfo = await Taro.getFileInfo({ filePath: tempFilePath }) as { size: number }
        if (fileInfo.size > maxSize * 1024 * 1024) {
          Taro.showToast({ title: `图片大小不能超过${maxSize}MB`, icon: 'none' })
          continue
        }
      }

      // 模拟上传（实际项目中应调用上传API）
      setUploading(true)

      // 这里模拟上传，实际应该调用上传接口
      // const uploadedUrls = await uploadImages(res.tempFilePaths)
      // 临时使用临时路径作为URL
      setTimeout(() => {
        const newImages = [...value, ...res.tempFilePaths]
        onChange?.(newImages)
        setUploading(false)
      }, 500)

    } catch (error) {
      console.error('选择图片失败:', error)
      setUploading(false)
    }
  }, [value, maxCount, maxSize, onChange])

  const removeImage = useCallback((index: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const newImages = value.filter((_, i) => i !== index)
          onChange?.(newImages)
        }
      }
    })
  }, [value, onChange])

  const previewImage = useCallback((current: string) => {
    Taro.previewImage({
      current,
      urls: value
    })
  }, [value])

  return (
    <View className='image-uploader'>
      <View className='image-list'>
        {value.map((image, index) => (
          <View key={index} className='image-item'>
            <Image
              className='image'
              src={image}
              mode='aspectFill'
              onClick={() => previewImage(image)}
            />
            <View
              className='delete-btn'
              onClick={(e) => {
                e.stopPropagation()
                removeImage(index)
              }}
            >
              <Text className='delete-icon'>×</Text>
            </View>
          </View>
        ))}

        {value.length < maxCount && (
          <View
            className={`upload-btn ${uploading ? 'uploading' : ''}`}
            onClick={chooseImage}
          >
            {uploading ? (
              <Text className='upload-text'>上传中...</Text>
            ) : (
              <>
                <Text className='upload-icon'>+</Text>
                <Text className='upload-text'>上传图片</Text>
              </>
            )}
          </View>
        )}
      </View>
      <Text className='upload-tip'>
        最多上传{maxCount}张图片，单张不超过{maxSize}MB
      </Text>
    </View>
  )
}
