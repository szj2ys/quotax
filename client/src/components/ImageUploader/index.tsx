import { useState, useCallback } from 'react'
import { View, Image, Text, Progress } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ImageUploaderProps {
  value?: string[]
  onChange?: (images: string[]) => void
  maxCount?: number
  maxSize?: number // 单位MB
  compress?: boolean // 是否压缩
  crop?: boolean // 是否支持裁剪（单张图片时）
  showProgress?: boolean // 是否显示上传进度
}

export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 5,
  maxSize = 5,
  compress = true,
  crop = false,
  showProgress = true
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cropImage, setCropImage] = useState('') // 裁剪中的图片
  const [tempFile, setTempFile] = useState('') // 临时文件路径

  // 压缩图片
  const compressImage = async (filePath: string): Promise<string> => {
    try {
      const res = await Taro.compressImage({
        src: filePath,
        quality: 80
      })
      return res.tempFilePath
    } catch (error) {
      console.error('压缩图片失败:', error)
      return filePath // 压缩失败返回原图
    }
  }

  // 获取图片信息（尺寸）
  const getImageInfo = async (filePath: string) => {
    try {
      return await Taro.getImageInfo({ src: filePath })
    } catch (error) {
      console.error('获取图片信息失败:', error)
      return null
    }
  }

  // 选择图片
  const chooseImage = useCallback(async () => {
    if (value.length >= maxCount) {
      Taro.showToast({ title: `最多上传${maxCount}张图片`, icon: 'none' })
      return
    }

    try {
      const res = await Taro.chooseImage({
        count: crop ? 1 : maxCount - value.length, // 裁剪模式一次只能选一张
        sizeType: compress ? ['compressed'] : ['original'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = res.tempFilePaths[0]
      setTempFile(tempFilePath)

      // 检查文件大小
      const fileInfo = await Taro.getFileInfo({ filePath: tempFilePath }) as { size: number }
      if (fileInfo.size > maxSize * 1024 * 1024) {
        Taro.showToast({ title: `图片大小不能超过${maxSize}MB`, icon: 'none' })
        return
      }

      // 如果需要裁剪且只选一张
      if (crop && res.tempFilePaths.length === 1) {
        setCropImage(tempFilePath)
        return
      }

      // 处理多张图片上传
      await processImages(res.tempFilePaths)

    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }, [value, maxCount, maxSize, compress, crop])

  // 处理图片上传
  const processImages = async (filePaths: string[]) => {
    setUploading(true)
    setUploadProgress(0)

    const uploadedUrls: string[] = []
    const total = filePaths.length

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]

      try {
        // 压缩图片
        let processedPath = filePath
        if (compress) {
          processedPath = await compressImage(filePath)
        }

        // 模拟上传进度
        const progress = Math.round(((i + 0.5) / total) * 100)
        setUploadProgress(progress)

        // 实际项目中应调用上传API
        // const uploadedUrl = await uploadImage(processedPath)
        // 临时使用处理后的路径
        await new Promise(resolve => setTimeout(resolve, 300))
        uploadedUrls.push(processedPath)

        // 更新进度
        const finalProgress = Math.round(((i + 1) / total) * 100)
        setUploadProgress(finalProgress)

      } catch (error) {
        console.error('处理图片失败:', error)
        Taro.showToast({ title: `第${i + 1}张图片处理失败`, icon: 'none' })
      }
    }

    // 合并已上传的图片
    const newImages = [...value, ...uploadedUrls]
    onChange?.(newImages.slice(0, maxCount))

    setUploading(false)
    setUploadProgress(0)
  }

  // 确认裁剪
  const handleCropConfirm = async () => {
    if (!cropImage) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // 压缩图片
      let processedPath = cropImage
      if (compress) {
        setUploadProgress(30)
        processedPath = await compressImage(cropImage)
      }

      // 模拟上传
      setUploadProgress(70)
      await new Promise(resolve => setTimeout(resolve, 300))
      setUploadProgress(100)

      const newImages = [...value, processedPath]
      onChange?.(newImages.slice(0, maxCount))

      Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      console.error('裁剪上传失败:', error)
      Taro.showToast({ title: '上传失败', icon: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setCropImage('')
      setTempFile('')
    }
  }

  // 取消裁剪
  const handleCropCancel = () => {
    setCropImage('')
    setTempFile('')
  }

  // 删除图片
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

  // 预览图片
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
              <>
                <Text className='upload-icon'>⏳</Text>
                {showProgress && (
                  <View className='progress-wrapper'>
                    <Progress
                      percent={uploadProgress}
                      strokeWidth={4}
                      activeColor='#1890ff'
                      backgroundColor='#e6e6e6'
                    />
                    <Text className='progress-text'>{uploadProgress}%</Text>
                  </View>
                )}
              </>
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
        最多上传{maxCount}张图片，单张不超过{maxSize}MB{compress ? '，已开启压缩' : ''}
      </Text>

      {/* 裁剪弹窗 */}
      {cropImage && (
        <View className='crop-modal' onClick={handleCropCancel}>
          <View className='crop-content' onClick={(e) => e.stopPropagation()}>
            <View className='crop-header'>
              <Text className='crop-cancel' onClick={handleCropCancel}>取消</Text>
              <Text className='crop-title'>裁剪图片</Text>
              <Text className='crop-confirm' onClick={handleCropConfirm}>确定</Text>
            </View>
            <View className='crop-wrapper'>
              <Image className='crop-image' src={cropImage} mode='aspectFit' />
              <View className='crop-hint'>
                <Text className='hint-text'>图片预览模式</Text>
              </View>
            </View>
            {uploading && showProgress && (
              <View className='crop-progress'>
                <Progress
                  percent={uploadProgress}
                  strokeWidth={6}
                  activeColor='#1890ff'
                  backgroundColor='#e6e6e6'
                  showInfo
                />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
