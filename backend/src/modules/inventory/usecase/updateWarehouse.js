const { logger } = require('../../../utils/logger');
/**
 * Update warehouse details.
 */
module.exports = function makeUpdateWarehouse({ sequelize, getSupplierProfileIdByUserId, updateWarehouseRecord }) {
  return async function updateWarehouse(userId, warehouseId, { name, addressId, newAddress, contactNumber, isDefault = false }) {
    logger.info({ userId, warehouseId }, 'Usecase: Update warehouse request');
    if (!name) throw new Error('Warehouse name is required');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const result = await updateWarehouseRecord(sequelize, { warehouseId, supplierId, userId, name, addressId, newAddress, contactNumber, isDefault });
    if (!result) throw new Error('Warehouse not found or unauthorized');
    return result;
  };
};
