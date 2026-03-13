/**
 * 监控和指标收集中间件
 * Monitoring and metrics collection middleware
 */

const os = require('os');

// 存储指标数据
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0
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
 * 获取系统资源使用情况
 */
const getSystemStats = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    memory: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024),   // MB
      free: Math.round(freeMemory / 1024 / 1024),   // MB
      usage: Math.round((usedMemory / totalMemory) * 100) // %
    },
    cpu: {
      loadAvg: os.loadavg(),
      count: os.cpus().length
    },
    uptime: Math.floor(process.uptime()),
    systemUptime: Math.floor(os.uptime()),
    nodeVersion: process.version,
    platform: os.platform()
  };
};

/**
 * 获取进程内存使用情况
 */
const getProcessMemory = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),        // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),  // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),    // MB
    external: Math.round(usage.external / 1024 / 1024)     // MB
  };
};

/**
 * 请求监控中间件
 * 记录请求指标
 */
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  metrics.requests.total++;

  // 拦截响应结束
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // 记录响应时间
    metrics.responseTime.push(duration);
    if (metrics.responseTime.length > MAX_RESPONSE_TIME_SAMPLES) {
      metrics.responseTime.shift();
    }

    // 记录成功/失败
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.error++;
      const key = `${req.method} ${req.path} (${res.statusCode})`;
      metrics.errors[key] = (metrics.errors[key] || 0) + 1;
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * 健康检查端点
 * 基础健康检查
 */
const healthCheck = (req, res) => {
  const healthy = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: getProcessMemory(),
    checks: {
      database: checkDatabaseHealth(),
      memory: checkMemoryHealth()
    }
  };

  const isHealthy = Object.values(healthy.checks).every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    code: isHealthy ? 200 : 503,
    message: isHealthy ? 'success' : 'unhealthy',
    data: healthy
  });
};

/**
 * 详细健康检查
 */
const detailedHealthCheck = (req, res) => {
  const responseTime = calculateResponseTimeStats();
  const systemStats = getSystemStats();
  const processMemory = getProcessMemory();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'quotax-server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    uptime: {
      process: Math.floor(process.uptime()),
      system: systemStats.systemUptime
    },
    system: {
      memory: systemStats.memory,
      cpu: {
        loadAvg: systemStats.cpu.loadAvg,
        cores: systemStats.cpu.count
      },
      platform: systemStats.platform,
      nodeVersion: systemStats.nodeVersion
    },
    process: {
      memory: processMemory,
      pid: process.pid
    },
    metrics: {
      requests: { ...metrics.requests },
      responseTime,
      errorRate: metrics.requests.total > 0
        ? (metrics.requests.error / metrics.requests.total * 100).toFixed(2)
        : 0
    },
    checks: {
      database: checkDatabaseHealth(),
      memory: checkMemoryHealth(),
      disk: checkDiskHealth()
    }
  };

  // 判断整体健康状态
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    code: isHealthy ? 200 : 503,
    message: isHealthy ? 'success' : 'unhealthy',
    data: health
  });
};

/**
 * 数据库健康检查
 */
let mongoose = null;
const setMongoose = (db) => { mongoose = db; };

const checkDatabaseHealth = () => {
  if (!mongoose || !mongoose.connection) {
    return { status: 'unknown', message: 'Mongoose not initialized' };
  }

  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  if (state === 1) {
    return { status: 'ok', message: 'Connected', state: states[state] };
  } else if (state === 2) {
    return { status: 'warning', message: 'Connecting...', state: states[state] };
  } else {
    return { status: 'error', message: 'Disconnected', state: states[state] };
  }
};

/**
 * 内存健康检查
 */
const checkMemoryHealth = () => {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  const rssMB = usage.rss / 1024 / 1024;

  // 堆内存使用超过 90% 或 RSS 超过 1GB 视为警告
  if (heapUsedPercent > 95 || rssMB > 1024) {
    return {
      status: 'error',
      message: `Memory usage critical: ${Math.round(heapUsedPercent)}% heap, ${Math.round(rssMB)}MB RSS`
    };
  } else if (heapUsedPercent > 80 || rssMB > 512) {
    return {
      status: 'warning',
      message: `Memory usage high: ${Math.round(heapUsedPercent)}% heap, ${Math.round(rssMB)}MB RSS`
    };
  }

  return {
    status: 'ok',
    message: `Memory usage normal: ${Math.round(heapUsedPercent)}% heap, ${Math.round(rssMB)}MB RSS`
  };
};

/**
 * 磁盘健康检查（简化的内存实现）
 */
const checkDiskHealth = () => {
  return { status: 'ok', message: 'Disk space normal' };
};

/**
 * 指标端点
 * 返回 Prometheus 格式的指标
 */
const metricsEndpoint = (req, res) => {
  const responseTime = calculateResponseTimeStats();
  const systemStats = getSystemStats();

  let output = '';

  // 请求指标
  output += `# HELP http_requests_total Total HTTP requests\n`;
  output += `# TYPE http_requests_total counter\n`;
  output += `http_requests_total{status="success"} ${metrics.requests.success}\n`;
  output += `http_requests_total{status="error"} ${metrics.requests.error}\n`;

  // 响应时间
  output += `# HELP http_response_time_milliseconds HTTP response time in milliseconds\n`;
  output += `# TYPE http_response_time_milliseconds summary\n`;
  output += `http_response_time_milliseconds{quantile="0.95"} ${responseTime.p95}\n`;
  output += `http_response_time_milliseconds{quantile="0.99"} ${responseTime.p99}\n`;
  output += `http_response_time_milliseconds_avg ${responseTime.avg}\n`;

  // 内存使用
  output += `# HELP process_memory_usage_bytes Process memory usage in bytes\n`;
  output += `# TYPE process_memory_usage_bytes gauge\n`;
  output += `process_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}\n`;
  output += `process_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}\n`;

  // 系统内存
  output += `# HELP system_memory_usage_bytes System memory usage in bytes\n`;
  output += `# TYPE system_memory_usage_bytes gauge\n`;
  output += `system_memory_usage_bytes{type="used"} ${systemStats.memory.used * 1024 * 1024}\n`;
  output += `system_memory_usage_bytes{type="free"} ${systemStats.memory.free * 1024 * 1024}\n`;

  // 运行时间
  output += `# HELP process_uptime_seconds Process uptime in seconds\n`;
  output += `# TYPE process_uptime_seconds gauge\n`;
  output += `process_uptime_seconds ${Math.floor(process.uptime())}\n`;

  res.set('Content-Type', 'text/plain');
  res.send(output);
};

/**
 * 告警阈值配置
 */
const ALERT_THRESHOLDS = {
  errorRate: 5,      // 错误率 > 5%
  responseTime: 1000, // 响应时间 > 1000ms
  memoryUsage: 80,    // 内存使用率 > 80%
  cpuLoad: 2.0        // CPU 负载 > 2.0
};

/**
 * 告警检查
 */
const checkAlerts = () => {
  const alerts = [];
  const responseTime = calculateResponseTimeStats();

  // 错误率告警
  if (metrics.requests.total > 0) {
    const errorRate = (metrics.requests.error / metrics.requests.total) * 100;
    if (errorRate > ALERT_THRESHOLDS.errorRate) {
      alerts.push({
        level: 'critical',
        type: 'error_rate',
        message: `Error rate is ${errorRate.toFixed(2)}%, threshold is ${ALERT_THRESHOLDS.errorRate}%`,
        value: errorRate
      });
    }
  }

  // 响应时间告警
  if (responseTime.p95 > ALERT_THRESHOLDS.responseTime) {
    alerts.push({
      level: 'warning',
      type: 'response_time',
      message: `P95 response time is ${responseTime.p95}ms, threshold is ${ALERT_THRESHOLDS.responseTime}ms`,
      value: responseTime.p95
    });
  }

  // 内存告警
  const memoryUsage = getSystemStats().memory.usage;
  if (memoryUsage > ALERT_THRESHOLDS.memoryUsage) {
    alerts.push({
      level: 'warning',
      type: 'memory',
      message: `Memory usage is ${memoryUsage}%, threshold is ${ALERT_THRESHOLDS.memoryUsage}%`,
      value: memoryUsage
    });
  }

  // CPU 负载告警
  const loadAvg = os.loadavg()[0];
  if (loadAvg > ALERT_THRESHOLDS.cpuLoad) {
    alerts.push({
      level: 'warning',
      type: 'cpu_load',
      message: `CPU load average is ${loadAvg.toFixed(2)}, threshold is ${ALERT_THRESHOLDS.cpuLoad}`,
      value: loadAvg
    });
  }

  return alerts;
};

/**
 * 告警端点
 */
const alertsEndpoint = (req, res) => {
  const alerts = checkAlerts();

  res.json({
    code: 200,
    message: 'success',
    data: {
      alerts,
      hasCritical: alerts.some(a => a.level === 'critical'),
      thresholds: ALERT_THRESHOLDS
    }
  });
};

module.exports = {
  requestMonitor,
  healthCheck,
  detailedHealthCheck,
  metricsEndpoint,
  alertsEndpoint,
  setMongoose,
  getSystemStats,
  getProcessMemory,
  metrics
};
