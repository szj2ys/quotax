/**
 * 健康检查路由
 * Health check routes
 */

const express = require('express');
const mongoose = require('mongoose');
const os = require('os');

const router = express.Router();

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
 * 检查数据库健康状态
 */
const checkDatabaseHealth = () => {
  if (!mongoose || !mongoose.connection) {
    return { status: 'error', connected: false, message: 'Mongoose not initialized' };
  }

  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

  if (state === 1) {
    return { status: 'connected', connected: true, state: 'connected' };
  } else if (state === 2) {
    return { status: 'connecting', connected: false, state: 'connecting' };
  } else {
    return { status: 'disconnected', connected: false, state: 'disconnected' };
  }
};

/**
 * GET /health
 * 基础健康检查端点
 * Returns: { status: 'healthy', db: {...}, memory: {...} }
 */
router.get('/', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  const memory = getProcessMemory();

  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    db: dbHealth,
    memory: memory
  });
});

/**
 * GET /health/detail
 * 详细健康检查端点
 * Returns: 扩展的健康信息包括系统资源
 */
router.get('/detail', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  const memory = getProcessMemory();

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: dbHealth,
    memory: memory,
    system: {
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        used: Math.round(usedMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        usage: Math.round((usedMemory / totalMemory) * 100)
      },
      cpu: {
        cores: os.cpus().length,
        loadAvg: os.loadavg()
      }
    }
  });
});

module.exports = router;
