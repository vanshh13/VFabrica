const { logger } = require('../../../utils/logger');

/**
 * Usecase factory to adjust inventory stock.
 */
module.exports = function makeAdjustStock({
  sequelize,
  getSupplierProfileIdByUserId,
  getWarehouseInventoryById,
  adjustInventoryStock
}) {
  return async function adjustStock(userId, { inventoryId, quantityDelta, transactionType = 'ADJUSTMENT', referenceType, referenceId, remarks, performedBy }) {
    logger.info({ userId, inventoryId, quantityDelta }, 'Usecase: Adjust inventory stock request received');

    const supplierId = await getSupplierProfileIdByUserId(sequelize, userId);
    if (!supplierId) throw new Error('Supplier profile not found');

    const inventory = await getWarehouseInventoryById(sequelize, inventoryId);
    if (!inventory) throw new Error('Warehouse inventory item not found');
    if (inventory.supplier_id !== supplierId) throw new Error('Unauthorized to adjust this warehouse inventory');

    return await adjustInventoryStock(sequelize, {
      inventoryId,
      quantityDelta,
      transactionType,
      referenceType,
      referenceId,
      remarks,
      performedBy: performedBy || userId
    });
  };
};
