/**
 * Factory for getting supplier products.
 */
module.exports = function makeGetProducts({
  sequelize,
  getSupplierByUserId,
  getSupplierProducts,
  getProductImagesByProductIds,
  getProductVariantsByProductIds,
  getSupplierInventorySummary
}) {
  function displayStatus(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') {
      return 'published';
    }
    return normalized || 'draft';
  }

  return async function getProducts(userId, options = {}) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const products = await getSupplierProducts(sequelize, profile.id, options);
    if (!products || products.length === 0) {
      const items = [];
      Object.defineProperty(items, 'pagination', {
        value: { totalItems: 0, page: options.page || 1, limit: options.limit || 10, totalPages: 0 },
        enumerable: false,
        writable: true
      });
      return items;
    }

    const productIds = products.map(p => p.id);
    const [allImages, allVariants] = await Promise.all([
      getProductImagesByProductIds ? getProductImagesByProductIds(sequelize, productIds) : [],
      getProductVariantsByProductIds ? getProductVariantsByProductIds(sequelize, productIds) : []
    ]);
    const inventorySummary = getSupplierInventorySummary ? await getSupplierInventorySummary(sequelize, { supplierId: profile.id, productId: null, productIds }) : [];

    const imagesByProduct = {};
    (allImages || []).forEach(img => {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      imagesByProduct[img.product_id].push(img);
    });

    const variantsByProduct = {};
    (allVariants || []).forEach(v => {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push(v);
    });

    const inventoryByProduct = {};
    (inventorySummary || []).forEach(item => {
      if (!inventoryByProduct[item.product_id]) {
        inventoryByProduct[item.product_id] = { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 };
      }
      inventoryByProduct[item.product_id].totalQuantity += Number(item.total_quantity || 0);
      inventoryByProduct[item.product_id].reservedQuantity += Number(item.reserved_quantity || 0);
      inventoryByProduct[item.product_id].availableQuantity += Number(item.available_quantity || 0);
    });

    const totalItems = products[0]?.total_count !== undefined ? products[0].total_count : products.length;
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || (products.length || 10);
    const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 1;

    const items = products.map(p => {
      const { total_count, ...productData } = p;
      return {
        ...productData,
        status: displayStatus(productData.status),
        primaryImage: (imagesByProduct[p.id] || []).find(image => image.is_primary) || (imagesByProduct[p.id] || [])[0] || null,
        variantsCount: (variantsByProduct[p.id] || []).length,
        inventory: inventoryByProduct[p.id] || { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 },
        images: imagesByProduct[p.id] || [],
        variants: variantsByProduct[p.id] || []
      };
    });

    // Attach pagination metadata
    Object.defineProperty(items, 'pagination', {
      value: { totalItems, page, limit, totalPages },
      enumerable: true,
      writable: true
    });

    return items;
  };
};
