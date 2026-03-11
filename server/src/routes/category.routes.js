/**
 * Category Routes
 * 分类管理路由
 */
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/categories
 * @desc    获取分类列表（公开）
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const query = {};
    if (userId) {
      query.userId = userId;
    }

    const categories = await Category.find(query)
      .sort({ sort: 1, createdAt: -1 });

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: categories.map(cat => ({
          id: cat._id,
          name: cat.name,
          sort: cat.sort,
          productCount: cat.productCount
        }))
      }
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取分类列表失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    创建分类
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, sort = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '分类名称不能为空',
        data: null
      });
    }

    const category = new Category({
      name,
      sort,
      userId: req.user.userId,
      productCount: 0
    });

    await category.save();

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        id: category._id,
        name: category.name,
        sort: category.sort,
        productCount: 0
      }
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建分类失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    更新分类
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, sort } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在',
        data: null
      });
    }

    if (name !== undefined) category.name = name;
    if (sort !== undefined) category.sort = sort;

    await category.save();

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        id: category._id,
        name: category.name,
        sort: category.sort,
        productCount: category.productCount
      }
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新分类失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    删除分类
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在',
        data: null
      });
    }

    // 检查是否有产品使用此分类
    const productCount = await Product.countDocuments({
      categoryId: req.params.id,
      userId: req.user.userId
    });

    if (productCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该分类下有产品，无法删除',
        data: { productCount }
      });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除分类失败',
      data: error.message
    });
  }
});

module.exports = router;
