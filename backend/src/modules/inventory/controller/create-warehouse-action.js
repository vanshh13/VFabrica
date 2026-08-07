const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action to create warehouse.
 */
module.exports = function makeCreateWarehouseAction(createWarehouseUsecase) {
  return async function createWarehouseAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Create warehouse request received');

    try {
      const { name, addressId, newAddress, contactNumber, isDefault } = req.body;
      const result = await createWarehouseUsecase(userId, { name, addressId, newAddress, contactNumber, isDefault });
      logger.info({ userId, warehouseId: result.id }, 'Controller: Create warehouse success');
      return successResponse(res, {
        statusCode: 201,
        message: 'Warehouse created successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Create warehouse failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to create warehouse',
        error
      });
    }
  };
};
