const { broadcast } = require('../../../utils/websocket');

/**
 * Factory for updating order status.
 */
module.exports = function makeUpdateOrderStatus({
  sequelize,
  getSupplierByUserId,
  getOrderById,
  getOrderStatusByName,
  updateOrderStatus,
  createOrderStatusHistory
}) {
  return async function handleUpdateOrderStatus(userId, orderId, { statusName, status, remarks }) {
    const targetStatusName = statusName || status;
    if (!targetStatusName) {
      throw new Error('Status name is required');
    }

    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const order = await getOrderById(sequelize, orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.supplier_id && order.supplier_id !== profile.id) {
      throw new Error('Unauthorized access to this order');
    }

    const statusObj = await getOrderStatusByName(sequelize, targetStatusName);
    if (!statusObj) {
      throw new Error(`Invalid status: '${targetStatusName}'`);
    }

    const transaction = await sequelize.transaction();
    try {
      const updatedOrder = await updateOrderStatus(sequelize, {
        orderId,
        statusId: statusObj.id
      });

      await createOrderStatusHistory(sequelize, {
        orderId,
        statusId: statusObj.id,
        remarks: remarks || `Order status updated to ${statusObj.name}`,
        changedBy: userId
      });

      await transaction.commit();
      broadcast('ORDER_UPDATED', { action: 'STATUS_CHANGE', orderId, supplierId: profile.id, status: statusObj.name });

      return {
        ...updatedOrder,
        status: statusObj.name
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
};
