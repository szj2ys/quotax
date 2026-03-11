/**
 * Auth Routes
 * 用户认证相关路由
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth.middleware');

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @route   POST /api/auth/login
 * @desc    微信登录
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少微信登录 code',
        data: null
      });
    }

    // 模拟微信登录（实际应调用微信接口）
    // const wxRes = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`);
    // const { openid, session_key } = wxRes.data;

    // 模拟 openid（实际应从微信接口获取）
    const openid = `mock_openid_${code}`;

    // 查找或创建用户
    let user = await User.findOne({ openid });

    if (!user) {
      // 创建新用户
      user = new User({
        openid,
        nickName: userInfo?.nickName || '微信用户',
        avatarUrl: userInfo?.avatarUrl || '',
        companyName: '',
        contactName: '',
        contactPhone: ''
      });
      await user.save();
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id, openid: user.openid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          openid: user.openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          companyName: user.companyName,
          contactName: user.contactName,
          contactPhone: user.contactPhone,
          companyLogo: user.companyLogo
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        id: user._id,
        openid: user.openid,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        companyName: user.companyName,
        contactName: user.contactName,
        contactPhone: user.contactPhone,
        companyLogo: user.companyLogo
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户信息
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { companyName, contactName, contactPhone, companyLogo } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    // 更新字段
    if (companyName !== undefined) user.companyName = companyName;
    if (contactName !== undefined) user.contactName = contactName;
    if (contactPhone !== undefined) user.contactPhone = contactPhone;
    if (companyLogo !== undefined) user.companyLogo = companyLogo;

    await user.save();

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        id: user._id,
        openid: user.openid,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        companyName: user.companyName,
        contactName: user.contactName,
        contactPhone: user.contactPhone,
        companyLogo: user.companyLogo
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败',
      data: error.message
    });
  }
});

module.exports = router;
