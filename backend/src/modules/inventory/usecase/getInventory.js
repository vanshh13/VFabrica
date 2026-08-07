const { logger } = require('../../../utils/logger');

/**
 * Usecase factory to list inventory items.
 */
module.exports = function makeGetInventory({
  sequelize,
  getSupplierProfileIdByUserId,
  getInventoryList
}) {
  return async function getInventory(userId, { limit = 20, offset = 0, filter = [], sort = [], search = '', lowStockOnly = false }) {
    logger.info({ userId, lowStockOnly }, 'Usecase: Get inventory list request received');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) {
      throw new Error('Supplier profile not found');
    }

    return await getInventoryList(sequelize, {
      supplierId,
      limit,
      offset,
      filter,
      sort,
      search,
      lowStockOnly
    });
  };
};
