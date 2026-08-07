const { logger } = require('../../../utils/logger');

/**
 * Factory for getting order details.
 */
module.exports = function makeGetOrderDetails({
  sequelize,
  getSupplierProfileIdByUserId,
  getOrderById,
  getOrderItems,
  getOrderStatusHistory
}) {
  return async function getOrderDetails(user, orderId) {
    logger.info({ userId: user.id, orderId }, 'Usecase: Get order details request received');

    const order = await getOrderById(sequelize, orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Authorization check
    if (user.role === 'SUPPLIER') {
      const supplierId = await getSupplierProfileIdByUserId(sequelize, user.id);
      if (order.supplier_id !== supplierId) {
        throw new Error('Unauthorized to view this order');
      }
    } else {
      // BUYER check
      if (order.buyer_id !== user.id) {
        throw new Error('Unauthorized to view this order');
      }
    }

    const items = await getOrderItems(sequelize, orderId);
    const history = await getOrderStatusHistory(sequelize, orderId);

    return {
      order,
      items,
      history
    };
  };
};
