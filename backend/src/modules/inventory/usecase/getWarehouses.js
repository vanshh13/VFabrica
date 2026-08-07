const { logger } = require('../../../utils/logger');

/**
 * Usecase factory to list warehouses.
 */
module.exports = function makeGetWarehouses({
  sequelize,
  getSupplierProfileIdByUserId,
  getWarehousesList
}) {
  return async function getWarehouses(userId) {
    logger.info({ userId }, 'Usecase: Get warehouses request received');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) {
      throw new Error('Supplier profile not found');
    }

    return await getWarehousesList(sequelize, supplierId);
  };
};
