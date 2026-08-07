const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeTransferStockAction(transferStockUsecase) {
  return async function transferStockAction(req, res, next) {
    const userId = req.user.id;
    try {
      const { fromInventoryId, toWarehouseId, quantity } = req.body;
      const result = await transferStockUsecase(userId, { fromInventoryId, toWarehouseId, quantity: parseInt(quantity, 10) });
      return successResponse(res, { statusCode: 200, message: 'Stock transferred successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Transfer stock failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to transfer stock', error });
    }
  };
};
