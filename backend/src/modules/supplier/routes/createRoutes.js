const { Router } = require('express');

/**
 * Creates supplier router.
 */
module.exports = function createRoutes({
  onboardAction,
  getProfileAction,
  updateProfileAction,
  getDashboardAction,
  getProductsAction,
  getProductDetailsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  updateStockAction,
  getOrdersAction,
  getOrderDetailsAction,
  updateOrderStatusAction,
  requireAuth,
  requireRole
}) {
  const router = Router();

  const isSupplier = [requireAuth, requireRole('SUPPLIER')];

  router.post('/onboard', requireAuth, onboardAction);
  router.get('/profile', isSupplier, getProfileAction);
  router.put('/profile', isSupplier, updateProfileAction);
  router.get('/dashboard', isSupplier, getDashboardAction);
  router.get('/products', isSupplier, getProductsAction);
  router.get('/products/:id', isSupplier, getProductDetailsAction);
  router.post('/products/query', isSupplier, getProductsAction);
  router.post('/products/search', isSupplier, getProductsAction);
  router.post('/products', isSupplier, createProductAction);
  router.put('/products/:id', isSupplier, updateProductAction);
  router.put('/products/:id/status', isSupplier, updateProductAction);
  router.delete('/products/:id', isSupplier, deleteProductAction);
  router.patch('/products/stock', isSupplier, updateStockAction);
  router.get('/orders', isSupplier, getOrdersAction);
  router.post('/orders', isSupplier, getOrdersAction);
  router.get('/orders/:id', isSupplier, getOrderDetailsAction);
  router.patch('/orders/:id/status', isSupplier, updateOrderStatusAction);

  return router;
};
