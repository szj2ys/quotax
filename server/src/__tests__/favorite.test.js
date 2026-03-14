/**
 * Favorite API Tests
 * 收藏接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../models/Favorite', () => {
  const mockSave = jest.fn();
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      userId: 'test-user-id',
      productId: 'product-1',
      save: mockSave,
    })),
    {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
    }
  );
});

jest.mock('../models/Product', () => ({
  findById: jest.fn(),
}));

const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const favoriteRoutes = require('../routes/favorite.routes');
  app.use('/api/favorites', favoriteRoutes);

  return app;
};

describe('Favorite API', () => {
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

  describe('GET /api/favorites', () => {
    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .get('/api/favorites');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return favorites list when user is logged in', async () => {
      const mockFavorites = [
        {
          productId: {
            _id: 'product-1',
            name: 'Test Product 1',
            images: ['image1.jpg'],
            price: 100,
            unit: 'piece',
            status: 'on',
          },
          createdAt: new Date(),
        },
        {
          productId: {
            _id: 'product-2',
            name: 'Test Product 2',
            images: ['image2.jpg'],
            price: 50,
            unit: 'box',
            status: 'on',
          },
          createdAt: new Date(),
        }
      ];

      Favorite.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockFavorites)
            })
          })
        })
      });
      Favorite.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter out off-sale products', async () => {
      const mockFavorites = [
        {
          productId: {
            _id: 'product-1',
            name: 'Active Product',
            images: ['image1.jpg'],
            price: 100,
            unit: 'piece',
            status: 'on',
          },
          createdAt: new Date(),
        },
        {
          productId: {
            _id: 'product-2',
            name: 'Off-sale Product',
            images: ['image2.jpg'],
            price: 50,
            unit: 'piece',
            status: 'off',
          },
          createdAt: new Date(),
        }
      ];

      Favorite.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockFavorites)
            })
          })
        })
      });
      Favorite.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].productName).toBe('Active Product');
    });
  });

  describe('POST /api/favorites', () => {
    it('should add product to favorites successfully', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
      };

      Product.findById.mockResolvedValue(mockProduct);
      Favorite.findOne.mockResolvedValue(null); // Not favorited yet

      const mockFavorite = {
        userId: 'test-user-id',
        productId: 'product-1',
        save: jest.fn().mockResolvedValue(true),
      };
      Favorite.mockImplementation(() => mockFavorite);

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('收藏成功');
      expect(response.body.data.isFavorite).toBe(true);
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .send({
          productId: 'product-1',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return 404 when product does not exist', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'non-existent',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });

    it('should return already favorited status when duplicate add', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
      };

      const existingFavorite = {
        userId: 'test-user-id',
        productId: 'product-1',
      };

      Product.findById.mockResolvedValue(mockProduct);
      Favorite.findOne.mockResolvedValue(existingFavorite);

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('已收藏');
      expect(response.body.data.isFavorite).toBe(true);
    });
  });

  describe('DELETE /api/favorites/:productId', () => {
    it('should remove product from favorites', async () => {
      Favorite.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .delete('/api/favorites/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.isFavorite).toBe(false);
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .delete('/api/favorites/product-1');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('GET /api/favorites/check/:productId', () => {
    it('should return isFavorite true when product is favorited', async () => {
      Favorite.findOne.mockResolvedValue({
        userId: 'test-user-id',
        productId: 'product-1',
      });

      const response = await request(app)
        .get('/api/favorites/check/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.isFavorite).toBe(true);
    });

    it('should return isFavorite false when product is not favorited', async () => {
      Favorite.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/favorites/check/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.isFavorite).toBe(false);
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .get('/api/favorites/check/product-1');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });
});
