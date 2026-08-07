const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting supplier dashboard stats.
 */
module.exports = function makeGetDashboardAction(getDashboardUsecase) {
  return async function getDashboardAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId }, 'Controller: Get supplier dashboard stats request received');

    try {
      const result = await getDashboardUsecase(userId);
      logger.info({ userId }, 'Controller: Get supplier dashboard stats success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier dashboard stats retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get supplier dashboard stats failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve supplier dashboard stats',
        error
      });
    }
  };
};
