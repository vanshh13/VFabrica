const { logger } = require('../../../utils/logger');
/**
 * Soft-delete a warehouse.
 */
module.exports = function makeDeleteWarehouse({ sequelize, getSupplierProfileIdByUserId, getWarehouseById, softDeleteWarehouse }) {
  return async function deleteWarehouse(userId, warehouseId) {
    logger.info({ userId, warehouseId }, 'Usecase: Delete warehouse request');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const warehouse = await getWarehouseById(sequelize, { warehouseId, supplierId });
    if (!warehouse) throw new Error('Warehouse not found or unauthorized');

    return await softDeleteWarehouse(sequelize, { warehouseId, supplierId });
  };
};
