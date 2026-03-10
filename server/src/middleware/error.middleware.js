/**
 * 错误处理中间件
 * 统一处理 API 错误响应
 */

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
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误响应处理
 */
const errorHandler = (err, req, res, next) => {
  // 默认错误信息
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let code = err.code || statusCode;

  // MongoDB 错误处理
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 400;
    message = `无效的 ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} 已存在`;
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 401;
    message = '无效的认证令牌';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 401;
    message = '认证令牌已过期';
  }

  // 开发环境输出详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('错误详情:', err);
  }

  res.status(statusCode).json({
    code,
    message,
    data: null
  });
};

/**
 * 404 错误处理
 */
const notFound = (req, res, next) => {
  const error = new AppError(`找不到路径: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  asyncHandler,
  AppError,
  errorHandler,
  notFound
};
