const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action to adjust stock.
 */
module.exports = function makeAdjustStockAction(adjustStockUsecase) {
  return async function adjustStockAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Adjust stock level request received');

    try {
      const { inventoryId, quantityDelta, transactionType, referenceType, referenceId, remarks } = req.body;
      const result = await adjustStockUsecase(userId, {
        inventoryId,
        quantityDelta: parseInt(quantityDelta, 10),
        transactionType,
        referenceType,
        referenceId,
        remarks,
        performedBy: userId
      });

      logger.info({ userId, inventoryId }, 'Controller: Adjust stock level success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Stock adjusted successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Adjust stock level failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to adjust stock level',
        error
      });
    }
  };
};
