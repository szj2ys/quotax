/**
 * Quotation Routes
 * 报价单路由（公开）
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @route   GET /api/quotations/:userId
 * @desc    获取用户报价单（公开，无需登录）
 * @access  Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { categoryId, keyword } = req.query;

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '供应商不存在',
        data: null
      });
    }

    // 获取分类列表
    const categories = await Category.find({ userId })
      .sort({ sort: 1 })
      .select('name');

    // 构建产品查询条件
    const productQuery = {
      userId,
      status: 'on'
    };

    if (categoryId) {
      productQuery.categoryId = categoryId;
    }

    if (keyword) {
      productQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 获取产品列表
    const products = await Product.find(productQuery)
      .populate('categoryId', 'name')
      .sort({ sort: 1, createdAt: -1 });

    res.json({
      code: 200,
      message: 'success',
      data: {
        company: {
          name: user.companyName || '未设置公司名',
          logo: user.companyLogo || '',
          contactName: user.contactName || '',
          contactPhone: user.contactPhone || ''
        },
        categories: categories.map(cat => ({
          id: cat._id,
          name: cat.name
        })),
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          images: p.images,
          price: p.price,
          priceType: p.priceType,
          specs: p.specs,
          unit: p.unit,
          categoryId: p.categoryId?._id,
          categoryName: p.categoryId?.name
        }))
      }
    });
  } catch (error) {
    console.error('获取报价单失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取报价单失败',
      data: error.message
    });
  }
});

module.exports = router;
