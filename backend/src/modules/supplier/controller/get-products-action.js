const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting supplier products.
 */
module.exports = function makeGetProductsAction(getProductsUsecase) {
  return async function getProductsAction(req, res, next) {
    const userId = req.user.id;
    const filterOptions = req.method === 'POST' ? req.body : req.query;
    logger.info({ userId, method: req.method, filterOptions }, 'Controller: Get supplier products request received');

    try {
      const result = await getProductsUsecase(userId, filterOptions);
      const count = Array.isArray(result) ? result.length : (result.items ? result.items.length : 0);
      logger.info({ userId, count }, 'Controller: Get supplier products success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier products retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get supplier products failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve supplier products',
        error
      });
    }
  };
};
