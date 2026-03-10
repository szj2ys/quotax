/**
 * 请求验证中间件
 * 使用 express-validator 验证请求数据
 */

const { validationResult } = require('express-validator');

/**
 * 处理验证结果
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // 提取错误信息
    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      code: 400,
      message: '请求参数错误',
      data: extractedErrors
    });
  };
};

module.exports = {
  validate
};
