const { Router } = require('express');

module.exports = function createRoutes({
  getDashboardAction,
  listPendingSuppliersAction,
  reviewSupplierAction,
  listUsersAction,
  updateUserStatusAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  seedMarketplaceDataAction,
  requireAuth,
  requireRole
}) {
  const router = Router();

  router.use(requireAuth, requireRole('ADMIN'));

  router.get('/dashboard', getDashboardAction);
  router.get('/suppliers/pending', listPendingSuppliersAction);
  router.patch('/suppliers/review', reviewSupplierAction);
  router.get('/users', listUsersAction);
  router.patch('/users/status', updateUserStatusAction);
  router.post('/categories', createCategoryAction);
  router.patch('/categories/:categoryId', updateCategoryAction);
  router.delete('/categories/:categoryId', deleteCategoryAction);
  router.post('/seed/sample-data', seedMarketplaceDataAction);

  return router;
};