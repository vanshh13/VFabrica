const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for updating supplier profile.
 */
module.exports = function makeUpdateProfileAction(updateProfileUsecase) {
  return async function updateProfileAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Update supplier profile request received');

    try {
      const result = await updateProfileUsecase(userId, req.body);
      logger.info({ userId }, 'Controller: Update supplier profile success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier profile updated successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Update supplier profile failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to update supplier profile',
        error
      });
    }
  };
};
