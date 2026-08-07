const { Router } = require('express');

/**
 * Creates categories router.
 */
module.exports = function createRoutes({
  getCategoriesAction,
  getMastersAction
}) {
  const router = Router();

  // Categories and masters routes
  router.get('/', getCategoriesAction);
  router.get('/masters', getMastersAction);

  return router;
};
