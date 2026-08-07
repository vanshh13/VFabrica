/**
 * Factory for getting buyer order details.
 */
module.exports = function makeGetOrderDetails({
  sequelize,
  getBuyerOrderById,
  getBuyerOrderItems
}) {
  return async function getOrderDetails(userId, orderId) {
    const order = await getBuyerOrderById(sequelize, orderId, userId);
    if (!order) {
      throw new Error('Order not found or access unauthorized');
    }

    const items = await getBuyerOrderItems(sequelize, orderId);

    return {
      order,
      items
    };
  };
};
