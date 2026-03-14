/**
 * Search API Tests
 * 产品搜索功能集成测试
 */
const request = require('supertest');
const express = require('express');

// Mock models
jest.mock('../models/Product', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const Product = require('../models/Product');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const productRoutes = require('../routes/product.routes');
  app.use('/api/products', productRoutes);

  return app;
};

describe('Search API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/products/search', () => {
    describe('Keyword Search', () => {
      it('should return products matching keyword in name', async () => {
        const mockProducts = [
          {
            _id: 'product-1',
            name: 'Apple iPhone 15',
            description: 'Latest iPhone model',
            images: ['image1.jpg'],
            categoryId: { _id: 'cat-1', name: 'Electronics' },
            price: 999,
            priceType: 'wholesale',
            specs: [],
            unit: 'piece',
            stock: 100,
            status: 'on',
            viewCount: 50,
            createdAt: new Date('2024-01-01'),
          },
        ];

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: 'apple' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.list).toHaveLength(1);
        expect(response.body.data.list[0].name).toBe('Apple iPhone 15');
        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          $or: [
            { name: { $regex: 'apple', $options: 'i' } },
            { description: { $regex: 'apple', $options: 'i' } },
          ],
        });
      });

      it('should return products matching keyword in description', async () => {
        const mockProducts = [
          {
            _id: 'product-1',
            name: 'Smartphone X',
            description: 'Best android phone ever',
            images: ['image1.jpg'],
            categoryId: { _id: 'cat-1', name: 'Electronics' },
            price: 599,
            priceType: 'wholesale',
            specs: [],
            unit: 'piece',
            stock: 50,
            status: 'on',
            viewCount: 30,
            createdAt: new Date('2024-01-01'),
          },
        ];

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: 'android' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.list).toHaveLength(1);
        expect(response.body.data.list[0].description).toContain('android');
      });

      it('should trim whitespace from keyword', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: '  apple  ' });

        expect(response.status).toBe(200);
        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          $or: [
            { name: { $regex: 'apple', $options: 'i' } },
            { description: { $regex: 'apple', $options: 'i' } },
          ],
        });
      });
    });

    describe('Category Filtering', () => {
      it('should return products filtered by categoryId', async () => {
        const mockProducts = [
          {
            _id: 'product-1',
            name: 'Laptop',
            description: 'Gaming laptop',
            images: ['image1.jpg'],
            categoryId: { _id: 'cat-electronics', name: 'Electronics' },
            price: 1299,
            priceType: 'wholesale',
            specs: [],
            unit: 'piece',
            stock: 20,
            status: 'on',
            viewCount: 100,
            createdAt: new Date('2024-01-01'),
          },
        ];

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/products/search')
          .query({ categoryId: 'cat-electronics' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.list).toHaveLength(1);
        expect(response.body.data.list[0].categoryId).toBe('cat-electronics');
        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          categoryId: 'cat-electronics',
        });
      });

      it('should combine category and keyword filters', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app)
          .get('/api/products/search')
          .query({ categoryId: 'cat-1', keyword: 'laptop' });

        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          categoryId: 'cat-1',
          $or: [
            { name: { $regex: 'laptop', $options: 'i' } },
            { description: { $regex: 'laptop', $options: 'i' } },
          ],
        });
      });
    });

    describe('Price Range Filtering', () => {
      it('should filter products by minPrice', async () => {
        const mockProducts = [
          {
            _id: 'product-1',
            name: 'Premium Product',
            description: 'High quality',
            images: ['image1.jpg'],
            categoryId: { _id: 'cat-1', name: 'Category 1' },
            price: 500,
            priceType: 'wholesale',
            specs: [],
            unit: 'piece',
            stock: 10,
            status: 'on',
            viewCount: 20,
            createdAt: new Date('2024-01-01'),
          },
        ];

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/products/search')
          .query({ minPrice: 100 });

        expect(response.status).toBe(200);
        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          price: { $gte: 100 },
        });
      });

      it('should filter products by maxPrice', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app)
          .get('/api/products/search')
          .query({ maxPrice: 500 });

        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          price: { $lte: 500 },
        });
      });

      it('should filter products by price range', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app)
          .get('/api/products/search')
          .query({ minPrice: 100, maxPrice: 500 });

        expect(Product.find).toHaveBeenCalledWith({
          status: 'on',
          price: { $gte: 100, $lte: 500 },
        });
      });
    });

    describe('Sorting', () => {
      it('should sort by price ascending', async () => {
        const mockProducts = [
          { _id: 'p1', name: 'Product 1', price: 100 },
          { _id: 'p2', name: 'Product 2', price: 200 },
        ];

        const sortMock = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockProducts),
          }),
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: sortMock,
          }),
        });
        Product.countDocuments.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/products/search')
          .query({ sortBy: 'price_asc' });

        expect(response.status).toBe(200);
        expect(sortMock).toHaveBeenCalledWith({ price: 1 });
      });

      it('should sort by price descending', async () => {
        const sortMock = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: sortMock,
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app)
          .get('/api/products/search')
          .query({ sortBy: 'price_desc' });

        expect(sortMock).toHaveBeenCalledWith({ price: -1 });
      });

      it('should sort by created date descending', async () => {
        const sortMock = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: sortMock,
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app)
          .get('/api/products/search')
          .query({ sortBy: 'created_desc' });

        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      });

      it('should use default sort when sortBy is not provided', async () => {
        const sortMock = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: sortMock,
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app).get('/api/products/search');

        expect(sortMock).toHaveBeenCalledWith({ sort: 1, createdAt: -1 });
      });
    });

    describe('Pagination', () => {
      it('should return paginated results', async () => {
        const mockProducts = Array.from({ length: 10 }, (_, i) => ({
          _id: `product-${i + 11}`,
          name: `Product ${i + 11}`,
          description: 'Description',
          images: [],
          categoryId: { _id: 'cat-1', name: 'Category 1' },
          price: 100 + i * 10,
          priceType: 'wholesale',
          specs: [],
          unit: 'piece',
          stock: 10,
          status: 'on',
          viewCount: 0,
          createdAt: new Date(),
        }));

        const skipMock = jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockProducts),
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: skipMock,
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(25);

        const response = await request(app)
          .get('/api/products/search')
          .query({ page: 2, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(2);
        expect(response.body.data.pagination.pageSize).toBe(10);
        expect(response.body.data.pagination.total).toBe(25);
        expect(response.body.data.pagination.totalPages).toBe(3);
        expect(skipMock).toHaveBeenCalledWith(10);
      });

      it('should use default pagination when not provided', async () => {
        const limitMock = jest.fn().mockResolvedValue([]);
        const skipMock = jest.fn().mockReturnValue({
          limit: limitMock,
        });

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: skipMock,
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app).get('/api/products/search');

        expect(limitMock).toHaveBeenCalledWith(10);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array when no products match', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: 'nonexistentproduct12345' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.list).toEqual([]);
        expect(response.body.data.pagination.total).toBe(0);
        expect(response.body.data.pagination.totalPages).toBe(0);
      });

      it('should return 400 when page is invalid', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ page: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('page');
      });

      it('should return 400 when page is negative', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ page: -1 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('page');
      });

      it('should return 400 when pageSize is invalid', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ pageSize: 'abc' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('pageSize');
      });

      it('should return 400 when minPrice is negative', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ minPrice: -100 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('minPrice');
      });

      it('should return 400 when maxPrice is invalid', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ maxPrice: 'not-a-number' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('maxPrice');
      });

      it('should return 400 when minPrice > maxPrice', async () => {
        const response = await request(app)
          .get('/api/products/search')
          .query({ minPrice: 500, maxPrice: 100 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('minPrice');
      });

      it('should handle empty keyword gracefully', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: '' });

        expect(response.status).toBe(200);
        expect(Product.find).toHaveBeenCalledWith({ status: 'on' });
      });

      it('should handle special characters in keyword safely', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/products/search')
          .query({ keyword: '$regextest{}}]\\' });

        expect(response.status).toBe(200);
      });

      it('should only return products with status on', async () => {
        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(0);

        await request(app).get('/api/products/search');

        expect(Product.find).toHaveBeenCalledWith({ status: 'on' });
      });
    });

    describe('Response Format', () => {
      it('should return properly formatted product data', async () => {
        const mockProducts = [
          {
            _id: 'product-1',
            name: 'Test Product',
            description: 'Test Description',
            images: ['image1.jpg', 'image2.jpg'],
            categoryId: { _id: 'cat-1', name: 'Electronics' },
            price: 299.99,
            priceType: 'wholesale',
            specs: [{ name: 'Color', value: 'Black' }],
            unit: 'piece',
            stock: 100,
            status: 'on',
            viewCount: 50,
            createdAt: new Date('2024-01-15T10:00:00Z'),
          },
        ];

        Product.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        });
        Product.countDocuments.mockResolvedValue(1);

        const response = await request(app).get('/api/products/search');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.message).toBe('success');
        expect(response.body.data.list[0]).toMatchObject({
          id: 'product-1',
          name: 'Test Product',
          description: 'Test Description',
          images: ['image1.jpg', 'image2.jpg'],
          categoryId: 'cat-1',
          categoryName: 'Electronics',
          price: 299.99,
          priceType: 'wholesale',
          specs: [{ name: 'Color', value: 'Black' }],
          unit: 'piece',
          stock: 100,
          status: 'on',
          viewCount: 50,
        });
        expect(response.body.data.pagination).toMatchObject({
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        });
      });
    });
  });
});
