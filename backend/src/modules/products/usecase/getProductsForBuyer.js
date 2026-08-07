/**
 * Factory for getting products for buyer with filters.
 */
module.exports = function makeGetProductsForBuyer({
  sequelize,
  getProductsForBuyer,
  getProductImages,
  getProductVariants
}) {
  return async function handleGetProducts(filters) {
    const products = await getProductsForBuyer(sequelize, filters);
    
    // Attach images and variants to each product
    const detailedProducts = await Promise.all(
      products.map(async (product) => {
        const images = await getProductImages(sequelize, product.id);
        const variants = await getProductVariants(sequelize, product.id);
        return {
          ...product,
          images,
          variants
        };
      })
    );

    return detailedProducts;
  };
};
