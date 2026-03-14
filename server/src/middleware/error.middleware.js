/**
 * 错误处理中间件
 * 统一处理 API 错误响应，支持错误分类和结构化日志
 */

const { logger } = require('./logger');

// Error categories for classification
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  DATABASE: 'database',
  EXTERNAL_SERVICE: 'external_service',
  INTERNAL: 'internal',
  RATE_LIMIT: 'rate_limit',
  BAD_REQUEST: 'bad_request'
};

// HTTP status to category mapping
const statusToCategory = (statusCode) => {
  const mapping = {
    400: ERROR_CATEGORIES.BAD_REQUEST,
    401: ERROR_CATEGORIES.AUTHENTICATION,
    403: ERROR_CATEGORIES.AUTHORIZATION,
    404: ERROR_CATEGORIES.NOT_FOUND,
    409: ERROR_CATEGORIES.CONFLICT,
    422: ERROR_CATEGORIES.VALIDATION,
    429: ERROR_CATEGORIES.RATE_LIMIT,
    500: ERROR_CATEGORIES.INTERNAL,
    502: ERROR_CATEGORIES.EXTERNAL_SERVICE,
    503: ERROR_CATEGORIES.EXTERNAL_SERVICE,
    504: ERROR_CATEGORIES.EXTERNAL_SERVICE
  };
  return mapping[statusCode] || ERROR_CATEGORIES.INTERNAL;
};

/**
 * 异步处理包装器
 * 自动捕获异步函数中的错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 自定义错误类
 * Supports error classification and operational vs programming errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, category = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.category = category || statusToCategory(statusCode);
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      category: this.category,
      timestamp: this.timestamp,
      isOperational: this.isOperational
    };
  }
}

/**
 * Classify MongoDB errors
 */
const classifyMongoError = (err) => {
  if (err.name === 'ValidationError') {
    return {
      statusCode: 400,
      code: 400,
      category: ERROR_CATEGORIES.VALIDATION,
      message: Object.values(err.errors).map(val => val.message).join(', ')
    };
  }

  if (err.name === 'CastError') {
    return {
      statusCode: 400,
      code: 400,
      category: ERROR_CATEGORIES.BAD_REQUEST,
      message: `无效的 ${err.path}: ${err.value}`
    };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return {
      statusCode: 409,
      code: 409,
      category: ERROR_CATEGORIES.CONFLICT,
      message: `${field} 已存在`
    };
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return {
      statusCode: 503,
      code: 503,
      category: ERROR_CATEGORIES.DATABASE,
      message: '数据库连接超时，请稍后重试'
    };
  }

  return null;
};

/**
 * Classify JWT errors
 */
const classifyJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      code: 401,
      category: ERROR_CATEGORIES.AUTHENTICATION,
      message: '无效的认证令牌'
    };
  }

  if (err.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      code: 401,
      category: ERROR_CATEGORIES.AUTHENTICATION,
      message: '认证令牌已过期'
    };
  }

  return null;
};

/**
 * Log error with appropriate level and context
 */
const logError = (err, req, errorDetails) => {
  const logContext = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: errorDetails.statusCode,
    category: errorDetails.category,
    code: errorDetails.code,
    userId: req.user?.id || null,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  };

  // Include stack trace for non-operational errors or in development
  if (!err.isOperational || process.env.NODE_ENV === 'development') {
    logContext.stack = err.stack;
    logContext.originalError = err.message;
  }

  // Log based on severity
  if (errorDetails.statusCode >= 500) {
    logger.error('Server error occurred', logContext);
  } else if (errorDetails.statusCode >= 400) {
    logger.warn('Client error occurred', logContext);
  }
};

/**
 * 错误响应处理
 * Enhanced with classification and structured logging
 */
const errorHandler = (err, req, res, next) => {
  // Default error info
  let errorDetails = {
    statusCode: err.statusCode || 500,
    code: err.code || err.statusCode || 500,
    category: err.category || ERROR_CATEGORIES.INTERNAL,
    message: err.message || '服务器内部错误'
  };

  // Try to classify known error types
  const mongoError = classifyMongoError(err);
  if (mongoError) {
    errorDetails = { ...errorDetails, ...mongoError };
  }

  const jwtError = classifyJWTError(err);
  if (jwtError) {
    errorDetails = { ...errorDetails, ...jwtError };
  }

  // Handle SyntaxError (JSON parse errors)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    errorDetails = {
      statusCode: 400,
      code: 400,
      category: ERROR_CATEGORIES.BAD_REQUEST,
      message: '无效的 JSON 格式'
    };
  }

  // Log the error
  logError(err, req, errorDetails);

  // Store error message for response logging
  res.locals.errorMessage = errorDetails.message;

  // Development: include detailed error info
  const response = {
    code: errorDetails.code,
    message: errorDetails.message,
    data: null
  };

  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      category: errorDetails.category,
      originalError: err.message,
      stack: err.stack?.split('\n').slice(0, 5)
    };
  }

  res.status(errorDetails.statusCode).json(response);
};

/**
 * 404 错误处理
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `找不到路径: ${req.originalUrl}`,
    404,
    404,
    ERROR_CATEGORIES.NOT_FOUND
  );
  next(error);
};

/**
 * Unhandled rejection handler for process-level errors
 */
const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack
    });
    // Graceful shutdown
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack
    });
    // Graceful shutdown
    process.exit(1);
  });
};

module.exports = {
  asyncHandler,
  AppError,
  errorHandler,
  notFound,
  setupUnhandledRejectionHandler,
  ERROR_CATEGORIES
};
