const { logger } = require('../../../utils/logger');

/**
 * Factory for getting order history.
 */
module.exports = function makeGetOrders({
  sequelize,
  getSupplierProfileIdByUserId,
  getOrdersList
}) {
  return async function getOrders(user, { limit = 20, offset = 0, filter = [], sort = [], search = '' }) {
    const userId = user.id;
    const userRole = user.role; // e.g. BUYER, SUPPLIER

    logger.info({ userId, userRole }, 'Usecase: Get orders list request received');

    if (userRole === 'SUPPLIER') {
      const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
      if (!supplierId) {
        throw new Error('Supplier profile not found');
      }
      return await getOrdersList(sequelize, {
        supplierId,
        limit,
        offset,
        filter,
        sort,
        search
      });
    } else {
      // Default to Buyer role
      return await getOrdersList(sequelize, {
        userId,
        limit,
        offset,
        filter,
        sort,
        search
      });
    }
  };
};
