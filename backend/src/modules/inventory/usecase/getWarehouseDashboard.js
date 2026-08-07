const { logger } = require('../../../utils/logger');
/**
 * Get warehouse dashboard stats.
 */
module.exports = function makeGetWarehouseDashboard({ sequelize, getSupplierProfileIdByUserId, getWarehouseDashboardStats, getWarehousesList }) {
  return async function getWarehouseDashboard(userId) {
    logger.info({ userId }, 'Usecase: Get warehouse dashboard request');
    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const [stats, warehouses] = await Promise.all([
      getWarehouseDashboardStats(sequelize, supplierId),
      getWarehousesList(sequelize, supplierId)
    ]);

    return { stats, warehouses };
  };
};
