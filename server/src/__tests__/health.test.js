/**
 * Health Check API Tests
 * 健康检查端点测试
 */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import health check functions from monitor middleware
const {
  healthCheck,
  detailedHealthCheck,
  metricsEndpoint,
  alertsEndpoint,
  setMongoose
} = require('../middleware/monitor');

// Create test app
const createTestApp = () => {
  const app = express();

  // Set up mongoose for monitoring
  setMongoose(mongoose);

  // Health check endpoints
  app.get('/health', healthCheck);
  app.get('/health/detail', detailedHealthCheck);
  app.get('/metrics', metricsEndpoint);
  app.get('/health/alerts', alertsEndpoint);

  return app;
};

describe('Health Check API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  afterAll(async () => {
    // Clean up mongoose connection if needed
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

describe('GET /health', () => {
    it('should return health check structure with required fields', async () => {
      const response = await request(app)
        .get('/health');

      // May return 200 (healthy) or 503 (unhealthy) depending on DB state
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('checks');
    });

    it('should include memory usage in health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.memory.rss).toBeGreaterThan(0);
    });

    it('should include health checks for database and memory', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.checks.database).toBeDefined();
      expect(response.body.data.checks.memory).toBeDefined();
    });
  });

  describe('GET /health/detail', () => {
    it('should return detailed health information structure', async () => {
      const response = await request(app)
        .get('/health/detail');

      // May return 200 (healthy) or 503 (unhealthy) depending on DB state
      expect([200, 503]).toContain(response.status);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.service).toBe('quotax-server');
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.process).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
    });

    it('should include system stats in detailed health check', async () => {
      const response = await request(app)
        .get('/health/detail');

      const system = response.body.data.system;
      expect(system).toHaveProperty('memory');
      expect(system).toHaveProperty('cpu');
      expect(system).toHaveProperty('platform');
      expect(system).toHaveProperty('nodeVersion');
      expect(system.memory).toHaveProperty('total');
      expect(system.memory).toHaveProperty('used');
      expect(system.memory).toHaveProperty('free');
    });

    it('should include process stats in detailed health check', async () => {
      const response = await request(app)
        .get('/health/detail');

      const process = response.body.data.process;
      expect(process).toHaveProperty('memory');
      expect(process).toHaveProperty('pid');
      expect(process.memory).toHaveProperty('rss');
      expect(process.memory).toHaveProperty('heapTotal');
      expect(process.memory).toHaveProperty('heapUsed');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus format metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP http_requests_total');
      expect(response.text).toContain('# TYPE http_requests_total counter');
      expect(response.text).toContain('http_requests_total');
    });

    it('should include response time metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.text).toContain('# HELP http_response_time_milliseconds');
      expect(response.text).toContain('# TYPE http_response_time_milliseconds');
    });

    it('should include process memory metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.text).toContain('# HELP process_memory_usage_bytes');
      expect(response.text).toContain('process_memory_usage_bytes{type="rss"}');
      expect(response.text).toContain('process_memory_usage_bytes{type="heapUsed"}');
    });

    it('should include system memory metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      // Check for system memory metrics (using the monitor.js format)
      expect(response.text).toContain('# HELP system_memory_usage_bytes');
      expect(response.text).toContain('system_memory_usage_bytes{type="used"}');
      expect(response.text).toContain('system_memory_usage_bytes{type="free"}');
    });

    it('should include uptime metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.text).toContain('# HELP process_uptime_seconds');
      expect(response.text).toContain('# TYPE process_uptime_seconds gauge');
      expect(response.text).toMatch(/process_uptime_seconds \d+/);
    });
  });

  describe('GET /health/alerts', () => {
    it('should return alerts status', async () => {
      const response = await request(app)
        .get('/health/alerts');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('hasCritical');
      expect(response.body.data).toHaveProperty('thresholds');
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
    });

    it('should include alert thresholds configuration', async () => {
      const response = await request(app)
        .get('/health/alerts');

      const thresholds = response.body.data.thresholds;
      expect(thresholds).toHaveProperty('errorRate');
      expect(thresholds).toHaveProperty('responseTime');
      expect(thresholds).toHaveProperty('memoryUsage');
      expect(thresholds).toHaveProperty('cpuLoad');
    });
  });
});
