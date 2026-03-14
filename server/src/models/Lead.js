/**
 * Lead Model
 * 访客留资/线索模型
 */
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // 供应商ID（接收线索的用户）
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 相关产品ID
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // 产品名称（缓存）
  productName: {
    type: String,
    required: true
  },

  // 访客信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },

  // 线索状态: new(新线索), contacted(已联系), deal(已成交), invalid(无效)
  status: {
    type: String,
    enum: ['new', 'contacted', 'deal', 'invalid'],
    default: 'new',
    index: true
  },

  // 访客微信信息（可选，如果通过微信授权获取）
  visitorWechat: {
    openid: String,
    nickname: String,
    avatarUrl: String
  },

  // 来源追踪
  source: {
    type: String,
    default: 'product_page' // product_page, share, qr_code
  },
  referrer: {
    type: String,
    default: '' // 推荐人用户ID
  }
}, {
  timestamps: true
});

// 复合索引
leadSchema.index({ supplierId: 1, status: 1, createdAt: -1 });
leadSchema.index({ supplierId: 1, createdAt: -1 });

// 获取供应商的线索列表
leadSchema.statics.findBySupplier = function(supplierId, status, options = {}) {
  const query = { supplierId };
  if (status && status !== 'all') {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);
};

// 获取线索统计
leadSchema.statics.getStats = async function(supplierId) {
  const stats = await this.aggregate([
    { $match: { supplierId: new mongoose.Types.ObjectId(supplierId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    new: 0,
    contacted: 0,
    deal: 0,
    invalid: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

module.exports = mongoose.model('Lead', leadSchema);
