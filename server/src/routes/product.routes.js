/**
 * Product Routes
 * 产品管理路由
 */
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/products
 * @desc    获取产品列表
 * @access  Public/Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      status = 'on',
      keyword,
      userId
    } = req.query;

    const query = {};

    // 如果指定了userId，查询该用户的公开产品
    if (userId) {
      query.userId = userId;
      query.status = 'on'; // 只显示上架产品
    } else if (req.user) {
      // 已登录用户查询自己的产品
      query.userId = req.user.userId;
      if (status) query.status = status;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort({ sort: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(pageSize));

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: products.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description,
          images: p.images,
          categoryId: p.categoryId?._id || p.categoryId,
          categoryName: p.categoryId?.name || '',
          price: p.price,
          priceType: p.priceType,
          specs: p.specs,
          unit: p.unit,
          stock: p.stock,
          status: p.status,
          viewCount: p.viewCount,
          createdAt: p.createdAt
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取产品列表失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/products/search
 * @desc    高级搜索产品（支持多条件筛选）
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'default'
    } = req.query;

    // 验证分页参数
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        code: 400,
        message: 'page 必须是正整数',
        data: null
      });
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1) {
      return res.status(400).json({
        code: 400,
        message: 'pageSize 必须是正整数',
        data: null
      });
    }

    // 验证价格参数
    const minPriceNum = minPrice !== undefined ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice !== undefined ? parseFloat(maxPrice) : undefined;
    if (minPrice !== undefined && (isNaN(minPriceNum) || minPriceNum < 0)) {
      return res.status(400).json({
        code: 400,
        message: 'minPrice 必须是非负数',
        data: null
      });
    }
    if (maxPrice !== undefined && (isNaN(maxPriceNum) || maxPriceNum < 0)) {
      return res.status(400).json({
        code: 400,
        message: 'maxPrice 必须是非负数',
        data: null
      });
    }
    if (minPriceNum !== undefined && maxPriceNum !== undefined && minPriceNum > maxPriceNum) {
      return res.status(400).json({
        code: 400,
        message: 'minPrice 不能大于 maxPrice',
        data: null
      });
    }

    // 构建查询条件
    const query = { status: 'on' };

    // 关键词搜索
    if (keyword && keyword.trim()) {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }

    // 分类筛选
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // 价格区间筛选
    if (minPriceNum !== undefined || maxPriceNum !== undefined) {
      query.price = {};
      if (minPriceNum !== undefined) query.price.$gte = minPriceNum;
      if (maxPriceNum !== undefined) query.price.$lte = maxPriceNum;
    }

    // 排序逻辑
    let sortOption = {};
    switch (sortBy) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'created_desc':
        sortOption = { createdAt: -1 };
        break;
      default:
        // 综合排序：按 sort 和创建时间
        sortOption = { sort: 1, createdAt: -1 };
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(pageSizeNum),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: products.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description,
          images: p.images,
          categoryId: p.categoryId?._id || p.categoryId,
          categoryName: p.categoryId?.name || '',
          price: p.price,
          priceType: p.priceType,
          specs: p.specs,
          unit: p.unit,
          stock: p.stock,
          status: p.status,
          viewCount: p.viewCount,
          createdAt: p.createdAt
        })),
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('搜索产品失败:', error);
    res.status(500).json({
      code: 500,
      message: '搜索产品失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    获取产品详情
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品不存在',
        data: null
      });
    }

    // 增加浏览量
    product.viewCount += 1;
    await product.save();

    res.json({
      code: 200,
      message: 'success',
      data: {
        id: product._id,
        name: product.name,
        description: product.description,
        images: product.images,
        categoryId: product.categoryId?._id || product.categoryId,
        categoryName: product.categoryId?.name || '',
        price: product.price,
        priceType: product.priceType,
        specs: product.specs,
        unit: product.unit,
        stock: product.stock,
        status: product.status,
        viewCount: product.viewCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取产品详情失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    创建产品
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      images,
      categoryId,
      price,
      priceType = 'wholesale',
      specs,
      unit,
      stock,
      status = 'on'
    } = req.body;

    if (!name || !categoryId || !price || !unit) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段',
        data: null
      });
    }

    // 验证分类是否存在且属于当前用户
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user.userId
    });

    if (!category) {
      return res.status(400).json({
        code: 400,
        message: '分类不存在',
        data: null
      });
    }

    const product = new Product({
      name,
      description,
      images: images || [],
      categoryId,
      userId: req.user.userId,
      price,
      priceType,
      specs: specs || [],
      unit,
      stock: stock || 0,
      status
    });

    await product.save();

    // 更新分类产品数
    category.productCount = await Product.countDocuments({ categoryId });
    await category.save();

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        id: product._id,
        name: product.name,
        price: product.price,
        status: product.status
      }
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建产品失败',
      data: error.message
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    更新产品
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品不存在',
        data: null
      });
    }

    const updateFields = ['name', 'description', 'images', 'categoryId', 'price', 'priceType', 'specs', 'unit', 'stock', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        id: product._id,
        name: product.name,
        price: product.price,
        status: product.status
      }
    });
  } catch (error) {
    console.error('更新产品失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新产品失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    删除产品
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品不存在',
        data: null
      });
    }

    const categoryId = product.categoryId;

    await Product.deleteOne({ _id: req.params.id });

    // 更新分类产品数
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (category) {
        category.productCount = await Product.countDocuments({ categoryId });
        await category.save();
      }
    }

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除产品失败',
      data: error.message
    });
  }
});

module.exports = router;
