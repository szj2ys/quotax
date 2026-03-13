/**
 * Analytics API Tests
 */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock models
jest.mock('../models', () => ({
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  Product: {
    findById: jest.fn(),
  },
  ViewLog: {
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
  },
}));

const { ViewLog, User, Product } = require('../models');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req, res, next) => {
    req.userId = 'test-user-id';
    next();
  });

  // Import routes
  const analyticsRoutes = require('../routes/analytics.routes');
  app.use('/api/analytics', analyticsRoutes);

  return app;
};

describe('Analytics API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
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
      User.findById = jest.fn().mockResolvedValue({ totalViews: 1000 });

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.trend).toBeDefined();
    });
  });

  describe('ViewLog Model - Unique View Check', () => {
    it('should count unique visitors correctly with 30min window', async () => {
      // First view
      ViewLog.findOne = jest.fn().mockResolvedValue(null);
      const isUnique1 = await ViewLog.isUniqueView('user1', 'visitor1');
      expect(isUnique1).toBe(true);

      // Second view within 30 minutes
      ViewLog.findOne = jest.fn().mockResolvedValue({
        _id: 'existing-view',
        timestamp: new Date(),
      });
      const isUnique2 = await ViewLog.isUniqueView('user1', 'visitor1');
      expect(isUnique2).toBe(false);
    });
  });
});
