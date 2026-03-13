/**
 * 生产环境配置
 * Production environment configuration
 */

const winston = require('winston');

// 创建 Winston 日志实例
const createLogger = () => {
  const { combine, timestamp, json, errors, printf } = winston.format;

  // 自定义格式
  const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  });

  const transports = [
    // 控制台输出
    new winston.transports.Console({
      format: process.env.LOG_FORMAT === 'json'
        ? combine(timestamp(), json())
        : combine(timestamp(), customFormat)
    })
  ];

  // 文件日志（生产环境）
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), json())
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), json())
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
      service: 'quotax-server',
      environment: process.env.NODE_ENV || 'production'
    },
    format: combine(
      timestamp(),
      errors({ stack: true })
    ),
    transports,
    // 未捕获的异常处理
    exceptionHandlers: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });
};

// 生产环境配置对象
const productionConfig = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },

  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      // 连接池配置
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 20,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
      // 连接超时
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 30000,
      // 重试配置
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 60000,
      waitQueueTimeoutMS: parseInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT) || 5000,
      // 心跳检测
      heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQ) || 10000
    }
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APPID,
    appSecret: process.env.WECHAT_APPSECRET
  },

  // CORS 配置
  cors: {
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['https://quotax.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 每个IP每窗口最多100请求
    message: '请求过于频繁，请稍后再试'
  },

  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },

  // 日志配置
  logger: createLogger(),

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    helmetOptions: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  }
};

// 配置验证
const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'WECHAT_APPID',
    'WECHAT_APPSECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
};

// 优雅关闭处理
const setupGracefulShutdown = (server, mongoose) => {
  const logger = productionConfig.logger;

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} 信号收到，开始优雅关闭...`, {
      signal,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });

    // 停止接受新连接
    server.close((err) => {
      if (err) {
        logger.error('关闭服务器时出错', { error: err.message });
        process.exit(1);
      }

      logger.info('HTTP 服务器已关闭');

      // 关闭数据库连接
      mongoose.connection.close(false, () => {
        logger.info('MongoDB 连接已关闭');
        process.exit(0);
      });

      // 强制退出超时
      setTimeout(() => {
        logger.error('强制关闭（超时）');
        process.exit(1);
      }, 30000);
    });
  };

  // 监听系统信号
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 未捕获异常处理
  process.on('uncaughtException', (err) => {
    logger.error('未捕获的异常', {
      error: err.message,
      stack: err.stack
    });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 拒绝', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });
};

module.exports = {
  productionConfig,
  validateConfig,
  setupGracefulShutdown,
  createLogger
};
