/**
 * Lead Routes
 * 线索/留资路由
 */
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/leads
 * @desc    提交留资（访客）
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { productId, productName, name, company, phone, message } = req.body;

    // 验证必要字段
    if (!productId || !name || !phone) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确',
        data: null
      });
    }

    // 获取产品信息以找到供应商
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品不存在',
        data: null
      });
    }

    const lead = new Lead({
      supplierId: product.userId,
      productId,
      productName: productName || product.name,
      name,
      company: company || '',
      phone,
      message: message || '',
      status: 'new'
    });

    await lead.save();

    res.json({
      code: 200,
      message: '提交成功',
      data: { leadId: lead._id }
    });
  } catch (error) {
    console.error('提交留资失败:', error);
    res.status(500).json({
      code: 500,
      message: '提交失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/leads
 * @desc    获取线索列表（供应商）
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const leads = await Lead.findBySupplier(req.user.userId, status, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Lead.countDocuments({
      supplierId: req.user.userId,
      ...(status && status !== 'all' ? { status } : {})
    });

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: leads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取线索列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/leads/stats
 * @desc    获取线索统计（供应商）
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Lead.getStats(req.user.userId);

    res.json({
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('获取线索统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取统计失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/leads/:leadId/status
 * @desc    更新线索状态
 * @access  Private
 */
router.put('/:leadId/status', auth, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    if (!['new', 'contacted', 'deal', 'invalid'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值',
        data: null
      });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, supplierId: req.user.userId },
      { status },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({
        code: 404,
        message: '线索不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: lead
    });
  } catch (error) {
    console.error('更新线索状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败',
      data: error.message
    });
  }
});

module.exports = router;
