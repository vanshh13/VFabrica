const { Router } = require('express');

/**
 * Creates buyer router.
 */
module.exports = function createRoutes({
  onboardAction,
  getProfileAction,
  updateProfileAction,
  getMarketplaceProductsAction,
  getProductDetailsForBuyerAction,
  getRecommendationsAction,
  getSuppliersAction,
  favoritesActions,
  cartActions,
  addressActions,
  checkoutAction,
  getOrdersAction,
  getOrderDetailsAction,
  cancelOrderAction,
  reorderAction,
  requireAuth,
  requireRole
}) {
  const router = Router();

  const isBuyer = [requireAuth, requireRole('BUYER')];

  // Onboarding, Profile & Addresses
  router.post('/onboard', requireAuth, onboardAction);
  router.get('/profile', isBuyer, getProfileAction);
  router.put('/profile', isBuyer, updateProfileAction);
  router.get('/addresses', isBuyer, addressActions.getAddressesAction);
  router.post('/addresses', isBuyer, addressActions.addAddressAction);
  router.delete('/addresses/:id', isBuyer, addressActions.deleteAddressAction);

  // Products & Suppliers Discovery (Public or Buyer)
  router.get('/products', getMarketplaceProductsAction);
  router.get('/products/recommendations', getRecommendationsAction);
  router.get('/products/:id', getProductDetailsForBuyerAction);
  router.get('/suppliers', getSuppliersAction);

  // Favorites Management
  router.get('/favorites', isBuyer, favoritesActions.getFavoritesAction);
  router.post('/favorites/:productId', isBuyer, favoritesActions.addFavoriteAction);
  router.delete('/favorites/:productId', isBuyer, favoritesActions.removeFavoriteAction);

  // Cart Management
  router.get('/cart', isBuyer, cartActions.getCartAction);
  router.post('/cart', isBuyer, cartActions.addToCartAction);
  router.put('/cart', isBuyer, cartActions.updateCartItemAction);
  router.delete('/cart/items/:id', isBuyer, cartActions.removeCartItemAction);
  router.delete('/cart', isBuyer, cartActions.clearCartAction);

  // Checkout & Orders
  router.post('/checkout', isBuyer, checkoutAction);
  router.post('/orders', isBuyer, checkoutAction);
  router.get('/orders', isBuyer, getOrdersAction);
  router.get('/orders/history', isBuyer, getOrdersAction);
  router.get('/orders/:id', isBuyer, getOrderDetailsAction);
  router.put('/orders/:id/cancel', isBuyer, cancelOrderAction);
  router.post('/orders/:id/reorder', isBuyer, reorderAction);

  return router;
};
