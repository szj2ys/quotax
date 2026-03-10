/**
 * 数据模型 - 产品分类
 * 用于产品分类管理
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // 所属用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 分类名称
  name: {
    type: String,
    required: [true, '分类名称不能为空'],
    trim: true,
    maxlength: [50, '分类名称最多50个字符']
  },

  // 排序权重
  sort: {
    type: Number,
    default: 0
  },

  // 产品数量（缓存）
  productCount: {
    type: Number,
    default: 0
  },

  // 状态
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

// 复合索引：用户 + 排序
categorySchema.index({ userId: 1, sort: -1 });
categorySchema.index({ userId: 1, status: 1 });

// 更新产品数量
categorySchema.methods.updateProductCount = async function() {
  const Product = require('./product.model');
  const count = await Product.countDocuments({ categoryId: this._id, status: 'on' });
  this.productCount = count;
  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);
