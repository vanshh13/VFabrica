'use strict';

const { logger } = require('../utils/logger');

/**
 * Validates essential environment variables required for backend execution.
 */
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const optional = [
    'CLOUDINARY_URL',
    'LLM_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `CRITICAL CONFIGURATION ERROR: Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  }

  optional.forEach(key => {
    if (!process.env[key]) {
      logger.warn(`WARNING: Environment variable '${key}' is not set. Related features may have limited functionality.`);
    }
  });

  // Security warning for insecure default JWT secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'supersecretkey' || process.env.JWT_SECRET === 'your_jwt_access_secret_here') {
      logger.error('SECURITY ALERT: Insecure default JWT_SECRET detected in production environment!');
    }
  }
}

module.exports = {
  validateEnv
};
