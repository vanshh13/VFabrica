const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting order details.
 */
module.exports = function makeGetOrderDetailsAction(getOrderDetailsUsecase) {
  return async function getOrderDetailsAction(req, res, next) {
    const { id } = req.params;
    logger.info({ userId: req.user.id, orderId: id }, 'Controller: Get order details request received');

    try {
      const result = await getOrderDetailsUsecase(req.user, id);
      logger.info({ orderId: id }, 'Controller: Get order details success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Order details retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ orderId: id, error }, 'Controller: Get order details failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve order details',
        error
      });
    }
  };
};
