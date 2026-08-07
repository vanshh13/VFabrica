/**
 * Factory for getting order details.
 */
module.exports = function makeGetOrderDetails({
  sequelize,
  getSupplierByUserId,
  getOrderById,
  getOrderItems
}) {
  return async function getOrderDetails(userId, orderId) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const order = await getOrderById(sequelize, orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.supplier_id !== profile.id) {
      throw new Error('Unauthorized access to this order');
    }

    const items = await getOrderItems(sequelize, orderId);

    return {
      order,
      items
    };
  };
};
