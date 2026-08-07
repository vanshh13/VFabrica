const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for updating a product.
 */
module.exports = function makeUpdateProductAction(updateProductUsecase) {
  return async function updateProductAction(req, res, next) {
    const userId = req.user.id;
    const productId = req.params.id;
    logger.info({ userId, productId, body: req.body }, 'Controller: Update product request received');

    try {
      const {
        categoryId,
        fabricTypeId,
        unitId,
        brand,
        name,
        description,
        basePrice,
        minimumOrderQuantity,
        leadTimeDays,
        status,
        images,
        variants
      } = req.body;

      const result = await updateProductUsecase(userId, productId, {
        categoryId,
        fabricTypeId,
        unitId,
        brand,
        name,
        description,
        basePrice,
        minimumOrderQuantity,
        leadTimeDays,
        status,
        images,
        variants
      });

      logger.info({ userId, productId }, 'Controller: Update product success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Product updated successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, productId, error }, 'Controller: Update product failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to update product',
        error
      });
    }
  };
};
