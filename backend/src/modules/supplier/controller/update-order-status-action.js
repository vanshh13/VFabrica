const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for updating order status.
 */
module.exports = function makeUpdateOrderStatusAction(updateOrderStatusUsecase) {
  return async function updateOrderStatusAction(req, res, next) {
    const userId = req.user.id;
    const orderId = req.params.id;
    const body = req.body || {};
    const statusName = body.statusName || body.status || body.orderStatus;
    const remarks = body.remarks || body.comment || '';

    logger.info({ userId, orderId, statusName, body }, 'Controller: Update order status request received');

    try {
      const result = await updateOrderStatusUsecase(userId, orderId, { statusName, remarks });
      logger.info({ userId, orderId, statusName }, 'Controller: Update order status success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Order status updated successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, orderId, errorMessage: error.message, stack: error.stack }, 'Controller: Update order status failed');
      return errorResponse(res, {
        statusCode: 400,
        message: error.message || 'Failed to update order status',
        error: error.message
      });
    }
  };
};
