/**
 * Factory for getting single product details for buyer.
 */
module.exports = function makeGetProductDetailsForBuyer({
  sequelize,
  getProductByIdForBuyer,
  getProductImages,
  getProductVariants
}) {
  return async function handleGetProductDetails(productId) {
    const product = await getProductByIdForBuyer(sequelize, productId);
    if (!product) {
      throw new Error('Product not found or unavailable');
    }

    const images = await getProductImages(sequelize, productId);
    const variants = await getProductVariants(sequelize, productId);

    return {
      ...product,
      images,
      variants
    };
  };
};
