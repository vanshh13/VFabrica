const { logger } = require('../../../utils/logger');

// Statuses that trigger inventory deduction (dispatch)
const DISPATCH_STATUSES = ['Dispatched'];
// Statuses that trigger reservation release (cancellation)
const RELEASE_STATUSES = ['Cancelled', 'Rejected'];

/**
 * Factory for updating order status with automatic inventory lifecycle.
 *
 * Dispatched   → deduct inventory (quantity--, reserved_quantity--)
 * Cancelled    → release reservation (reserved_quantity--, available_quantity++)
 * Rejected     → release reservation
 */
module.exports = function makeUpdateStatus({
  sequelize,
  getSupplierProfileIdByUserId,
  getOrderById,
  getOrderItems,
  getOrderStatusByName,
  updateOrderStatus,
  createOrderStatusHistoryRecord,
  deductInventory,
  releaseInventory
}) {
  return async function updateStatus(user, orderId, { statusName, remarks }) {
    logger.info({ userId: user.id, orderId, statusName }, 'Usecase: Update order status request');

    const order = await getOrderById(sequelize, orderId);
    if (!order) throw new Error('Order not found');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, user.id);
    if (order.supplier_id !== supplierId) throw new Error('Unauthorized to update this order status');

    const nextStatus = await getOrderStatusByName(sequelize, statusName);
    if (!nextStatus) throw new Error(`Target order status '${statusName}' not configured in database`);

    const transaction = await sequelize.transaction();
    try {
      const updatedOrder = await updateOrderStatus(sequelize, { orderId, statusId: nextStatus.id });
      await createOrderStatusHistoryRecord(sequelize, {
        orderId,
        statusId: nextStatus.id,
        remarks: remarks || `Order status updated to ${statusName}`,
        changedBy: user.id
      });
      await transaction.commit();

      // ─── Inventory Lifecycle (best-effort, post-commit) ───────────────
      const orderItems = await getOrderItems(sequelize, orderId);

      if (DISPATCH_STATUSES.includes(statusName)) {
        for (const item of orderItems) {
          try {
            await deductInventory(sequelize, {
              productVariantId: item.product_variant_id,
              quantity: item.quantity,
              orderId,
              supplierId
            });
          } catch (err) {
            logger.warn({ orderId, variantId: item.product_variant_id, err: err.message }, 'Inventory deduction failed on dispatch');
          }
        }
      } else if (RELEASE_STATUSES.includes(statusName)) {
        for (const item of orderItems) {
          try {
            await releaseInventory(sequelize, {
              productVariantId: item.product_variant_id,
              quantity: item.quantity,
              orderId,
              supplierId
            });
          } catch (err) {
            logger.warn({ orderId, variantId: item.product_variant_id, err: err.message }, 'Inventory release failed on cancellation');
          }
        }
      }

      logger.info({ orderId, statusName }, 'Usecase: Order status updated');
      return updatedOrder;
    } catch (error) {
      await transaction.rollback();
      logger.error({ orderId, error }, 'Usecase: Order status update failed');
      throw error;
    }
  };
};
