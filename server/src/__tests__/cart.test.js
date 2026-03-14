/**
 * Cart API Tests
 * 购物车接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../models/Cart', () => {
  const mockSave = jest.fn();
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      userId: 'test-user-id',
      items: [],
      save: mockSave,
    })),
    {
      findOne: jest.fn(),
    }
  );
});

jest.mock('../models/Product', () => ({
  findById: jest.fn(),
}));

const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const cartRoutes = require('../routes/cart.routes');
  app.use('/api/cart', cartRoutes);

  return app;
};

describe('Cart API', () => {
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

  describe('GET /api/cart', () => {
    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return cart content when user is logged in', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          {
            productId: {
              _id: 'product-1',
              name: 'Test Product 1',
              images: ['image1.jpg'],
              price: 100,
              specs: [{ name: 'Size', value: 'L' }],
              unit: 'piece',
              status: 'on',
            },
            quantity: 2,
          },
          {
            productId: {
              _id: 'product-2',
              name: 'Test Product 2',
              images: ['image2.jpg'],
              price: 50,
              specs: [],
              unit: 'box',
              status: 'on',
            },
            quantity: 1,
          }
        ],
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.totalCount).toBe(3);
      expect(response.body.data.totalAmount).toBe(250);
    });

    it('should create new cart if user has no cart', async () => {
      const newCart = {
        userId: 'test-user-id',
        items: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Cart.mockImplementation(() => newCart);

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should filter out off-sale products', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          {
            productId: {
              _id: 'product-1',
              name: 'Active Product',
              images: ['image1.jpg'],
              price: 100,
              specs: [],
              unit: 'piece',
              status: 'on',
            },
            quantity: 1,
          },
          {
            productId: {
              _id: 'product-2',
              name: 'Off-sale Product',
              images: ['image2.jpg'],
              price: 50,
              specs: [],
              unit: 'piece',
              status: 'off',
            },
            quantity: 1,
          }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].productName).toBe('Active Product');
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add product to cart successfully', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
        status: 'on',
      };

      const mockCart = {
        userId: 'test-user-id',
        items: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          quantity: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({
          productId: 'product-1',
          quantity: 2,
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return error when product is off-sale', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
        status: 'off',
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          quantity: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('下架');
    });

    it('should update quantity when product already in cart', async () => {
      const mockProduct = {
        _id: 'product-1',
        name: 'Test Product',
        status: 'on',
      };

      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'product-1' }, quantity: 1 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          quantity: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(mockCart.items[0].quantity).toBe(4);
    });
  });

  describe('PUT /api/cart/items/:productId', () => {
    it('should update product quantity', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'product-1' }, quantity: 1 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .put('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(mockCart.items[0].quantity).toBe(5);
    });

    it('should remove product when quantity is 0', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'product-1' }, quantity: 1 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .put('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 0,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(mockCart.items).toHaveLength(0);
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return 404 when cart does not exist', async () => {
      Cart.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });

    it('should return 404 when product not in cart', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'other-product' }, quantity: 1 }
        ],
      };

      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .put('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('DELETE /api/cart/items/:productId', () => {
    it('should remove product from cart', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'product-1' }, quantity: 1 },
          { productId: { toString: () => 'product-2' }, quantity: 2 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .delete('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0].productId.toString()).toBe('product-2');
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .delete('/api/cart/items/product-1');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return 404 when cart does not exist', async () => {
      Cart.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/cart/items/product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear cart successfully', async () => {
      const mockCart = {
        userId: 'test-user-id',
        items: [
          { productId: { toString: () => 'product-1' }, quantity: 1 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(mockCart.items).toHaveLength(0);
    });

    it('should return 401 when user is not logged in', async () => {
      const response = await request(app)
        .delete('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should succeed when cart does not exist', async () => {
      Cart.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    });
  });
});
