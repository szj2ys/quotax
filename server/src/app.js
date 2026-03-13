/**
 * Express 应用入口文件
 * 配置中间件、路由和错误处理
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

// 加载环境变量
require('dotenv').config();

// 导入数据库连接
const { connectDB } = require('./config/database');

// 导入导出清理任务
const { startCleanupJob } = require('./utils/exportCleanup');

// 导入生产环境配置（生产环境）
const { productionConfig, validateConfig, setupGracefulShutdown } = process.env.NODE_ENV === 'production'
  ? require('./config/production')
  : { productionConfig: null, validateConfig: () => {}, setupGracefulShutdown: () => {} };

// 导入监控中间件
const {
  requestMonitor,
  healthCheck,
  detailedHealthCheck,
  metricsEndpoint,
  alertsEndpoint,
  setMongoose
} = require('./middleware/monitor');

// 生产环境验证配置
if (process.env.NODE_ENV === 'production') {
  try {
    validateConfig();
  } catch (error) {
    console.error('配置验证失败:', error.message);
    process.exit(1);
  }
}

// 导入路由
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const quotationRoutes = require('./routes/quotation.routes');
const orderRoutes = require('./routes/order.routes');
const qrcodeRoutes = require('./routes/qrcode.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const exportRoutes = require('./routes/export.routes');

// 创建 Express 应用
const app = express();

// 连接数据库
connectDB();

// 启动导出文件清理定时任务
const cleanupJob = startCleanupJob();

// 设置 mongoose 用于监控
setMongoose(mongoose);

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 压缩响应
app.use(compression());

// 请求监控中间件
app.use(requestMonitor);

// 请求日志
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  const logger = productionConfig?.logger || console;
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// 健康检查端点
app.get('/health', healthCheck);
app.get('/health/detail', detailedHealthCheck);
app.get('/health/alerts', alertsEndpoint);
app.get('/metrics', metricsEndpoint);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      data: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      code: 400,
      message: '无效的 ID 格式',
      data: null
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      data: null
    });
  }

  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

// 生产环境设置优雅关闭
if (process.env.NODE_ENV === 'production') {
  setupGracefulShutdown(server, mongoose);
}

module.exports = app;
