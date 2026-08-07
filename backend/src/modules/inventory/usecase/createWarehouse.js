const { logger } = require('../../../utils/logger');

/**
 * Usecase factory to create warehouse.
 */
module.exports = function makeCreateWarehouse({
  sequelize,
  getSupplierProfileIdByUserId,
  createWarehouseRecord
}) {
  return async function createWarehouse(userId, { name, addressId, newAddress, contactNumber, isDefault = false }) {
    logger.info({ userId, name }, 'Usecase: Create warehouse request received');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) {
      throw new Error('Supplier profile not found. Complete onboarding first.');
    }

    if (!name) {
      throw new Error('Warehouse name is required');
    }

    return await createWarehouseRecord(sequelize, {
      supplierId,
      userId,
      name,
      addressId,
      newAddress,
      contactNumber,
      isDefault
    });
  };
};
