const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeDeleteWarehouseAction(deleteWarehouseUsecase) {
  return async function deleteWarehouseAction(req, res, next) {
    const userId = req.user.id;
    const { warehouseId } = req.params;
    try {
      const result = await deleteWarehouseUsecase(userId, warehouseId);
      return successResponse(res, { statusCode: 200, message: 'Warehouse deleted successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Delete warehouse failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to delete warehouse', error });
    }
  };
};
