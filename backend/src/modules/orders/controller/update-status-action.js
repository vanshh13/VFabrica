const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for updating order status.
 */
module.exports = function makeUpdateStatusAction(updateStatusUsecase) {
  return async function updateStatusAction(req, res, next) {
    const { id } = req.params;
    const { statusName, remarks } = req.body;
    logger.info({ userId: req.user.id, orderId: id, statusName }, 'Controller: Update order status request received');

    try {
      const result = await updateStatusUsecase(req.user, id, { statusName, remarks });
      logger.info({ orderId: id, statusName }, 'Controller: Update order status success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Order status updated successfully',
        data: result
      });
    } catch (error) {
      logger.error({ orderId: id, error }, 'Controller: Update order status failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to update order status',
        error
      });
    }
  };
};
