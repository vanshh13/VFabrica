const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for creating a product.
 */
module.exports = function makeCreateProductAction(createProductUsecase) {
  return async function createProductAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Create product request received');

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

      const result = await createProductUsecase(userId, {
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

      const productId = result?.id || result?.product?.id;
      logger.info({ userId, productId }, 'Controller: Create product success');
      return successResponse(res, {
        statusCode: 201,
        message: 'Product created successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Create product failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to create product',
        error
      });
    }
  };
};
