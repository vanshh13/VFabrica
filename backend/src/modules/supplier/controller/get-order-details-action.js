const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting order details.
 */
module.exports = function makeGetOrderDetailsAction(getOrderDetailsUsecase) {
  return async function getOrderDetailsAction(req, res, next) {
    const userId = req.user.id;
    const orderId = req.params.id;
    logger.info({ userId, orderId }, 'Controller: Get order details request received');

    try {
      const result = await getOrderDetailsUsecase(userId, orderId);
      logger.info({ userId, orderId }, 'Controller: Get order details success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Order details retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, orderId, error }, 'Controller: Get order details failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve order details',
        error
      });
    }
  };
};
