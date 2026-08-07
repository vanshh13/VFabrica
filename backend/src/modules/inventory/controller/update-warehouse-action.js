const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeUpdateWarehouseAction(updateWarehouseUsecase) {
  return async function updateWarehouseAction(req, res, next) {
    const userId = req.user.id;
    const { warehouseId } = req.params;
    try {
      const result = await updateWarehouseUsecase(userId, warehouseId, req.body);
      return successResponse(res, { statusCode: 200, message: 'Warehouse updated successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Update warehouse failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to update warehouse', error });
    }
  };
};
