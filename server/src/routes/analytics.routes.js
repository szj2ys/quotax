/**
 * Analytics Routes
 * API endpoints for tracking and retrieving analytics data
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ViewLog, User, Product } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { success, error } = require('../utils/response');

// Simple IP to city mapping (in production, use a proper geoip service)
const getLocationFromIP = async (ip) => {
  // For demo purposes, return mock data
  // In production, integrate with MaxMind GeoIP or similar service
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
  const provinces = ['北京市', '上海市', '广东省', '广东省', '浙江省', '四川省', '湖北省', '陕西省'];

  // Use IP hash to deterministically pick a city
  const hash = crypto.createHash('md5').update(ip).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % cities.length;

  return {
    country: '中国',
    province: provinces[index],
    city: cities[index],
  };
};

/**
 * Generate device fingerprint from request
 * @param {Object} req - Express request
 * @returns {String} - Device fingerprint hash
 */
const generateDeviceFingerprint = (req) => {
  const data = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || req.connection.remoteAddress || '',
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

/**
 * @route   POST /api/analytics/track
 * @desc    Track a page view or event
 * @access  Public
 */
router.post('/track', async (req, res) => {
  try {
    const {
      userId,
      visitorId,
      page,
      duration = 0,
      scrollDepth = 0,
      clickedProducts = [],
      source = 'direct',
    } = req.body;

    // Validate required fields
    if (!userId || !visitorId || !page) {
      return error(res, 'Missing required fields: userId, visitorId, page', 400);
    }

    // Get IP address
    const ip = req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.ip ||
               req.connection.remoteAddress ||
               '';

    // Get location from IP
    const location = await getLocationFromIP(ip);

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(req);

    // Check if this should count as a unique view (30-minute window)
    const isUnique = await ViewLog.isUniqueView(userId, visitorId);

    // Create view log
    const viewLog = new ViewLog({
      userId,
      visitorId,
      page,
      timestamp: new Date(),
      meta: {
        ip,
        location,
        deviceFingerprint,
        userAgent: req.headers['user-agent'] || '',
        duration,
        scrollDepth,
        clickedProducts,
        source,
      },
    });

    await viewLog.save();

    // Update user's view counters if it's a unique view
    if (isUnique) {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalViews: 1,
        },
      });
    }

    return success(res, {
      tracked: true,
      isUnique,
      timestamp: viewLog.timestamp,
    }, 'Track recorded');

  } catch (err) {
    console.error('Analytics track error:', err);
    return error(res, 'Failed to track event', 500);
  }
});

/**
 * @route   POST /api/analytics/track-event
 * @desc    Track a specific event (click, scroll, etc.)
 * @access  Public
 */
router.post('/track-event', async (req, res) => {
  try {
    const {
      userId,
      visitorId,
      eventType, // 'product_click', 'scroll', 'duration'
      eventData,
    } = req.body;

    if (!userId || !visitorId || !eventType) {
      return error(res, 'Missing required fields', 400);
    }

    // Find the most recent view log for this visitor
    const recentView = await ViewLog.findOne({
      userId,
      visitorId,
    }).sort({ timestamp: -1 });

    if (!recentView) {
      return error(res, 'No recent view found', 404);
    }

    // Update based on event type
    switch (eventType) {
      case 'product_click':
        if (eventData.productId) {
          if (!recentView.meta.clickedProducts.includes(eventData.productId)) {
            recentView.meta.clickedProducts.push(eventData.productId);
          }
        }
        break;

      case 'scroll':
        if (eventData.depth) {
          recentView.meta.scrollDepth = Math.max(
            recentView.meta.scrollDepth,
            eventData.depth
          );
        }
        break;

      case 'duration':
        if (eventData.seconds) {
          recentView.meta.duration = eventData.seconds;
        }
        break;
    }

    await recentView.save();

    return success(res, { updated: true }, 'Event tracked');

  } catch (err) {
    console.error('Analytics track-event error:', err);
    return error(res, 'Failed to track event', 500);
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics data
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Get various stats
    const todayStats = await ViewLog.getTodayStats(userId);
    const weekStats = await ViewLog.getWeekStats(userId);
    const monthStats = await ViewLog.getMonthStats(userId);

    // Get 7-day trend
    const trend = await ViewLog.get7DayTrend(userId);

    // Get recent visits
    const recentVisits = await ViewLog.getRecentVisits(userId, 10);

    // Get popular products
    const popularProductsRaw = await ViewLog.getPopularProducts(userId, 5);

    // Enrich popular products with product details
    const popularProducts = await Promise.all(
      popularProductsRaw.map(async (item) => {
        const product = await Product.findById(item._id).select('name images');
        return {
          productId: item._id,
          clicks: item.clicks,
          name: product?.name || 'Unknown Product',
          image: product?.images?.[0] || '',
        };
      })
    );

    // Get user totals
    const user = await User.findById(userId).select('totalViews');

    return success(res, {
      summary: {
        today: todayStats,
        week: weekStats,
        month: monthStats,
        total: user?.totalViews || 0,
      },
      trend,
      recentVisits: recentVisits.map(visit => ({
        visitorId: visit.visitorId,
        timestamp: visit.timestamp,
        location: visit.meta?.location?.city || '未知地区',
        duration: visit.meta?.duration || 0,
        scrollDepth: visit.meta?.scrollDepth || 0,
      })),
      popularProducts,
    }, 'Dashboard data retrieved');

  } catch (err) {
    console.error('Analytics dashboard error:', err);
    return error(res, 'Failed to get dashboard data', 500);
  }
});

/**
 * @route   GET /api/analytics/summary
 * @desc    Get brief summary for user page (today's views only)
 * @access  Private
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const todayStats = await ViewLog.getTodayStats(userId);
    const weekStats = await ViewLog.getWeekStats(userId);

    return success(res, {
      today: todayStats,
      week: weekStats,
      hasNewData: todayStats.uv > 0,
    }, 'Summary retrieved');

  } catch (err) {
    console.error('Analytics summary error:', err);
    return error(res, 'Failed to get summary', 500);
  }
});

module.exports = router;
