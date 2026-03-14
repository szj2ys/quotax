/**
 * Share Model
 * 分享记录模型
 */
const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  // 分享者用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 分享的产品ID
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },

  // 分享类型: wechat(微信好友), timeline(朋友圈), poster(海报)
  shareType: {
    type: String,
    enum: ['wechat', 'timeline', 'poster'],
    required: true
  },

  // 被分享者信息（如果有）
  viewerInfo: {
    openid: String,
    nickname: String,
    avatarUrl: String
  },

  // 访问时间
  viewedAt: {
    type: Date,
    default: null
  },

  // 转化时间（如下单、留资）
  convertedAt: {
    type: Date,
    default: null
  },

  // 转化类型
  convertType: {
    type: String,
    enum: ['inquiry', 'cart', 'lead', null],
    default: null
  }
}, {
  timestamps: true
});

// 复合索引
shareSchema.index({ userId: 1, createdAt: -1 });
shareSchema.index({ productId: 1, createdAt: -1 });

// 获取用户的分享统计
shareSchema.statics.getShareStats = async function(userId, startDate, endDate) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalShares: { $sum: 1 },
        wechatShares: {
          $sum: { $cond: [{ $eq: ['$shareType', 'wechat'] }, 1, 0] }
        },
        timelineShares: {
          $sum: { $cond: [{ $eq: ['$shareType', 'timeline'] }, 1, 0] }
        },
        posterShares: {
          $sum: { $cond: [{ $eq: ['$shareType', 'poster'] }, 1, 0] }
        },
        totalViews: {
          $sum: { $cond: [{ $ne: ['$viewedAt', null] }, 1, 0] }
        },
        totalConversions: {
          $sum: { $cond: [{ $ne: ['$convertedAt', null] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalShares: 0,
    wechatShares: 0,
    timelineShares: 0,
    posterShares: 0,
    totalViews: 0,
    totalConversions: 0
  };
};

// 获取分享带来的访客列表
shareSchema.statics.getShareVisitors = async function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  const shares = await this.find({
    userId: new mongoose.Types.ObjectId(userId),
    viewedAt: { $ne: null }
  })
    .populate('productId', 'name images price')
    .sort({ viewedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return shares;
};

module.exports = mongoose.model('Share', shareSchema);
