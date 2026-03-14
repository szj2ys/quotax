/**
 * Share Routes
 * 分享相关路由
 */
const express = require('express');
const router = express.Router();
const Share = require('../models/Share');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/shares
 * @desc    记录分享行为
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { productId, shareType } = req.body;

    if (!productId || !shareType) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null
      });
    }

    const share = new Share({
      userId: req.user.userId,
      productId,
      shareType
    });

    await share.save();

    res.json({
      code: 200,
      message: '分享记录成功',
      data: { shareId: share._id }
    });
  } catch (error) {
    console.error('记录分享失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录分享失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/shares/stats
 * @desc    获取分享统计数据
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Share.getShareStats(req.user.userId, startDate, endDate);

    res.json({
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('获取分享统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取分享统计失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/shares/visitors
 * @desc    获取分享带来的访客列表
 * @access  Private
 */
router.get('/visitors', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const visitors = await Share.getShareVisitors(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      code: 200,
      message: 'success',
      data: visitors
    });
  } catch (error) {
    console.error('获取访客列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取访客列表失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/shares/:shareId/view
 * @desc    记录分享被查看
 * @access  Public (called by mini-program)
 */
router.put('/:shareId/view', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { viewerInfo } = req.body;

    await Share.findByIdAndUpdate(shareId, {
      viewedAt: new Date(),
      viewerInfo
    });

    res.json({
      code: 200,
      message: '记录查看成功',
      data: null
    });
  } catch (error) {
    console.error('记录查看失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录查看失败',
      data: error.message
    });
  }
});

module.exports = router;
