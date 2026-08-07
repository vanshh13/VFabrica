const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting lookup masters.
 */
module.exports = function makeGetMastersAction(getMastersUsecase) {
  return async function getMastersAction(req, res, next) {
    logger.info('Controller: Get lookup masters request received');

    try {
      const result = await getMastersUsecase();
      // HTTP Cache-Control for client browser caching (5 mins)
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

      logger.info('Controller: Get lookup masters success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Lookup masters retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ error }, 'Controller: Get lookup masters failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve lookup masters',
        error
      });
    }
  };
};
