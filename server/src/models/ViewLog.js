/**
 * ViewLog Model
 * Schema for tracking page views and user behavior analytics
 */
const mongoose = require('mongoose');

const viewLogSchema = new mongoose.Schema({
  // User ID (the supplier whose page was viewed)
  userId: {
    type: String,
    required: true,
    index: true,
  },

  // Visitor ID (unique identifier for the visitor)
  visitorId: {
    type: String,
    required: true,
    index: true,
  },

  // Page being viewed
  page: {
    type: String,
    required: true,
    enum: ['quotation_share', 'product_detail', 'cart'],
  },

  // Timestamp of the view
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // Metadata
  meta: {
    // IP address
    ip: {
      type: String,
      default: '',
    },

    // Geolocation (city level)
    location: {
      country: { type: String, default: '' },
      province: { type: String, default: '' },
      city: { type: String, default: '' },
    },

    // Device fingerprint
    deviceFingerprint: {
      type: String,
      default: '',
    },

    // User agent info
    userAgent: {
      type: String,
      default: '',
    },

    // Page duration in seconds
    duration: {
      type: Number,
      default: 0,
    },

    // Scroll depth percentage (0-100)
    scrollDepth: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Clicked product IDs
    clickedProducts: [{
      type: String,
    }],

    // Source (how user arrived at page)
    source: {
      type: String,
      default: 'direct',
    },
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
viewLogSchema.index({ userId: 1, timestamp: -1 });
viewLogSchema.index({ userId: 1, page: 1, timestamp: -1 });
viewLogSchema.index({ visitorId: 1, timestamp: -1 });

// TTL index - auto delete records after 30 days
viewLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

/**
 * Check if a view should be counted as unique (30-minute window)
 * @param {String} userId - The supplier user ID
 * @param {String} visitorId - The visitor ID
 * @returns {Boolean} - Whether this is a unique view
 */
viewLogSchema.statics.isUniqueView = async function(userId, visitorId) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const recentView = await this.findOne({
    userId,
    visitorId,
    timestamp: { $gte: thirtyMinutesAgo },
  });

  return !recentView;
};

/**
 * Get today's view count for a user
 * @param {String} userId - The supplier user ID
 * @returns {Object} - { pv, uv } page views and unique visitors
 */
viewLogSchema.statics.getTodayStats = async function(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const today = await this.find({
    userId,
    timestamp: { $gte: startOfDay },
  });

  const pv = today.length;
  const uniqueVisitors = new Set(today.map(v => v.visitorId));
  const uv = uniqueVisitors.size;

  return { pv, uv };
};

/**
 * Get weekly view stats (last 7 days)
 * @param {String} userId - The supplier user ID
 * @returns {Object} - { pv, uv }
 */
viewLogSchema.statics.getWeekStats = async function(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const week = await this.find({
    userId,
    timestamp: { $gte: sevenDaysAgo },
  });

  const pv = week.length;
  const uniqueVisitors = new Set(week.map(v => v.visitorId));
  const uv = uniqueVisitors.size;

  return { pv, uv };
};

/**
 * Get monthly view stats (last 30 days)
 * @param {String} userId - The supplier user ID
 * @returns {Object} - { pv, uv }
 */
viewLogSchema.statics.getMonthStats = async function(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const month = await this.find({
    userId,
    timestamp: { $gte: thirtyDaysAgo },
  });

  const pv = month.length;
  const uniqueVisitors = new Set(month.map(v => v.visitorId));
  const uv = uniqueVisitors.size;

  return { pv, uv };
};

/**
 * Get 7-day trend data
 * @param {String} userId - The supplier user ID
 * @returns {Array} - Array of daily stats
 */
viewLogSchema.statics.get7DayTrend = async function(userId) {
  const results = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayViews = await this.find({
      userId,
      timestamp: { $gte: date, $lt: nextDate },
    });

    const pv = dayViews.length;
    const uniqueVisitors = new Set(dayViews.map(v => v.visitorId));
    const uv = uniqueVisitors.size;

    results.push({
      date: date.toISOString().split('T')[0],
      pv,
      uv,
    });
  }

  return results;
};

/**
 * Get recent visits with details
 * @param {String} userId - The supplier user ID
 * @param {Number} limit - Number of records to return
 * @returns {Array} - Recent view logs
 */
viewLogSchema.statics.getRecentVisits = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('visitorId timestamp meta.location meta.duration meta.scrollDepth');
};

/**
 * Get popular products (most clicked)
 * @param {String} userId - The supplier user ID
 * @param {Number} limit - Number of products to return
 * @returns {Array} - Product click counts
 */
viewLogSchema.statics.getPopularProducts = async function(userId, limit = 5) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await this.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: thirtyDaysAgo },
        'meta.clickedProducts': { $exists: true, $ne: [] },
      },
    },
    { $unwind: '$meta.clickedProducts' },
    {
      $group: {
        _id: '$meta.clickedProducts',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: limit },
  ]);

  return result;
};

module.exports = mongoose.model('ViewLog', viewLogSchema);
