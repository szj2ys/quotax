/**
 * Logger Middleware Tests
 * 日志中间件测试
 */
const request = require('supertest');
const express = require('express');

// Import logger middleware
const { requestLogger, attachLogger, logger } = require('../middleware/logger');

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Apply logger middleware
  app.use(requestLogger);
  app.use(attachLogger);

  // Test route
  app.get('/test', (req, res) => {
    req.logger.info('Test log message', { testData: 'value' });
    res.json({ message: 'OK' });
  });

  // Error route
  app.get('/error', (req, res) => {
    res.status(500).json({ message: 'Error' });
  });

  // Not found route
  app.get('/not-found', (req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  return app;
};

describe('Logger Middleware', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Request ID Tracing', () => {
    it('should generate request ID for each request', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should accept existing request ID from headers', async () => {
      const customRequestId = 'custom-request-id-123';

      const response = await request(app)
        .get('/test')
        .set('X-Request-ID', customRequestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('should accept trace ID from X-Trace-Id header', async () => {
      const customTraceId = 'trace-id-456';

      const response = await request(app)
        .get('/test')
        .set('X-Trace-Id', customTraceId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(customTraceId);
    });
  });

  describe('JSON Logging', () => {
    it('should log requests in JSON format', async () => {
      await request(app).get('/test').expect(200);

      const logCalls = mockConsoleLog.mock.calls;
      const jsonLogs = logCalls
        .map(call => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null);

      expect(jsonLogs.length).toBeGreaterThan(0);

      // Check request started log
      const startedLog = jsonLogs.find(log => log.message === 'Request started');
      expect(startedLog).toBeDefined();
      expect(startedLog.timestamp).toBeDefined();
      expect(startedLog.level).toBe('INFO');
      expect(startedLog.method).toBe('GET');
      expect(startedLog.path).toBe('/test');
      expect(startedLog.requestId).toBeDefined();
    });

    it('should log request completion with duration', async () => {
      await request(app).get('/test').expect(200);

      const logCalls = mockConsoleLog.mock.calls;
      const jsonLogs = logCalls
        .map(call => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null);

      const completedLog = jsonLogs.find(log => log.message === 'Request completed');
      expect(completedLog).toBeDefined();
      expect(completedLog.duration).toMatch(/\d+ms/);
      expect(completedLog.statusCode).toBe(200);
    });

    it('should warn on client errors (4xx)', async () => {
      await request(app).get('/not-found').expect(404);

      const warnCalls = mockConsoleWarn.mock.calls;
      const jsonLogs = warnCalls
        .map(call => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null);

      const errorLog = jsonLogs.find(log => log.message === 'Request completed');
      expect(errorLog).toBeDefined();
      expect(errorLog.level).toBe('WARN');
      expect(errorLog.statusCode).toBe(404);
    });

    it('should error on server errors (5xx)', async () => {
      await request(app).get('/error').expect(500);

      const errorCalls = mockConsoleError.mock.calls;
      const jsonLogs = errorCalls
        .map(call => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null);

      const errorLog = jsonLogs.find(log => log.message === 'Request completed');
      expect(errorLog).toBeDefined();
      expect(errorLog.level).toBe('ERROR');
      expect(errorLog.statusCode).toBe(500);
    });
  });

  describe('Request Logger Attachment', () => {
    it('should attach logger to request object', async () => {
      await request(app).get('/test').expect(200);

      const logCalls = mockConsoleLog.mock.calls;
      const jsonLogs = logCalls
        .map(call => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null);

      // Check that the test log message was logged with trace ID
      const testLog = jsonLogs.find(log => log.message === 'Test log message');
      expect(testLog).toBeDefined();
      expect(testLog.requestId).toBeDefined();
      expect(testLog.testData).toBe('value');
    });
  });
});
