/**
 * Factory for deleting a supplier product.
 */
module.exports = function makeDeleteProduct({
  sequelize,
  getSupplierByUserId,
  softDeleteProduct
}) {
  return async function handleDeleteProduct(userId, productId) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const deleted = await softDeleteProduct(sequelize, { productId, deletedBy: userId });
    if (!deleted) {
      throw new Error('Product not found or not owned by supplier');
    }

    return { success: true, message: 'Product deleted successfully' };
  };
};
