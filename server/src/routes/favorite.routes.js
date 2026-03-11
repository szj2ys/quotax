/**
 * Favorite Routes
 * 收藏夹路由
 */
const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/favorites
 * @desc    获取收藏列表
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const [favorites, total] = await Promise.all([
      Favorite.find({ userId: req.user.userId })
        .populate('productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Favorite.countDocuments({ userId: req.user.userId })
    ]);

    // 过滤掉已下架的产品
    const validFavorites = favorites.filter(fav =>
      fav.productId && fav.productId.status === 'on'
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: validFavorites.map(fav => ({
          productId: fav.productId?._id,
          productName: fav.productId?.name,
          productImage: fav.productId?.images?.[0] || '',
          price: fav.productId?.price,
          unit: fav.productId?.unit,
          createdAt: fav.createdAt
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取收藏列表失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/favorites
 * @desc    添加收藏
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        code: 400,
        message: '缺少产品ID',
        data: null
      });
    }

    // 验证产品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品不存在',
        data: null
      });
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      userId: req.user.userId,
      productId
    });

    if (existingFavorite) {
      return res.json({
        code: 200,
        message: '已收藏',
        data: { isFavorite: true }
      });
    }

    const favorite = new Favorite({
      userId: req.user.userId,
      productId
    });

    await favorite.save();

    res.json({
      code: 200,
      message: '收藏成功',
      data: { isFavorite: true }
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({
      code: 500,
      message: '收藏失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/favorites/:productId
 * @desc    取消收藏
 * @access  Private
 */
router.delete('/:productId', auth, async (req, res) => {
  try {
    await Favorite.deleteOne({
      userId: req.user.userId,
      productId: req.params.productId
    });

    res.json({
      code: 200,
      message: '取消收藏成功',
      data: { isFavorite: false }
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      code: 500,
      message: '取消收藏失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/favorites/check/:productId
 * @desc    检查是否已收藏
 * @access  Private
 */
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user.userId,
      productId: req.params.productId
    });

    res.json({
      code: 200,
      message: 'success',
      data: { isFavorite: !!favorite }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '检查失败',
      data: error.message
    });
  }
});

module.exports = router;
