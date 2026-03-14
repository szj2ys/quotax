/**
 * Category API Tests
 * 分类管理接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../models/Category', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      _id: 'new-cat-id',
      name: 'New Category',
      sort: 0,
      userId: 'test-user-id',
      productCount: 0,
      save: mockSave,
    })),
    {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      deleteOne: jest.fn(),
    }
  );
});

jest.mock('../models/Product', () => ({
  countDocuments: jest.fn(),
}));

const Category = require('../models/Category');
const Product = require('../models/Product');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const categoryRoutes = require('../routes/category.routes');
  app.use('/api/categories', categoryRoutes);

  return app;
};

describe('Category API', () => {
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

  describe('GET /api/categories', () => {
    it('should return category list', async () => {
      const mockCategories = [
        {
          _id: 'cat-1',
          name: 'Category 1',
          sort: 1,
          productCount: 5,
        },
        {
          _id: 'cat-2',
          name: 'Category 2',
          sort: 2,
          productCount: 3,
        }
      ];

      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(2);
      expect(response.body.data.list[0].name).toBe('Category 1');
    });

    it('should filter categories by userId', async () => {
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await request(app)
        .get('/api/categories')
        .query({ userId: 'test-user-id' });

      expect(Category.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });
  });

  describe('POST /api/categories', () => {
    it('should create category successfully', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Category',
          sort: 0,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('创建成功');
      expect(response.body.data.name).toBe('New Category');
    });

    it('should return 400 when name is empty', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('分类名称不能为空');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({
          name: 'New Category',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category successfully', async () => {
      const mockCategory = {
        _id: 'cat-1',
        name: 'Old Name',
        sort: 1,
        userId: 'test-user-id',
        productCount: 5,
        save: jest.fn().mockResolvedValue(true),
      };

      Category.findOne.mockResolvedValue(mockCategory);

      const response = await request(app)
        .put('/api/categories/cat-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          sort: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.sort).toBe(2);
    });

    it('should return 404 when category does not exist', async () => {
      Category.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/categories/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
      expect(response.body.message).toContain('分类不存在');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/categories/cat-1')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category successfully when no products', async () => {
      const mockCategory = {
        _id: 'cat-1',
        name: 'Category 1',
        userId: 'test-user-id',
      };

      Category.findOne.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(0);
      Category.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .delete('/api/categories/cat-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('删除成功');
    });

    it('should return 400 when category has products', async () => {
      const mockCategory = {
        _id: 'cat-1',
        name: 'Category 1',
        userId: 'test-user-id',
      };

      Category.findOne.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/categories/cat-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('该分类下有产品，无法删除');
      expect(response.body.data.productCount).toBe(5);
    });

    it('should return 404 when category does not exist', async () => {
      Category.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/categories/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
      expect(response.body.message).toContain('分类不存在');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/api/categories/cat-1');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });
});
