const { logger } = require('../../../utils/logger');

/**
 * Factory for order checkout usecase.
 * On checkout: inventory is RESERVED (not deducted).
 */
module.exports = function makeCheckout({
  sequelize,
  getPendingOrderStatus,
  createOrderRecord,
  createOrderItemRecord,
  createOrderStatusHistoryRecord,
  reserveInventory,
  checkAvailability
}) {
  return async function checkout(userId, {
    supplierId,
    billingAddressId,
    shippingAddressId,
    subtotal,
    discount = 0,
    tax = 0,
    shippingCharge = 0,
    grandTotal,
    items
  }) {
    logger.info({ userId, supplierId, itemCount: items?.length }, 'Usecase: Starting order checkout');

    if (!supplierId || !items || items.length === 0) {
      throw new Error('Supplier and order items are required');
    }

    // 1. Pre-check availability for all items
    for (const item of items) {
      const avail = await checkAvailability(sequelize, {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        supplierId
      });
      if (!avail.sufficient) {
        throw new Error(`Insufficient stock for variant ${item.productVariantId}. Available: ${avail.available}, Requested: ${item.quantity}`);
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const pendingStatus = await getPendingOrderStatus(sequelize);
      if (!pendingStatus) throw new Error('Default order status (Pending) not configured');

      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const order = await createOrderRecord(sequelize, {
        orderNumber, buyerId: userId, supplierId,
        billingAddressId, shippingAddressId,
        subtotal, discount, tax, shippingCharge, grandTotal,
        orderStatusId: pendingStatus.id
      });

      const savedItems = [];
      for (const item of items) {
        const orderItem = await createOrderItemRecord(sequelize, {
          orderId: order.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        });
        savedItems.push(orderItem);
      }

      await createOrderStatusHistoryRecord(sequelize, {
        orderId: order.id,
        statusId: pendingStatus.id,
        remarks: 'Order placed by buyer',
        changedBy: userId
      });

      await transaction.commit();

      // 2. Reserve inventory AFTER order is committed (best-effort; fail gracefully)
      const reservationErrors = [];
      for (const item of items) {
        try {
          await reserveInventory(sequelize, {
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            orderId: order.id,
            supplierId
          });
        } catch (err) {
          reservationErrors.push({ variantId: item.productVariantId, error: err.message });
          logger.warn({ orderId: order.id, variantId: item.productVariantId, error: err.message }, 'Inventory reservation failed post-checkout');
        }
      }

      logger.info({ orderId: order.id, orderNumber, reservationErrors }, 'Usecase: Order checkout completed');
      return { order, items: savedItems, reservationErrors };
    } catch (error) {
      await transaction.rollback();
      logger.error({ userId, error }, 'Usecase: Order checkout failed');
      throw error;
    }
  };
};
