const { Router } = require('express');

/**
 * Creates buyer product router.
 */
module.exports = function createRoutes({
  getProductsForBuyerAction,
  getProductDetailsForBuyerAction,
  requireAuth
}) {
  const router = Router();

  // Buyer browsing routes
  router.get('/', getProductsForBuyerAction);
  router.post('/', getProductsForBuyerAction);
  router.post('/search', getProductsForBuyerAction);
  router.get('/:id', getProductDetailsForBuyerAction);

  return router;
};
