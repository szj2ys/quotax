/**
 * Redis Configuration
 * Redis client setup for caching and session management
 */
const redis = require('redis');

// Redis connection config from environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;

/**
 * Initialize Redis client
 * @returns {Promise<Object>} Redis client instance
 */
const initRedis = async () => {
  try {
    client = redis.createClient({
      url: REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis initialization error:', error.message);
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Object|null} Redis client or null if not initialized
 */
const getRedisClient = () => {
  return client;
};

/**
 * Set value in Redis with optional expiration
 * @param {string} key - Cache key
 * @param {string} value - Cache value
 * @param {number} [expireSeconds] - Expiration time in seconds
 */
const setCache = async (key, value, expireSeconds) => {
  if (!client) return;
  try {
    if (expireSeconds) {
      await client.setEx(key, expireSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    console.error('Redis set error:', error.message);
  }
};

/**
 * Get value from Redis
 * @param {string} key - Cache key
 * @returns {string|null} Cached value or null
 */
const getCache = async (key) => {
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (error) {
    console.error('Redis get error:', error.message);
    return null;
  }
};

/**
 * Delete value from Redis
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  if (!client) return;
  try {
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error.message);
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
};
