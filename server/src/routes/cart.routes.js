/**
 * Cart Routes
 * 购物车路由
 */
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/cart
 * @desc    获取购物车
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId');

    if (!cart) {
      cart = new Cart({
        userId: req.user.userId,
        items: []
      });
      await cart.save();
    }

    // 过滤掉已下架的产品
    const validItems = cart.items.filter(item =>
      item.productId && item.productId.status === 'on'
    );

    // 如果有下架产品，更新购物车
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const totalCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = validItems.reduce((sum, item) =>
      sum + (item.productId?.price || 0) * item.quantity, 0
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        items: validItems.map(item => ({
          productId: item.productId?._id,
          productName: item.productId?.name,
          productImage: item.productId?.images?.[0] || '',
          price: item.productId?.price,
          quantity: item.quantity,
          specs: item.productId?.specs,
          unit: item.productId?.unit
        })),
        totalCount,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取购物车失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/cart/items
 * @desc    添加商品到购物车
 * @access  Private
 */
router.post('/items', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        code: 400,
        message: '缺少产品ID',
        data: null
      });
    }

    // 验证产品是否存在且上架
    const product = await Product.findById(productId);
    if (!product || product.status !== 'on') {
      return res.status(400).json({
        code: 400,
        message: '产品不存在或已下架',
        data: null
      });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({
        userId: req.user.userId,
        items: []
      });
    }

    // 查找是否已有该商品
    const existingItem = cart.items.find(item =>
      item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        quantity: parseInt(quantity)
      });
    }

    await cart.save();

    res.json({
      code: 200,
      message: '添加成功',
      data: null
    });
  } catch (error) {
    console.error('添加购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加购物车失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    更新购物车商品数量
 * @access  Private
 */
router.put('/items/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        code: 400,
        message: '数量无效',
        data: null
      });
    }

    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: '购物车不存在',
        data: null
      });
    }

    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === req.params.productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '商品不存在',
        data: null
      });
    }

    if (quantity === 0) {
      // 删除商品
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = parseInt(quantity);
    }

    await cart.save();

    res.json({
      code: 200,
      message: '更新成功',
      data: null
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新购物车失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    删除购物车商品
 * @access  Private
 */
router.delete('/items/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: '购物车不存在',
        data: null
      });
    }

    cart.items = cart.items.filter(item =>
      item.productId.toString() !== req.params.productId
    );

    await cart.save();

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除购物车商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/cart
 * @desc    清空购物车
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      code: 200,
      message: '清空成功',
      data: null
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '清空失败',
      data: error.message
    });
  }
});

module.exports = router;
