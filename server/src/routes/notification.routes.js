/**
 * Notification Routes
 * 通知设置路由
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth.middleware');
const { triggerDigestNow } = require('../utils/digestCron');

/**
 * @route   GET /api/notifications/preferences
 * @desc    获取用户通知设置
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
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
        email: user.email,
        preferences: user.notificationPreferences || {
          daily: true,
          weekly: true,
          monthly: true,
          newLead: true
        }
      }
    });
  } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    更新用户通知设置
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { email, preferences } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    // 更新邮箱
    if (email !== undefined) {
      user.email = email.trim().toLowerCase();
    }

    // 更新通知偏好
    if (preferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...preferences
      };
    }

    await user.save();

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        email: user.email,
        preferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('更新通知设置失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    发送测试邮件
 * @access  Private
 */
router.post('/test', auth, async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    if (!user.email) {
      return res.status(400).json({
        code: 400,
        message: '请先设置邮箱地址',
        data: null
      });
    }

    // 发送测试日报
    const { sendDigestToUser } = require('../utils/digestService');
    const result = await sendDigestToUser(user, period);

    if (result.error) {
      return res.status(500).json({
        code: 500,
        message: '发送失败',
        data: result.error
      });
    }

    res.json({
      code: 200,
      message: '测试邮件已发送',
      data: { sent: result.sent, skipped: result.skipped }
    });
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/trigger
 * @desc    手动触发数据日报（仅管理员）
 * @access  Private/Admin
 */
router.post('/trigger', auth, async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '仅管理员可执行此操作',
        data: null
      });
    }

    const result = await triggerDigestNow(period);

    res.json({
      code: 200,
      message: '数据日报已触发',
      data: result
    });
  } catch (error) {
    console.error('触发数据日报失败:', error);
    res.status(500).json({
      code: 500,
      message: '触发失败',
      data: error.message
    });
  }
});

module.exports = router;
