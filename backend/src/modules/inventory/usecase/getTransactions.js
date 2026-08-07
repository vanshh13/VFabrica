const { logger } = require('../../../utils/logger');
/**
 * Get inventory transaction history.
 */
module.exports = function makeGetTransactions({ sequelize, getSupplierProfileIdByUserId, getInventoryTransactions }) {
  return async function getTransactions(userId, { warehouseId, inventoryId, limit = 20, offset = 0 }) {
    logger.info({ userId }, 'Usecase: Get inventory transactions request');
    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    return await getInventoryTransactions(sequelize, { supplierId, warehouseId, inventoryId, limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
  };
};
