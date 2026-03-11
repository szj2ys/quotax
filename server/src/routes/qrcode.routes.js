/**
 * QRCode Routes
 * 小程序码路由
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/qrcode/quotation
 * @desc    生成报价单小程序码
 * @access  Private
 */
router.post('/quotation', auth, async (req, res) => {
  try {
    const { scene } = req.body;

    // 构建场景参数
    const sceneParam = scene || `userId=${req.user.userId}`;

    // 模拟生成小程序码（实际应调用微信接口）
    // const wxRes = await axios.post('https://api.weixin.qq.com/wxa/getwxacodeunlimit', {
    //   scene: sceneParam,
    //   page: 'pages/quotation/share/index'
    // });

    // 临时返回模拟的二维码URL
    // 实际项目中应保存微信返回的图片二进制数据并生成URL
    const mockQrCodeUrl = `data:image/svg+xml;base64,${generateMockQRCode(sceneParam)}`;

    res.json({
      code: 200,
      message: '生成成功',
      data: {
        qrCodeUrl: mockQrCodeUrl,
        scene: sceneParam,
        // 小程序码有效期（微信接口返回的通常是永久有效）
        expiresIn: 0 // 永久有效
      }
    });
  } catch (error) {
    console.error('生成小程序码失败:', error);
    res.status(500).json({
      code: 500,
      message: '生成失败',
      data: error.message
    });
  }
});

/**
 * 生成模拟的二维码（SVG格式）
 * 实际项目中应使用微信接口
 */
function generateMockQRCode(scene) {
  // 生成简单的SVG二维码模拟图
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="white"/>
    <rect x="10" y="10" width="60" height="60" fill="black"/>
    <rect x="130" y="10" width="60" height="60" fill="black"/>
    <rect x="10" y="130" width="60" height="60" fill="black"/>
    <rect x="20" y="20" width="40" height="40" fill="white"/>
    <rect x="140" y="20" width="40" height="40" fill="white"/>
    <rect x="20" y="140" width="40" height="40" fill="white"/>
    <rect x="30" y="30" width="20" height="20" fill="black"/>
    <rect x="150" y="30" width="20" height="20" fill="black"/>
    <rect x="30" y="150" width="20" height="20" fill="black"/>
    ${generateRandomQRPattern()}
    <text x="100" y="100" text-anchor="middle" font-size="12" fill="#1890ff">QuotaX</text>
  </svg>`;

  return Buffer.from(svg).toString('base64');
}

/**
 * 生成随机二维码图案
 */
function generateRandomQRPattern() {
  let pattern = '';
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random() * 120) + 80;
    const y = Math.floor(Math.random() * 120) + 80;
    const size = Math.floor(Math.random() * 10) + 5;
    if (x < 180 && y < 180) {
      pattern += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="black"/>`;
    }
  }
  return pattern;
}

module.exports = router;
