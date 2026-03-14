/**
 * Metrics API Tests
 * 指标暴露接口测试
 */
const request = require('supertest');
const express = require('express');

// Import metrics middleware
const { metricsMiddleware, metricsEndpoint, resetMetrics } = require('../middleware/metrics');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Apply metrics middleware
  app.use(metricsMiddleware);

  // Test route
  app.get('/test', (req, res) => {
    res.json({ message: 'OK' });
  });

  app.get('/test-error', (req, res) => {
    res.status(500).json({ message: 'Error' });
  });

  app.get('/test-not-found', (req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Metrics endpoint
  app.get('/metrics', metricsEndpoint);

  return app;
};

describe('Metrics API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    resetMetrics();  // Reset metrics before each test
  });

  describe('GET /metrics', () => {
    it('should expose request count metrics', async () => {
      // Make some requests
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total{status="success"} 2');
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should expose response time metrics', async () => {
      await request(app).get('/test').expect(200);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP http_response_time_milliseconds');
      expect(response.text).toContain('# TYPE http_response_time_milliseconds summary');
      expect(response.text).toContain('http_response_time_milliseconds{quantile="0.95"}');
      expect(response.text).toContain('http_response_time_milliseconds{quantile="0.99"}');
    });

    it('should track error requests separately', async () => {
      await request(app).get('/test').expect(200);
      await request(app).get('/test-error').expect(500);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total{status="success"} 1');
      expect(response.text).toContain('http_requests_total{status="error"} 1');
    });

    it('should expose error rate percentage', async () => {
      await request(app).get('/test').expect(200);
      await request(app).get('/test-error').expect(500);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP http_error_rate_percentage');
      // Error rate should be around 50% (1 error out of 2 requests, not counting metrics request itself)
      expect(response.text).toMatch(/http_error_rate_percentage \d+/);
    });

    it('should expose process memory metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP process_memory_usage_bytes');
      expect(response.text).toContain('process_memory_usage_bytes{type="rss"}');
      expect(response.text).toContain('process_memory_usage_bytes{type="heapUsed"}');
    });

    it('should expose system memory metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      // Using the metrics.js format which uses different metric names
      expect(response.text).toContain('# HELP system_memory_total_bytes');
      expect(response.text).toContain('system_memory_total_bytes');
      expect(response.text).toContain('# HELP system_memory_free_bytes');
      expect(response.text).toContain('system_memory_free_bytes');
    });

    it('should expose process uptime', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP process_uptime_seconds');
      expect(response.text).toContain('process_uptime_seconds');
    });

    it('should track requests by route', async () => {
      await request(app).get('/test').expect(200);
      await request(app).get('/test-error').expect(500);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_by_route_total');
    });
  });
});
