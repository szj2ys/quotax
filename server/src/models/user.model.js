/**
 * 数据模型 - 用户
 * 存储用户基本信息和微信登录数据
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 微信登录相关
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionid: {
    type: String,
    sparse: true
  },

  // 基本信息
  nickName: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },

  // 公司信息
  companyName: {
    type: String,
    default: ''
  },
  contactName: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  companyIntro: {
    type: String,
    default: ''
  },

  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },

  // 统计数据
  stats: {
    totalProducts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalCartAdd: { type: Number, default: 0 },
    totalFavorites: { type: Number, default: 0 }
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  versionKey: false // 禁用 __v 字段
});

// 索引优化
userSchema.index({ createdAt: -1 });

// 虚拟字段：完整的公司资料是否已设置
userSchema.virtual('profileComplete').get(function() {
  return !!(this.companyName && this.contactName && this.contactPhone);
});

// 更新统计数据的方法
userSchema.methods.updateStats = async function(field, increment = 1) {
  if (this.stats[field] !== undefined) {
    this.stats[field] += increment;
    await this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
