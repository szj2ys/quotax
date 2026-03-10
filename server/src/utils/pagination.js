/**
 * Pagination Utilities
 * Helper functions for paginated API responses
 */

/**
 * Parse pagination parameters from request
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default values
 * @returns {Object} Parsed pagination params
 */
const parsePagination = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(query.pageSize, 10) || defaults.pageSize || 20)
  );

  return { page, pageSize };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total item count
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination metadata
 */
const calculatePagination = (total, page, pageSize) => {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Build MongoDB skip and limit from pagination params
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {Object} Skip and limit values
 */
const buildMongoPagination = (page, pageSize) => {
  return {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };
};

module.exports = {
  parsePagination,
  calculatePagination,
  buildMongoPagination,
};
