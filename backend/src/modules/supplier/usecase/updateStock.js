/**
 * Factory for updating a product variant inventory stock.
 */
module.exports = function makeUpdateStock({
  sequelize,
  getSupplierByUserId,
  getSupplierWarehouses,
  upsertInventory
}) {
  return async function handleUpdateStock(userId, { variantId, quantity, reorderLevel }) {
    if (!variantId || quantity === undefined) {
      throw new Error('Variant ID and quantity are required');
    }

    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const warehouses = await getSupplierWarehouses(sequelize, profile.id);
    const defaultWarehouse = warehouses.find(w => w.is_default) || warehouses[0];
    if (!defaultWarehouse) {
      throw new Error('No warehouse associated with this supplier profile');
    }

    const inventory = await upsertInventory(sequelize, {
      warehouseId: defaultWarehouse.id,
      variantId,
      quantity,
      reorderLevel: reorderLevel !== undefined ? reorderLevel : 5
    });

    return inventory;
  };
};
