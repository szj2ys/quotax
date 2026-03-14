/**
 * Analytics Digest Service
 * 数据日报服务
 */
const { sendEmail } = require('./emailService');
const { generateDigestHtml, generateDigestText } = require('./digestTemplate');
const Product = require('../models/Product');
const Share = require('../models/Share');
const Lead = require('../models/Lead');
const User = require('../models/User');

/**
 * 获取用户统计数据
 * @param {string} userId - 用户ID
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Promise<Object>}
 */
async function getUserStats(userId, startDate, endDate) {
  // 获取产品统计
  const productStats = {
    total: await Product.countDocuments({ userId }),
    active: await Product.countDocuments({ userId, status: 'on' })
  };

  // 获取分享统计
  const shareStats = {
    total: await Share.countDocuments({
      sharerId: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    totalAllTime: await Share.countDocuments({ sharerId: userId })
  };

  // 获取线索统计
  const leadMatch = { supplierId: userId, createdAt: { $gte: startDate, $lte: endDate } };
  const leadStats = {
    total: await Lead.countDocuments(leadMatch),
    new: await Lead.countDocuments({ ...leadMatch, status: 'new' }),
    contacted: await Lead.countDocuments({ ...leadMatch, status: 'contacted' }),
    deal: await Lead.countDocuments({ ...leadMatch, status: 'deal' }),
    totalAllTime: await Lead.countDocuments({ supplierId: userId })
  };

  // 获取浏览统计（使用 Share 的 views 字段作为近似值）
  const shares = await Share.find({
    sharerId: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });
  const viewStats = {
    total: shares.reduce((sum, s) => sum + (s.views || 0), 0),
    shares: shares.length
  };

  // 获取热门产品（基于分享数量）
  const topProducts = await Share.aggregate([
    {
      $match: {
        sharerId: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$productId',
        views: { $sum: '$views' },
        shareCount: { $sum: 1 }
      }
    },
    { $sort: { views: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        views: 1
      }
    }
  ]);

  viewStats.topProducts = topProducts;

  return {
    productStats,
    viewStats,
    shareStats,
    leadStats
  };
}

/**
 * 计算趋势（与上一周期对比）
 * @param {string} userId - 用户ID
 * @param {Date} currentStart - 当前周期开始
 * @param {Date} currentEnd - 当前周期结束
 * @param {number} periodDays - 周期天数
 * @returns {Promise<Object>}
 */
async function calculateTrend(userId, currentStart, currentEnd, periodDays) {
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - periodDays);
  const prevEnd = new Date(currentEnd);
  prevEnd.setDate(prevEnd.getDate() - periodDays);

  const currentShares = await Share.countDocuments({
    sharerId: userId,
    createdAt: { $gte: currentStart, $lte: currentEnd }
  });
  const prevShares = await Share.countDocuments({
    sharerId: userId,
    createdAt: { $gte: prevStart, $lte: prevEnd }
  });

  const currentLeads = await Lead.countDocuments({
    supplierId: userId,
    createdAt: { $gte: currentStart, $lte: currentEnd }
  });
  const prevLeads = await Lead.countDocuments({
    supplierId: userId,
    createdAt: { $gte: prevStart, $lte: prevEnd }
  });

  const calcPercent = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    shares: calcPercent(currentShares, prevShares),
    leads: calcPercent(currentLeads, prevLeads)
  };
}

/**
 * 发送数据日报给单个用户
 * @param {Object} user - 用户对象
 * @param {string} period - 周期 (daily/weekly/monthly)
 */
async function sendDigestToUser(user, period = 'daily') {
  try {
    // 检查用户是否开启了对应通知
    const notifyPref = user.notificationPreferences?.[period] ?? true;
    if (!notifyPref) {
      console.log(`[Digest] Skipped ${period} digest for ${user.email} (disabled)`);
      return { skipped: true };
    }

    // 计算时间范围
    const now = new Date();
    let startDate, periodDays;

    switch (period) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        periodDays = 7;
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        periodDays = 30;
        break;
      case 'daily':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        periodDays = 1;
        break;
    }

    // 获取统计数据
    const stats = await getUserStats(user._id, startDate, now);
    const trend = await calculateTrend(user._id, startDate, now, periodDays);

    // 如果没有数据，跳过发送
    const hasData = stats.viewStats.total > 0 ||
                    stats.shareStats.total > 0 ||
                    stats.leadStats.total > 0;
    if (!hasData) {
      console.log(`[Digest] Skipped ${period} digest for ${user.email} (no data)`);
      return { skipped: true, reason: 'no_data' };
    }

    // 生成邮件内容
    const html = generateDigestHtml({ ...stats, trend }, user.companyName || user.username, period);
    const text = generateDigestText({ ...stats, trend }, user.companyName || user.username, period);

    // 发送邮件
    await sendEmail({
      to: user.email,
      subject: `QuotaX 数据${{ daily: '日报', weekly: '周报', monthly: '月报' }[period]} - ${user.companyName || user.username}`,
      html,
      text
    });

    console.log(`[Digest] Sent ${period} digest to ${user.email}`);
    return { sent: true };
  } catch (error) {
    console.error(`[Digest] Failed to send ${period} digest to ${user.email}:`, error.message);
    return { error: error.message };
  }
}

/**
 * 批量发送数据日报
 * @param {string} period - 周期 (daily/weekly/monthly)
 */
async function sendDigestBatch(period = 'daily') {
  console.log(`[Digest] Starting ${period} digest batch...`);

  try {
    // 获取所有有邮箱的用户
    const users = await User.find({ email: { $exists: true, $ne: '' } });
    console.log(`[Digest] Found ${users.length} users with email`);

    const results = {
      sent: 0,
      skipped: 0,
      errors: 0
    };

    // 串行发送避免过载
    for (const user of users) {
      const result = await sendDigestToUser(user, period);
      if (result.sent) results.sent++;
      else if (result.skipped) results.skipped++;
      else if (result.error) results.errors++;
    }

    console.log(`[Digest] Batch complete: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[Digest] Batch failed:', error);
    throw error;
  }
}

module.exports = {
  getUserStats,
  calculateTrend,
  sendDigestToUser,
  sendDigestBatch
};
