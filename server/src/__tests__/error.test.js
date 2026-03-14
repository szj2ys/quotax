/**
 * Error Handler Middleware Tests
 * 错误处理中间件测试
 */
const request = require('supertest');
const express = require('express');

// Import error middleware
const { errorHandler, notFound, AppError, asyncHandler } = require('../middleware/error.middleware');

// Mock logger
jest.mock('../middleware/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

const { logger } = require('../middleware/logger');

// Create test app
const createTestApp = (errorRoute) => {
  const app = express();
  app.use(express.json());

  // Add request ID middleware simulation
  app.use((req, res, next) => {
    req.requestId = 'test-request-id';
    next();
  });

  // Test route that throws error
  if (errorRoute) {
    app.get('/error', errorRoute);
  }

  // 404 handler
  app.use(notFound);

  // Error handler
  app.use(errorHandler);

  return app;
};

describe('Error Handler Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const app = createTestApp();

      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.code).toBe(404);
      expect(response.body.message).toContain('找不到路径');
      expect(response.body.data).toBeNull();
    });
  });

  describe('MongoDB Validation Error', () => {
    it('should handle Mongoose ValidationError', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        name: { message: 'Name is required' },
        email: { message: 'Email is invalid' }
      };

      const app = createTestApp(asyncHandler(async (req, res) => {
        throw validationError;
      }));

      const response = await request(app)
        .get('/error')
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('Name is required');
    });
  });

  describe('MongoDB Cast Error', () => {
    it('should handle Mongoose CastError', async () => {
      const castError = new Error('Cast failed');
      castError.name = 'CastError';
      castError.path = 'userId';
      castError.value = 'invalid-id';

      const app = createTestApp(asyncHandler(async (req, res) => {
        throw castError;
      }));

      const response = await request(app)
        .get('/error')
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('userId');
      expect(response.body.message).toContain('invalid-id');
    });
  });

  describe('MongoDB Duplicate Key Error', () => {
    it('should handle MongoDB duplicate key error (code 11000)', async () => {
      const dupError = new Error('Duplicate key');
      dupError.code = 11000;
      dupError.keyValue = { email: 'test@example.com' };

      const app = createTestApp(asyncHandler(async (req, res) => {
        throw dupError;
      }));

      const response = await request(app)
        .get('/error')
        .expect(409);

      expect(response.body.code).toBe(409);
      expect(response.body.message).toContain('email');
      expect(response.body.message).toContain('已存在');
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', async () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      const app = createTestApp(asyncHandler(async (req, res) => {
        throw jwtError;
      }));

      const response = await request(app)
        .get('/error')
        .expect(401);

      expect(response.body.code).toBe(401);
      expect(response.body.message).toBe('无效的认证令牌');
    });

    it('should handle TokenExpiredError', async () => {
      const jwtError = new Error('Token expired');
      jwtError.name = 'TokenExpiredError';

      const app = createTestApp(asyncHandler(async (req, res) => {
        throw jwtError;
      }));

      const response = await request(app)
        .get('/error')
        .expect(401);

      expect(response.body.code).toBe(401);
      expect(response.body.message).toBe('认证令牌已过期');
    });
  });

  describe('AppError Custom Error', () => {
    it('should handle AppError with custom status code', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        throw new AppError('Custom error message', 403, 403, 'authorization');
      }));

      const response = await request(app)
        .get('/error')
        .expect(403);

      expect(response.body.code).toBe(403);
      expect(response.body.message).toBe('Custom error message');
    });

    it('should handle AppError with default values', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        throw new AppError('Something went wrong');
      }));

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.code).toBe(500);
      expect(response.body.message).toBe('Something went wrong');
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic errors with 500 status', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        throw new Error('Unexpected error');
      }));

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.code).toBe(500);
      expect(response.body.message).toBe('Unexpected error');
    });

    it('should log server errors', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        throw new Error('Server error');
      }));

      await request(app).get('/error').expect(500);

      expect(logger.error).toHaveBeenCalled();
      const logCall = logger.error.mock.calls[0];
      expect(logCall[0]).toBe('Server error occurred');
      expect(logCall[1].statusCode).toBe(500);
      expect(logCall[1].category).toBe('internal');
    });

    it('should warn client errors', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        const err = new AppError('Bad request', 400);
        throw err;
      }));

      await request(app).get('/error').expect(400);

      expect(logger.warn).toHaveBeenCalled();
      const logCall = logger.warn.mock.calls[0];
      expect(logCall[0]).toBe('Client error occurred');
      expect(logCall[1].statusCode).toBe(400);
    });
  });

  describe('Async Handler', () => {
    it('should catch errors in async functions', async () => {
      const app = createTestApp(asyncHandler(async (req, res) => {
        await Promise.reject(new Error('Async error'));
      }));

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.code).toBe(500);
      expect(response.body.message).toBe('Async error');
    });
  });
});
