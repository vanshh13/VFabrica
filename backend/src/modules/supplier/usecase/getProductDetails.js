function displayStatus(status) {
  if (!status) {
    return status;
  }

  const normalized = String(status).toLowerCase();
  if (normalized === 'active') {
    return 'published';
  }
  return normalized;
}

/**
 * Factory for getting a single supplier product with complete management data.
 */
module.exports = function makeGetProductDetails({
  sequelize,
  getSupplierByUserId,
  getSupplierProductById,
  getSupplierProductImages,
  getSupplierProductVariants,
  getSupplierVariantAttributes,
  getSupplierInventorySummary
}) {
  return async function handleGetProductDetails(userId, productId) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const product = await getSupplierProductById(sequelize, { supplierId: profile.id, productId });
    if (!product) {
      throw new Error('Product not found or not owned by supplier');
    }

    const [images, variants, inventorySummary] = await Promise.all([
      getSupplierProductImages(sequelize, { supplierId: profile.id, productId }),
      getSupplierProductVariants(sequelize, { supplierId: profile.id, productId }),
      getSupplierInventorySummary(sequelize, { supplierId: profile.id, productId })
    ]);

    const variantIds = (variants || []).map(variant => variant.id);
    const attributeValues = await getSupplierVariantAttributes(sequelize, variantIds);
    const attributesByVariant = {};
    (attributeValues || []).forEach(row => {
      if (!attributesByVariant[row.product_variant_id]) {
        attributesByVariant[row.product_variant_id] = [];
      }
      attributesByVariant[row.product_variant_id].push(row);
    });

    const inventoryByVariant = {};
    (inventorySummary || []).forEach(item => {
      inventoryByVariant[item.product_variant_id] = {
        totalQuantity: Number(item.total_quantity || 0),
        reservedQuantity: Number(item.reserved_quantity || 0),
        availableQuantity: Number(item.available_quantity || 0)
      };
    });

    return {
      ...product,
      status: displayStatus(product.status),
      images,
      variants: (variants || []).map(variant => ({
        ...variant,
        status: displayStatus(variant.status),
        inventory: inventoryByVariant[variant.id] || { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 },
        attributes: attributesByVariant[variant.id] || []
      }))
    };
  };
};
