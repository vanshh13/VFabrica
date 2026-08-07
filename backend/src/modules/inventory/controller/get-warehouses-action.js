const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action to get warehouses list.
 */
module.exports = function makeGetWarehousesAction(getWarehousesUsecase) {
  return async function getWarehousesAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId }, 'Controller: Get warehouses list request received');

    try {
      const result = await getWarehousesUsecase(userId);
      logger.info({ userId, count: result.length }, 'Controller: Get warehouses list success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Warehouses list retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get warehouses list failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve warehouses list',
        error
      });
    }
  };
};
