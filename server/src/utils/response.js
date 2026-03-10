/**
 * API Response Utilities
 * Standardized response formatting for API endpoints
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = 'success', statusCode = 200) => {
  const response = {
    code: statusCode,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Detailed error information
 */
const error = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  const response = {
    code: statusCode,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Common error responses
 */
const errors = {
  badRequest: (res, message = 'Bad request', errors) =>
    error(res, message, 400, errors),

  unauthorized: (res, message = 'Unauthorized') =>
    error(res, message, 401),

  forbidden: (res, message = 'Forbidden') =>
    error(res, message, 403),

  notFound: (res, message = 'Resource not found') =>
    error(res, message, 404),

  validation: (res, errors) =>
    error(res, 'Validation failed', 400, errors),

  serverError: (res, message = 'Internal server error') =>
    error(res, message, 500),
};

/**
 * Pagination response wrapper
 * @param {Object} res - Express response object
 * @param {Array} list - Data list
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginated = (res, list, pagination, message = 'success') => {
  return success(res, {
    list,
    pagination,
  }, message);
};

module.exports = {
  success,
  error,
  errors,
  paginated,
};
