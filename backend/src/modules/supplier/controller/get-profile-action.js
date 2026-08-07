const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting supplier profile.
 */
module.exports = function makeGetProfileAction(getProfileUsecase) {
  return async function getProfileAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId }, 'Controller: Get supplier profile request received');

    try {
      const result = await getProfileUsecase(userId);
      logger.info({ userId }, 'Controller: Get supplier profile success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier profile retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get supplier profile failed');
      return errorResponse(res, {
        statusCode: 404,
        message: 'Supplier profile not found',
        error
      });
    }
  };
};
