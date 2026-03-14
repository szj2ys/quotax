/**
 * Auth API Tests
 * 用户认证接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../models/User', () => {
  const mockSave = jest.fn();
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      _id: 'test-user-id',
      openid: 'mock_openid_test_code',
      nickName: '微信用户',
      avatarUrl: '',
      companyName: '',
      contactName: '',
      contactPhone: '',
      companyLogo: '',
      save: mockSave,
    })),
    {
      findOne: jest.fn(),
      findById: jest.fn(),
    }
  );
});

const User = require('../models/User');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const authRoutes = require('../routes/auth.routes');
  app.use('/api/auth', authRoutes);

  return app;
};

describe('Auth API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return token and user info when given valid login code', async () => {
      const mockUser = {
        _id: 'test-user-id',
        openid: 'mock_openid_test_code',
        nickName: '微信用户',
        avatarUrl: '',
        companyName: '',
        contactName: '',
        contactPhone: '',
        companyLogo: '',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist yet
      User.mockImplementation(() => mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          code: 'test_code',
          userInfo: { nickName: '微信用户', avatarUrl: '' }
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should return existing user when user already exists', async () => {
      const existingUser = {
        _id: 'existing-user-id',
        openid: 'mock_openid_existing_code',
        nickName: 'Existing User',
        avatarUrl: 'https://example.com/avatar.jpg',
        companyName: 'Test Company',
        contactName: 'Contact',
        contactPhone: '1234567890',
        companyLogo: 'https://example.com/logo.jpg',
      };

      User.findOne.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          code: 'existing_code',
          userInfo: { nickName: 'Existing User', avatarUrl: 'https://example.com/avatar.jpg' }
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.user.companyName).toBe('Test Company');
    });

    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userInfo: { nickName: 'Test User' }
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('code');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info when given valid token', async () => {
      const mockUser = {
        _id: 'test-user-id',
        openid: 'test-openid',
        nickName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        companyName: 'Test Company',
        contactName: 'Contact',
        contactPhone: '1234567890',
        companyLogo: 'https://example.com/logo.jpg',
      };

      User.findById.mockResolvedValue(mockUser);

      // Generate a valid token for testing
      const token = jwt.sign(
        { userId: 'test-user-id', openid: 'test-openid' },
        process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.id).toBe('test-user-id');
      expect(response.body.data.nickName).toBe('Test User');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user info successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        openid: 'test-openid',
        nickName: 'Test User',
        avatarUrl: '',
        companyName: 'Old Company',
        contactName: 'Old Contact',
        contactPhone: 'old-phone',
        companyLogo: '',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { userId: 'test-user-id', openid: 'test-openid' },
        process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'New Company',
          contactName: 'New Contact',
          contactPhone: 'new-phone',
          companyLogo: 'https://example.com/new-logo.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.companyName).toBe('New Company');
      expect(response.body.data.contactName).toBe('New Contact');
    });

    it('should return 404 when user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const token = jwt.sign(
        { userId: 'non-existent-user', openid: 'test-openid' },
        process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'New Company'
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          companyName: 'New Company'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });
});
