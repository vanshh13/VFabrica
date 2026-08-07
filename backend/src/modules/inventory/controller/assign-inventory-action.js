const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeAssignInventoryAction(assignInventoryUsecase) {
  return async function assignInventoryAction(req, res, next) {
    const userId = req.user.id;
    try {
      const { warehouseId, productVariantId, quantity, reorderLevel } = req.body;
      const result = await assignInventoryUsecase(userId, { warehouseId, productVariantId, quantity: parseInt(quantity, 10), reorderLevel: parseInt(reorderLevel || 10, 10) });
      return successResponse(res, { statusCode: 200, message: 'Inventory assigned successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Assign inventory failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to assign inventory', error });
    }
  };
};
