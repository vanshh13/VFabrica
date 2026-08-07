/**
 * Central response helpers to standardize API response payloads.
 */

function successResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString()
  });
}

function errorResponse(res, { statusCode = 400, message = 'Error occurred', error = null }) {
  const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorMessage || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  successResponse,
  errorResponse
};
