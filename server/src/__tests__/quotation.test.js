/**
 * Quotation API Tests
 * 公开报价单接口测试
 */
const request = require('supertest');
const express = require('express');

// Mock models
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Category', () => ({
  find: jest.fn(),
}));

jest.mock('../models/Product', () => ({
  find: jest.fn(),
}));

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const quotationRoutes = require('../routes/quotation.routes');
  app.use('/api/quotations', quotationRoutes);

  return app;
};

describe('Quotation API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/quotations/:userId', () => {
    it('should return quotation data with valid userId', async () => {
      const mockUser = {
        _id: 'user-1',
        companyName: 'Test Company',
        companyLogo: 'https://example.com/logo.jpg',
        contactName: 'Test Contact',
        contactPhone: '1234567890',
      };

      const mockCategories = [
        { _id: 'cat-1', name: 'Category 1' },
        { _id: 'cat-2', name: 'Category 2' },
      ];

      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product 1',
          images: ['image1.jpg'],
          price: 100,
          priceType: 'wholesale',
          specs: [{ name: 'Size', value: 'L' }],
          unit: 'piece',
          categoryId: { _id: 'cat-1', name: 'Category 1' },
        },
        {
          _id: 'product-2',
          name: 'Test Product 2',
          images: ['image2.jpg'],
          price: 200,
          priceType: 'retail',
          specs: [],
          unit: 'box',
          categoryId: { _id: 'cat-2', name: 'Category 2' },
        }
      ];

      User.findById.mockResolvedValue(mockUser);
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockCategories)
        })
      });
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProducts)
        })
      });

      const response = await request(app)
        .get('/api/quotations/user-1');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.company.name).toBe('Test Company');
      expect(response.body.data.categories).toHaveLength(2);
      expect(response.body.data.products).toHaveLength(2);
    });

    it('should return 404 for invalid userId', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/quotations/invalid-user-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
      expect(response.body.message).toContain('供应商不存在');
    });

    it('should only return on-sale products', async () => {
      const mockUser = {
        _id: 'user-1',
        companyName: 'Test Company',
      };

      const mockCategories = [{ _id: 'cat-1', name: 'Category 1' }];

      User.findById.mockResolvedValue(mockUser);
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockCategories)
        })
      });
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .get('/api/quotations/user-1');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      // The query should include status: 'on'
      const productQuery = Product.find.mock.calls[0][0];
      expect(productQuery.status).toBe('on');
    });

    it('should filter products by categoryId', async () => {
      const mockUser = {
        _id: 'user-1',
        companyName: 'Test Company',
      };

      User.findById.mockResolvedValue(mockUser);
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([])
        })
      });
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await request(app)
        .get('/api/quotations/user-1')
        .query({ categoryId: 'cat-1' });

      const productQuery = Product.find.mock.calls[0][0];
      expect(productQuery.categoryId).toBe('cat-1');
    });

    it('should search products by keyword', async () => {
      const mockUser = {
        _id: 'user-1',
        companyName: 'Test Company',
      };

      User.findById.mockResolvedValue(mockUser);
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([])
        })
      });
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await request(app)
        .get('/api/quotations/user-1')
        .query({ keyword: 'test' });

      const productQuery = Product.find.mock.calls[0][0];
      expect(productQuery.$or).toBeDefined();
      expect(productQuery.$or).toHaveLength(2);
      expect(productQuery.$or[0].name.$regex).toBe('test');
    });

    it('should use default company name when not set', async () => {
      const mockUser = {
        _id: 'user-1',
        companyName: '',
        companyLogo: '',
        contactName: '',
        contactPhone: '',
      };

      User.findById.mockResolvedValue(mockUser);
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([])
        })
      });
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .get('/api/quotations/user-1');

      expect(response.status).toBe(200);
      expect(response.body.data.company.name).toBe('未设置公司名');
    });

    it('should handle server errors gracefully', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/quotations/user-1');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe(500);
      expect(response.body.message).toContain('获取报价单失败');
    });
  });
});
