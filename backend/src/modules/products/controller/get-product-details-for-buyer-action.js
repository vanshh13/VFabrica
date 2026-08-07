const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting a single product's details for buyers.
 */
module.exports = function makeGetProductDetailsForBuyerAction(getProductDetailsForBuyerUsecase) {
  return async function getProductDetailsForBuyerAction(req, res, next) {
    const productId = req.params.id;
    logger.info({ productId }, 'Controller: Get product details request received');

    try {
      const result = await getProductDetailsForBuyerUsecase(productId);
      logger.info({ productId }, 'Controller: Get product details success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Product details retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ productId, error }, 'Controller: Get product details failed');
      return errorResponse(res, {
        statusCode: 404,
        message: 'Product not found',
        error
      });
    }
  };
};
