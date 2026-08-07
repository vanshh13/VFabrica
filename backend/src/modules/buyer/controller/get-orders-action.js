const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting buyer orders.
 */
module.exports = function makeGetOrdersAction(getOrdersUsecase) {
  return async function getOrdersAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId }, 'Controller: Get buyer orders request received');

    try {
      const result = await getOrdersUsecase(userId);
      logger.info({ userId, count: result.length }, 'Controller: Get buyer orders success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Buyer orders retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get buyer orders failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve buyer orders',
        error
      });
    }
  };
};
