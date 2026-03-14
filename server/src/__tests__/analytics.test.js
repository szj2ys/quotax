/**
 * Analytics API Tests
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock models
jest.mock('../models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);

  // ViewLog constructor mock
  const ViewLogConstructor = jest.fn().mockImplementation(() => ({
    userId: 'test-user',
    visitorId: 'test-visitor',
    page: 'quotation_share',
    timestamp: new Date(),
    meta: {
      ip: '127.0.0.1',
      location: { country: '中国', province: '北京市', city: '北京' },
      deviceFingerprint: 'test-fingerprint',
      userAgent: 'test-agent',
      duration: 0,
      scrollDepth: 0,
      clickedProducts: [],
      source: 'direct',
    },
    save: mockSave,
  }));

  return {
    User: {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ totalViews: 1000 }),
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    },
    Product: {
      findById: jest.fn(),
    },
    ViewLog: Object.assign(ViewLogConstructor, {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      isUniqueView: jest.fn(),
      getTodayStats: jest.fn(),
      getWeekStats: jest.fn(),
      getMonthStats: jest.fn(),
      get7DayTrend: jest.fn(),
      getRecentVisits: jest.fn(),
      getPopularProducts: jest.fn(),
    }),
  };
});

const { ViewLog, User, Product } = require('../models');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const analyticsRoutes = require('../routes/analytics.routes');
  app.use('/api/analytics', analyticsRoutes);

  return app;
};

describe('Analytics API', () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();

    // Generate auth token for protected routes
    authToken = jwt.sign(
      { userId: 'test-user-id', openid: 'test-openid' },
      process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/analytics/track', () => {
    it('should track a page view successfully', async () => {
      ViewLog.isUniqueView = jest.fn().mockResolvedValue(true);
      ViewLog.create = jest.fn().mockResolvedValue({
        _id: 'test-id',
        timestamp: new Date(),
      });
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .post('/api/analytics/track')
        .send({
          userId: 'test-user',
          visitorId: 'test-visitor',
          page: 'quotation_share',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.tracked).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/analytics/track')
        .send({
          userId: 'test-user',
          // missing visitorId and page
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard data', async () => {
      ViewLog.getTodayStats = jest.fn().mockResolvedValue({ pv: 10, uv: 5 });
      ViewLog.getWeekStats = jest.fn().mockResolvedValue({ pv: 50, uv: 20 });
      ViewLog.getMonthStats = jest.fn().mockResolvedValue({ pv: 200, uv: 80 });
      ViewLog.get7DayTrend = jest.fn().mockResolvedValue([
        { date: '2024-01-01', pv: 10, uv: 5 },
      ]);
      ViewLog.getRecentVisits = jest.fn().mockResolvedValue([]);
      ViewLog.getPopularProducts = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.trend).toBeDefined();
    });
  });

  describe('ViewLog Model - Unique View Check', () => {
    it('should count unique visitors correctly with 30min window', async () => {
      // Mock isUniqueView to return true first, then false
      ViewLog.isUniqueView = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // First view
      const isUnique1 = await ViewLog.isUniqueView('user1', 'visitor1');
      expect(isUnique1).toBe(true);

      // Second view within 30 minutes
      const isUnique2 = await ViewLog.isUniqueView('user1', 'visitor1');
      expect(isUnique2).toBe(false);
    });
  });
});
