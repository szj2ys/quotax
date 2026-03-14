/**
 * Product API Tests
 * 产品管理接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../models/Product', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      _id: 'new-product-id',
      name: 'New Product',
      description: 'Description',
      images: ['image1.jpg'],
      categoryId: 'cat-1',
      userId: 'test-user-id',
      price: 100,
      priceType: 'wholesale',
      specs: [{ name: 'Size', value: 'L' }],
      unit: 'piece',
      stock: 10,
      status: 'on',
      viewCount: 0,
      save: mockSave,
    })),
    {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
    }
  );
});

jest.mock('../models/Category', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  prototype: { save: jest.fn() },
}));

const Product = require('../models/Product');
const Category = require('../models/Category');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const productRoutes = require('../routes/product.routes');
  app.use('/api/products', productRoutes);

  return app;
};

describe('Product API', () => {
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

  describe('GET /api/products', () => {
    it('should return public products when userId is provided for unauthenticated user', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product 1',
          description: 'Description 1',
          images: ['image1.jpg'],
          categoryId: { _id: 'cat-1', name: 'Category 1' },
          price: 100,
          priceType: 'wholesale',
          specs: [{ name: 'Size', value: 'L' }],
          unit: 'piece',
          stock: 10,
          status: 'on',
          viewCount: 5,
          createdAt: new Date(),
        }
      ];

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockProducts)
            })
          })
        })
      });
      Product.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/products')
        .query({ userId: 'test-user-id' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].status).toBe('on');
    });

    it('should return all user products when authenticated', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product 1',
          description: 'Description 1',
          images: ['image1.jpg'],
          categoryId: { _id: 'cat-1', name: 'Category 1' },
          price: 100,
          priceType: 'wholesale',
          specs: [{ name: 'Size', value: 'L' }],
          unit: 'piece',
          stock: 10,
          status: 'on',
          viewCount: 5,
          createdAt: new Date(),
        },
        {
          _id: 'product-2',
          name: 'Test Product 2',
          description: 'Description 2',
          images: ['image2.jpg'],
          categoryId: { _id: 'cat-1', name: 'Category 1' },
          price: 200,
          priceType: 'retail',
          specs: [],
          unit: 'piece',
          stock: 0,
          status: 'off',
          viewCount: 2,
          createdAt: new Date(),
        }
      ];

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockProducts)
            })
          })
        })
      });
      Product.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(2);
    });

    it('should filter products by categoryId', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      Product.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products')
        .query({ userId: 'test-user-id', categoryId: 'cat-1' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    });

    it('should search products by keyword', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      Product.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products')
        .query({ userId: 'test-user-id', keyword: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product details', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
        description: 'Test Description',
        images: ['image1.jpg'],
        categoryId: { _id: 'cat-1', name: 'Category 1' },
        price: 100,
        priceType: 'wholesale',
        specs: [{ name: 'Size', value: 'L' }],
        unit: 'piece',
        stock: 10,
        status: 'on',
        viewCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      });

      const response = await request(app)
        .get('/api/products/product-1');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for invalid product ID', async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/products/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create product successfully with valid data', async () => {
      const mockCategory = {
        _id: 'cat-1',
        name: 'Test Category',
        userId: 'test-user-id',
        productCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProduct = {
        _id: 'new-product-id',
        name: 'New Product',
        description: 'Description',
        images: ['image1.jpg'],
        categoryId: 'cat-1',
        userId: 'test-user-id',
        price: 100,
        priceType: 'wholesale',
        specs: [{ name: 'Size', value: 'L' }],
        unit: 'piece',
        stock: 10,
        status: 'on',
        save: jest.fn().mockResolvedValue(true),
      };

      Category.findOne.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Product',
          description: 'Description',
          images: ['image1.jpg'],
          categoryId: 'cat-1',
          price: 100,
          priceType: 'wholesale',
          specs: [{ name: 'Size', value: 'L' }],
          unit: 'piece',
          stock: 10,
          status: 'on',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('创建成功');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Product',
          // missing categoryId, price, unit
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'New Product',
          categoryId: 'cat-1',
          price: 100,
          unit: 'piece',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product successfully', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Old Name',
        description: 'Old Description',
        images: ['old.jpg'],
        categoryId: 'cat-1',
        userId: 'test-user-id',
        price: 100,
        priceType: 'wholesale',
        specs: [],
        unit: 'piece',
        stock: 10,
        status: 'on',
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findOne.mockResolvedValue(mockProduct);

      const response = await request(app)
        .put('/api/products/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          price: 150,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 when product does not exist', async () => {
      Product.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product and update category product count', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
        categoryId: 'cat-1',
        userId: 'test-user-id',
      };

      const mockCategory = {
        _id: 'cat-1',
        productCount: 5,
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findOne.mockResolvedValue(mockProduct);
      Category.findById.mockResolvedValue(mockCategory);
      Product.deleteOne.mockResolvedValue({ deletedCount: 1 });
      Product.countDocuments.mockResolvedValue(4);

      const response = await request(app)
        .delete('/api/products/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('删除成功');
    });

    it('should return 404 when product does not exist', async () => {
      Product.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/products/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });
});
