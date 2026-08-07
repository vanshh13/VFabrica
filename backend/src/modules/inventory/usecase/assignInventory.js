const { logger } = require('../../../utils/logger');
/**
 * Assign inventory to a warehouse for a given product variant.
 */
module.exports = function makeAssignInventory({ sequelize, getSupplierProfileIdByUserId, getWarehouseById, assignInventoryToWarehouse }) {
  return async function assignInventory(userId, { warehouseId, productVariantId, quantity, reorderLevel = 10 }) {
    logger.info({ userId, warehouseId, productVariantId, quantity }, 'Usecase: Assign inventory request');
    if (!warehouseId || !productVariantId || quantity === undefined) throw new Error('warehouseId, productVariantId and quantity are required');
    if (quantity < 0) throw new Error('Quantity cannot be negative');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const warehouse = await getWarehouseById(sequelize, { warehouseId, supplierId });
    if (!warehouse) throw new Error('Warehouse not found or unauthorized');

    return await assignInventoryToWarehouse(sequelize, { warehouseId, productVariantId, quantity, reorderLevel, performedBy: userId });
  };
};
