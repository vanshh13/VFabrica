const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for updating product stock.
 */
module.exports = function makeUpdateStockAction(updateStockUsecase) {
  return async function updateStockAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Update stock request received');

    try {
      const { variantId, quantity, reorderLevel } = req.body;

      const result = await updateStockUsecase(userId, { variantId, quantity, reorderLevel });
      logger.info({ userId, variantId }, 'Controller: Update stock success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Stock updated successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Update stock failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to update stock',
        error
      });
    }
  };
};
