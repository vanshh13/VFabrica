const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeGetTransactionsAction(getTransactionsUsecase) {
  return async function getTransactionsAction(req, res, next) {
    const userId = req.user.id;
    try {
      const { warehouseId, inventoryId, limit = 20, offset = 0 } = req.query;
      const result = await getTransactionsUsecase(userId, { warehouseId, inventoryId, limit, offset });
      return successResponse(res, { statusCode: 200, message: 'Transactions retrieved successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get transactions failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to retrieve transactions', error });
    }
  };
};
