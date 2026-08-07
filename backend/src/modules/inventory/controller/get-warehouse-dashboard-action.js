const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

module.exports = function makeGetWarehouseDashboardAction(getWarehouseDashboardUsecase) {
  return async function getWarehouseDashboardAction(req, res, next) {
    const userId = req.user.id;
    try {
      const result = await getWarehouseDashboardUsecase(userId);
      return successResponse(res, { statusCode: 200, message: 'Warehouse dashboard retrieved successfully', data: result });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get warehouse dashboard failed');
      return errorResponse(res, { statusCode: 400, message: 'Failed to retrieve warehouse dashboard', error });
    }
  };
};
