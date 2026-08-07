const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting supplier orders.
 */
module.exports = function makeGetOrdersAction(getOrdersUsecase) {
  return async function getOrdersAction(req, res, next) {
    const userId = req.user.id;
    const filterOptions = req.method === 'POST' ? req.body : req.query;
    logger.info({ userId, method: req.method, filterOptions }, 'Controller: Get supplier orders request received');

    try {
      const result = await getOrdersUsecase(userId, filterOptions);
      logger.info({ userId, count: result.length }, 'Controller: Get supplier orders success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier orders retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get supplier orders failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve supplier orders',
        error
      });
    }
  };
};
