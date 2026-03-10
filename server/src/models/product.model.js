/**
 * 数据模型 - 产品
 * 存储产品详细信息
 */

const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  // 所属用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 基本信息
  name: {
    type: String,
    required: [true, '产品名称不能为空'],
    trim: true,
    maxlength: [100, '产品名称最多100个字符']
  },
  description: {
    type: String,
    default: '',
    maxlength: [5000, '产品描述最多5000个字符']
  },

  // 产品图片
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: '产品图片最多5张'
    }
  },

  // 分类
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },

  // 价格信息
  price: {
    type: Number,
    required: [true, '产品价格不能为空'],
    min: [0, '价格不能为负数'],
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 9999999;
      },
      message: '价格范围不合理'
    }
  },
  priceType: {
    type: String,
    enum: ['retail', 'wholesale', 'agent'],
    default: 'wholesale'
  },

  // 规格参数
  specs: {
    type: [specSchema],
    default: []
  },

  // 单位
  unit: {
    type: String,
    required: [true, '产品单位不能为空'],
    default: '件'
  },

  // 库存
  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  // 状态
  status: {
    type: String,
    enum: ['on', 'off', 'deleted'],
    default: 'on'
  },

  // 排序权重
  sort: {
    type: Number,
    default: 0
  },

  // 统计
  stats: {
    views: { type: Number, default: 0 },
    cartAdd: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  versionKey: false
});

// 索引优化
productSchema.index({ userId: 1, status: 1, createdAt: -1 });
productSchema.index({ userId: 1, categoryId: 1, status: 1 });
productSchema.index({ userId: 1, name: 'text', description: 'text' });

// 更新统计
productSchema.methods.incrementStat = async function(field) {
  if (this.stats[field] !== undefined) {
    this.stats[field] += 1;
    await this.save();
  }
};

module.exports = mongoose.model('Product', productSchema);
