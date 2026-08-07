const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting supplier product details.
 */
module.exports = function makeGetProductDetailsAction(getProductDetailsUsecase) {
  return async function getProductDetailsAction(req, res, next) {
    const userId = req.user.id;
    const productId = req.params.id;
    logger.info({ userId, productId }, 'Controller: Get supplier product details request received');

    try {
      const result = await getProductDetailsUsecase(userId, productId);
      logger.info({ userId, productId }, 'Controller: Get supplier product details success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Product details retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, productId, error }, 'Controller: Get supplier product details failed');
      return errorResponse(res, {
        statusCode: error.message && error.message.includes('not found') ? 404 : 400,
        message: 'Failed to retrieve product details',
        error
      });
    }
  };
};
