const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting category tree.
 */
module.exports = function makeGetCategoriesAction(getCategoriesUsecase) {
  return async function getCategoriesAction(req, res, next) {
    logger.info('Controller: Get category tree request received');

    try {
      const result = await getCategoriesUsecase();
      // HTTP Cache-Control for client browser caching (5 mins)
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      
      logger.info('Controller: Get category tree success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Categories retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ error }, 'Controller: Get category tree failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve categories',
        error
      });
    }
  };
};
