/**
 * 指标收集与暴露中间件
 * Metrics collection and exposure middleware (Prometheus format)
 */

const os = require('os');

// 存储指标数据
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    byRoute: {}
  },
  responseTime: [],
  errors: {},
  startTime: Date.now()
};

// 最大保留的响应时间样本数
const MAX_RESPONSE_TIME_SAMPLES = 1000;

/**
 * 计算响应时间统计
 */
const calculateResponseTimeStats = () => {
  if (metrics.responseTime.length === 0) {
    return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
  }

  const sorted = [...metrics.responseTime].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || max;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || max;

  return { avg: Math.round(avg), min, max, p95, p99 };
};

/**
 * 请求指标中间件
 * 记录请求计数、响应时间、错误率
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const route = `${req.method} ${req.route?.path || req.path}`;

  metrics.requests.total++;

  // 记录按路由的请求计数
  if (!metrics.requests.byRoute[route]) {
    metrics.requests.byRoute[route] = { total: 0, success: 0, error: 0 };
  }
  metrics.requests.byRoute[route].total++;

  // 拦截响应结束
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // 记录响应时间
    metrics.responseTime.push(duration);
    if (metrics.responseTime.length > MAX_RESPONSE_TIME_SAMPLES) {
      metrics.responseTime.shift();
    }

    // 记录成功/失败
    const isSuccess = statusCode >= 200 && statusCode < 400;
    if (isSuccess) {
      metrics.requests.success++;
      metrics.requests.byRoute[route].success++;
    } else {
      metrics.requests.error++;
      metrics.requests.byRoute[route].error++;

      const errorKey = `${req.method} ${req.path} (${statusCode})`;
      metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Prometheus格式指标端点
 * GET /metrics
 */
const metricsEndpoint = (req, res) => {
  const responseTime = calculateResponseTimeStats();
  const uptime = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();

  let output = '';

  // HTTP请求总数
  output += `# HELP http_requests_total Total HTTP requests\n`;
  output += `# TYPE http_requests_total counter\n`;
  output += `http_requests_total{status="success"} ${metrics.requests.success}\n`;
  output += `http_requests_total{status="error"} ${metrics.requests.error}\n`;

  // 按路由的请求数
  output += `# HELP http_requests_by_route_total Total HTTP requests by route\n`;
  output += `# TYPE http_requests_by_route_total counter\n`;
  for (const [route, counts] of Object.entries(metrics.requests.byRoute)) {
    output += `http_requests_by_route_total{route="${route}",status="success"} ${counts.success}\n`;
    output += `http_requests_by_route_total{route="${route}",status="error"} ${counts.error}\n`;
  }

  // HTTP响应时间直方图
  output += `# HELP http_response_time_milliseconds HTTP response time in milliseconds\n`;
  output += `# TYPE http_response_time_milliseconds summary\n`;
  output += `http_response_time_milliseconds{quantile="0.50"} ${responseTime.avg}\n`;
  output += `http_response_time_milliseconds{quantile="0.95"} ${responseTime.p95}\n`;
  output += `http_response_time_milliseconds{quantile="0.99"} ${responseTime.p99}\n`;
  output += `http_response_time_milliseconds_count ${metrics.responseTime.length}\n`;

  // 错误率
  const errorRate = metrics.requests.total > 0
    ? (metrics.requests.error / metrics.requests.total * 100).toFixed(2)
    : 0;
  output += `# HELP http_error_rate_percentage HTTP error rate percentage\n`;
  output += `# TYPE http_error_rate_percentage gauge\n`;
  output += `http_error_rate_percentage ${errorRate}\n`;

  // 进程内存使用
  output += `# HELP process_memory_usage_bytes Process memory usage in bytes\n`;
  output += `# TYPE process_memory_usage_bytes gauge\n`;
  output += `process_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
  output += `process_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
  output += `process_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
  output += `process_memory_usage_bytes{type="external"} ${memoryUsage.external}\n`;

  // 系统内存使用
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  output += `# HELP system_memory_total_bytes Total system memory in bytes\n`;
  output += `# TYPE system_memory_total_bytes gauge\n`;
  output += `system_memory_total_bytes ${totalMemory}\n`;
  output += `# HELP system_memory_free_bytes Free system memory in bytes\n`;
  output += `# TYPE system_memory_free_bytes gauge\n`;
  output += `system_memory_free_bytes ${freeMemory}\n`;

  // 进程运行时间
  output += `# HELP process_uptime_seconds Process uptime in seconds\n`;
  output += `# TYPE process_uptime_seconds gauge\n`;
  output += `process_uptime_seconds ${uptime}\n`;

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(output);
};

/**
 * 获取指标数据（用于健康检查等内部使用）
 */
const getMetrics = () => {
  return {
    ...metrics,
    responseTime: calculateResponseTimeStats(),
    errorRate: metrics.requests.total > 0
      ? (metrics.requests.error / metrics.requests.total * 100).toFixed(2)
      : 0
  };
};

/**
 * 重置指标（用于测试）
 */
const resetMetrics = () => {
  metrics.requests.total = 0;
  metrics.requests.success = 0;
  metrics.requests.error = 0;
  metrics.requests.byRoute = {};
  metrics.responseTime = [];
  metrics.errors = {};
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  getMetrics,
  resetMetrics
};
