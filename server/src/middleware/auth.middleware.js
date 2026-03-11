/**
 * JWT 认证中间件
 * 验证请求中的 JWT Token
 */

const jwt = require('jsonwebtoken');

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

/**
 * 验证 JWT Token
 * 从 Authorization header 中提取并验证 token
 */
const authenticate = (req, res, next) => {
  try {
    // 获取 Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null
      });
    }

    // 检查 Bearer 格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误',
        data: null
      });
    }

    // 提取 token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌为空',
        data: null
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 将用户信息附加到请求对象
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    req.user = decoded;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期',
        data: null
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌',
        data: null
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '认证失败',
      data: null
    });
  }
};

/**
 * 可选认证
 * 有 token 则验证，没有也放行
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // 可选认证失败不影响请求
    next();
  }
};

/**
 * 生成 JWT Token
 * @param {Object} payload - Token 载荷
 * @param {String} expiresIn - 过期时间
 * @returns {String} JWT Token
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * 验证 Token
 * @param {String} token - JWT Token
 * @returns {Object} 解码后的载荷
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  auth: authenticate,
  authenticate,
  optionalAuth,
  generateToken,
  verifyToken,
  JWT_SECRET
};
