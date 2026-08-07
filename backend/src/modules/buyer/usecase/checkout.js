const { broadcast } = require('../../../utils/websocket');

/**
 * Factory for buyer checkout usecase.
 */
module.exports = function makeCheckout({
  sequelize,
  getBuyerByUserId,
  createAddress,
  linkBuyerAddress,
  getPendingOrderStatus,
  createOrder,
  createOrderItem,
  createOrderStatusHistory,
  reserveInventory,
  clearCart
}) {
  return async function checkout(userId, {
    supplierId,
    billingAddressId,
    shippingAddressId,
    billingAddress,
    shippingAddress,
    subtotal,
    discount = 0,
    tax = 0,
    shippingCharge = 0,
    grandTotal,
    items
  }) {
    if (!items || items.length === 0) {
      throw new Error('Order items are required');
    }

    const profile = await getBuyerByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Buyer profile not found. Please complete onboarding first.');
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Resolve Billing & Shipping Addresses
      let finalBillingId = billingAddressId;
      let finalShippingId = shippingAddressId;

      if (!finalBillingId && billingAddress) {
        const addr = await createAddress(sequelize, {
          userId,
          addressLine1: billingAddress.addressLine1,
          landmark: billingAddress.landmark,
          zipcode: billingAddress.zipcode,
          cityId: billingAddress.cityId,
          addressType: 'Billing'
        });
        await linkBuyerAddress(sequelize, {
          buyerProfileId: profile.id,
          addressId: addr.id,
          addressType: 'Billing',
          isPrimary: false
        });
        finalBillingId = addr.id;
      }

      if (!finalShippingId && shippingAddress) {
        const addr = await createAddress(sequelize, {
          userId,
          addressLine1: shippingAddress.addressLine1,
          landmark: shippingAddress.landmark,
          zipcode: shippingAddress.zipcode,
          cityId: shippingAddress.cityId,
          addressType: 'Shipping'
        });
        await linkBuyerAddress(sequelize, {
          buyerProfileId: profile.id,
          addressId: addr.id,
          addressType: 'Shipping',
          isPrimary: false
        });
        finalShippingId = addr.id;
      }

      // Fallback billing/shipping ID cross-assignment
      if (!finalBillingId && finalShippingId) finalBillingId = finalShippingId;
      if (!finalShippingId && finalBillingId) finalShippingId = finalBillingId;

      // 2. Resolve Items, Variants, and Supplier IDs
      const resolvedItems = [];
      let effectiveSupplierId = supplierId;

      for (const item of items) {
        const targetId = item.productVariantId || item.variantId || item.productId;
        let resolvedVariantId = item.productVariantId || item.variantId;
        let itemSupplierId = item.supplierId || effectiveSupplierId;

        if (targetId) {
          const res = await sequelize.query(
            `SELECT pv."id" as "variant_id", p."supplier_id"
             FROM "products" p
             LEFT JOIN "product_variants" pv ON p."id" = pv."product_id"
             WHERE (pv."id" = :targetId OR p."id" = :targetId) AND p."is_deleted" = FALSE
             ORDER BY pv."created_at" ASC
             LIMIT 1;`,
            { replacements: { targetId }, type: 'SELECT', transaction }
          );

          if (res && res[0]) {
            if (!resolvedVariantId && res[0].variant_id) {
              resolvedVariantId = res[0].variant_id;
            }
            if (!itemSupplierId && res[0].supplier_id) {
              itemSupplierId = res[0].supplier_id;
            }
          }

          // Auto-create default variant if product exists without variant
          if (!resolvedVariantId) {
            const prodRes = await sequelize.query(
              `SELECT p."id", p."supplier_id" FROM "products" p WHERE p."id" = :targetId LIMIT 1;`,
              { replacements: { targetId }, type: 'SELECT', transaction }
            );
            if (prodRes && prodRes[0]) {
              if (!itemSupplierId) itemSupplierId = prodRes[0].supplier_id;
              const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const newPv = await sequelize.query(
                `INSERT INTO "product_variants" ("product_id", "sku", "status", "created_at", "updated_at")
                 VALUES (:productId, :sku, 'active', NOW(), NOW())
                 RETURNING "id";`,
                { replacements: { productId: prodRes[0].id, sku }, type: 'INSERT', transaction }
              );
              resolvedVariantId = (Array.isArray(newPv[0]) ? newPv[0][0]?.id : newPv[0]?.id) || newPv.id;
            }
          }
        }

        if (!effectiveSupplierId && itemSupplierId) {
          effectiveSupplierId = itemSupplierId;
        }

        resolvedItems.push({
          ...item,
          variantId: resolvedVariantId,
          supplierId: itemSupplierId
        });
      }

      if (!effectiveSupplierId) {
        throw new Error('Unable to determine supplier for order');
      }

      // 3. Fetch Pending status & Generate Order Number
      const pendingStatus = await getPendingOrderStatus(sequelize);
      if (!pendingStatus) {
        throw new Error('Default order status (Pending) not configured in master database');
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Compute Totals & Create Order Record
      const effectiveSubtotal = Number(subtotal) || resolvedItems.reduce((s, i) => s + (Number(i.quantity || 1) * Number(i.unitPrice || i.price || 0)), 0);
      const effectiveDiscount = Number(discount) || 0;
      const effectiveTax = Number(tax) || 0;
      const effectiveShippingCharge = Number(shippingCharge) || 0;
      const effectiveGrandTotal = (grandTotal !== undefined && grandTotal !== null && Number(grandTotal) > 0)
        ? Number(grandTotal)
        : (effectiveSubtotal + effectiveTax + effectiveShippingCharge - effectiveDiscount);

      const order = await createOrder(sequelize, {
        orderNumber,
        buyerId: userId,
        supplierId: effectiveSupplierId,
        billingAddressId: finalBillingId,
        shippingAddressId: finalShippingId,
        subtotal: effectiveSubtotal,
        discount: effectiveDiscount,
        tax: effectiveTax,
        shippingCharge: effectiveShippingCharge,
        grandTotal: effectiveGrandTotal,
        orderStatusId: pendingStatus.id
      });

      // 5. Create Order Items & Reserve Inventory
      const savedItems = [];
      for (const item of resolvedItems) {
        const variantId = item.variantId;
        const unitPrice = item.unitPrice || item.price || 0;
        const qty = item.quantity || 1;

        if (variantId) {
          const orderItem = await createOrderItem(sequelize, {
            orderId: order.id,
            productVariantId: variantId,
            quantity: qty,
            unitPrice,
            totalPrice: qty * unitPrice
          });
          savedItems.push(orderItem);

          // Multi-warehouse Inventory Reservation
          if (reserveInventory) {
            await reserveInventory(sequelize, {
              productVariantId: variantId,
              quantity: qty,
              orderId: order.id,
              supplierId: effectiveSupplierId,
              transaction
            });
          }
        }
      }

      // 6. Record Status History
      await createOrderStatusHistory(sequelize, {
        orderId: order.id,
        statusId: pendingStatus.id,
        remarks: 'Order placed successfully by buyer',
        changedBy: userId
      });

      // 7. Clear Cart if clearCart function supplied
      if (clearCart) {
        await clearCart(sequelize, userId, transaction);
      }

      await transaction.commit();
      broadcast('ORDER_UPDATED', { action: 'CREATED', orderId: order.id, supplierId: effectiveSupplierId, buyerId: userId });
      broadcast('INVENTORY_UPDATED', { action: 'CHECKOUT', supplierId: effectiveSupplierId });

      return {
        order,
        items: savedItems
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
};
