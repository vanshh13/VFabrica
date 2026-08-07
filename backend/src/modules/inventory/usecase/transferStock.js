const { logger } = require('../../../utils/logger');
/**
 * Transfer stock between warehouses.
 */
module.exports = function makeTransferStock({ sequelize, getSupplierProfileIdByUserId, getWarehouseInventoryById, getWarehouseById, transferStock }) {
  return async function transferStockUsecase(userId, { fromInventoryId, toWarehouseId, quantity }) {
    logger.info({ userId, fromInventoryId, toWarehouseId, quantity }, 'Usecase: Transfer stock request');
    if (!fromInventoryId || !toWarehouseId || !quantity || quantity <= 0) throw new Error('fromInventoryId, toWarehouseId and quantity > 0 are required');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const srcInv = await getWarehouseInventoryById(sequelize, fromInventoryId);
    if (!srcInv) throw new Error('Source inventory record not found');
    if (srcInv.supplier_id !== supplierId) throw new Error('Unauthorized to transfer from this warehouse');
    if (srcInv.available_quantity < quantity) throw new Error(`Insufficient stock. Available: ${srcInv.available_quantity}`);

    const destWarehouse = await getWarehouseById(sequelize, { warehouseId: toWarehouseId, supplierId });
    if (!destWarehouse) throw new Error('Destination warehouse not found or unauthorized');
    if (srcInv.warehouse_id === toWarehouseId) throw new Error('Source and destination warehouse must be different');

    return await transferStock(sequelize, {
      fromInventoryId,
      toWarehouseId,
      productVariantId: srcInv.product_variant_id,
      quantity,
      reorderLevel: srcInv.reorder_level,
      performedBy: userId
    });
  };
};
