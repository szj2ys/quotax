/**
 * JSON Logger Middleware
 * Provides structured JSON logging with request ID tracing
 */

const { v4: uuidv4 } = require('uuid');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Generate or extract request ID from headers
 */
const getRequestId = (req) => {
  // Check for existing trace ID in headers (from load balancer or upstream)
  const traceId = req.headers['x-request-id'] ||
                  req.headers['x-trace-id'] ||
                  req.headers['x-correlation-id'];

  // Generate new UUID if not present
  return traceId || uuidv4();
};

/**
 * Create structured log entry
 */
const createLogEntry = (level, message, metadata = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...metadata
  };

  // Add environment info in production
  if (process.env.NODE_ENV === 'production') {
    entry.service = 'quotax-server';
    entry.environment = process.env.NODE_ENV;
    entry.version = process.env.npm_package_version || '1.0.0';
  }

  return entry;
};

/**
 * Write log to output
 */
const writeLog = (entry) => {
  console.log(JSON.stringify(entry));
};

/**
 * Logger methods
 */
const logger = {
  error: (message, metadata = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      writeLog(createLogEntry('error', message, metadata));
    }
  },

  warn: (message, metadata = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      writeLog(createLogEntry('warn', message, metadata));
    }
  },

  info: (message, metadata = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      writeLog(createLogEntry('info', message, metadata));
    }
  },

  debug: (message, metadata = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      writeLog(createLogEntry('debug', message, metadata));
    }
  }
};

/**
 * Request logging middleware
 * Attaches request ID and logs request/response details
 */
const requestLogger = (req, res, next) => {
  // Generate/request trace ID
  req.requestId = getRequestId(req);
  res.setHeader('X-Request-ID', req.requestId);

  const startTime = Date.now();

  // Extract client info
  const clientIp = req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress;

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    clientIp: clientIp?.split(',')[0]?.trim(),
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length']
  });

  // Capture response finish
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Restore original end
    originalEnd.apply(this, args);

    // Determine log level based on status code
    const statusCode = res.statusCode;
    const logMethod = statusCode >= 500 ? 'error' :
                      statusCode >= 400 ? 'warn' : 'info';

    logger[logMethod]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
      // Include error details for failed requests
      ...(statusCode >= 400 && {
        error: res.locals.errorMessage
      })
    });
  };

  next();
};

/**
 * Middleware to attach logger to request
 */
const attachLogger = (req, res, next) => {
  req.logger = {
    error: (message, metadata = {}) => logger.error(message, { ...metadata, requestId: req.requestId }),
    warn: (message, metadata = {}) => logger.warn(message, { ...metadata, requestId: req.requestId }),
    info: (message, metadata = {}) => logger.info(message, { ...metadata, requestId: req.requestId }),
    debug: (message, metadata = {}) => logger.debug(message, { ...metadata, requestId: req.requestId })
  };
  next();
};

module.exports = {
  logger,
  requestLogger,
  attachLogger,
  LOG_LEVELS
};
