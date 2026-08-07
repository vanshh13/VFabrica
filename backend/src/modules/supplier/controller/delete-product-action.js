const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for deleting a product.
 */
module.exports = function makeDeleteProductAction(deleteProductUsecase) {
  return async function deleteProductAction(req, res, next) {
    const userId = req.user.id;
    const productId = req.params.id;
    logger.info({ userId, productId }, 'Controller: Delete product request received');

    try {
      const result = await deleteProductUsecase(userId, productId);
      logger.info({ userId, productId }, 'Controller: Delete product success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Product deleted successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, productId, error }, 'Controller: Delete product failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to delete product',
        error
      });
    }
  };
};
