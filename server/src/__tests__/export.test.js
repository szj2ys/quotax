/**
 * Export API Tests
 * PDF/Excel导出接口测试
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock fs and models
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
  unlinkSync: jest.fn(),
}));

jest.mock('../models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockIsExpired = jest.fn().mockReturnValue(false);
  const mockMarkAsDeleted = jest.fn().mockResolvedValue(true);

  const ExportConstructor = jest.fn().mockImplementation(() => ({
    userId: 'test-user-id',
    type: 'pdf',
    url: '/uploads/exports/test.pdf',
    filePath: '/uploads/exports/test.pdf',
    filename: 'test.pdf',
    fileSize: 1024,
    options: {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    save: mockSave,
    isExpired: mockIsExpired,
    markAsDeleted: mockMarkAsDeleted,
  }));

  return {
    User: {
      findById: jest.fn(),
    },
    Product: {
      find: jest.fn(),
    },
    Category: {
      find: jest.fn(),
    },
    Export: Object.assign(ExportConstructor, {
      findByUser: jest.fn(),
      countByUser: jest.fn(),
      findOne: jest.fn(),
    }),
  };
});

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    internal: {
      getNumberOfPages: jest.fn().mockReturnValue(1),
      pageSize: { width: 210, height: 297 },
    },
    setPage: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    json_to_sheet: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

const { User, Product, Category, Export } = require('../models');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes
  const exportRoutes = require('../routes/export.routes');
  app.use('/api/export', exportRoutes);

  return app;
};

describe('Export API', () => {
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

  describe('POST /api/export/pdf', () => {
    it('should export PDF successfully when products exist', async () => {
      const mockUser = {
        _id: 'test-user-id',
        companyName: 'Test Company',
        contactName: 'Test Contact',
        contactPhone: '1234567890',
      };

      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product',
          categoryId: { name: 'Test Category' },
          specs: [{ name: 'Size', value: 'L' }],
          price: 100,
          unit: 'piece',
        }
      ];

      const mockCategories = [
        { _id: 'cat-1', name: 'Test Category', status: 'active' }
      ];

      User.findById.mockResolvedValue(mockUser);
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProducts)
        })
      });
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await request(app)
        .post('/api/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: 'cat-1',
          keyword: 'test',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.url).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should return 400 when no products to export', async () => {
      const mockUser = {
        _id: 'test-user-id',
        companyName: 'Test Company',
      };

      User.findById.mockResolvedValue(mockUser);
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .post('/api/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('没有可导出的产品');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/export/pdf')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });

    it('should return 404 when user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('POST /api/export/excel', () => {
    it('should export Excel successfully when products exist', async () => {
      const mockUser = {
        _id: 'test-user-id',
        companyName: 'Test Company',
        contactName: 'Test Contact',
        contactPhone: '1234567890',
      };

      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product',
          categoryId: { _id: 'cat-1', name: 'Test Category' },
          specs: [{ name: 'Size', value: 'L' }],
          price: 100,
          unit: 'piece',
          stock: 10,
          priceType: 'wholesale',
        }
      ];

      const mockCategories = [
        { _id: 'cat-1', name: 'Test Category', status: 'active' }
      ];

      User.findById.mockResolvedValue(mockUser);
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProducts)
        })
      });
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await request(app)
        .post('/api/export/excel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.url).toBeDefined();
      expect(response.body.data.filename).toContain('.xlsx');
    });

    it('should return 400 when no products to export', async () => {
      const mockUser = {
        _id: 'test-user-id',
        companyName: 'Test Company',
      };

      User.findById.mockResolvedValue(mockUser);
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      const response = await request(app)
        .post('/api/export/excel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/export/excel')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('GET /api/export/history', () => {
    it('should return export history with file info', async () => {
      const mockIsExpired = jest.fn().mockReturnValue(false);
      const mockExports = [
        {
          _id: 'export-1',
          userId: 'test-user-id',
          type: 'pdf',
          url: '/uploads/exports/test1.pdf',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          filename: 'test1.pdf',
          fileSize: 1024,
          options: { productCount: 5 },
          isExpired: mockIsExpired,
        },
        {
          _id: 'export-2',
          userId: 'test-user-id',
          type: 'excel',
          url: '/uploads/exports/test2.xlsx',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          filename: 'test2.xlsx',
          fileSize: 2048,
          options: { productCount: 10 },
          isExpired: mockIsExpired,
        }
      ];

      Export.findByUser.mockResolvedValue(mockExports);
      Export.countByUser.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/export/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(2);
      expect(response.body.data.list[0].filename).toBeDefined();
      expect(response.body.data.list[0].fileSize).toBeDefined();
    });

    it('should filter out expired exports', async () => {
      const mockExports = [
        {
          _id: 'export-1',
          userId: 'test-user-id',
          type: 'pdf',
          url: '/uploads/exports/test1.pdf',
          isExpired: jest.fn().mockReturnValue(false),
        },
        {
          _id: 'export-2',
          userId: 'test-user-id',
          type: 'excel',
          url: '/uploads/exports/test2.xlsx',
          isExpired: jest.fn().mockReturnValue(true),
        }
      ];

      Export.findByUser.mockResolvedValue(mockExports);
      Export.countByUser.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/export/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toHaveLength(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/export/history');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });

  describe('DELETE /api/export/:id', () => {
    it('should delete export record and file', async () => {
      const fs = require('fs');

      const mockExport = {
        _id: 'export-1',
        userId: 'test-user-id',
        filePath: '/uploads/exports/test.pdf',
        markAsDeleted: jest.fn().mockResolvedValue(true),
      };

      Export.findOne.mockResolvedValue(mockExport);

      const response = await request(app)
        .delete('/api/export/export-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/exports/test.pdf');
      expect(mockExport.markAsDeleted).toHaveBeenCalled();
    });

    it('should return 404 when export record does not exist', async () => {
      Export.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/export/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/api/export/export-1');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(401);
    });
  });
});
