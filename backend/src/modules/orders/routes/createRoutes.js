const express = require('express');

/**
 * Build Express Router for orders.
 */
module.exports = function createOrdersRouter({
  authenticate,
  checkoutAction,
  getOrdersAction,
  getOrderDetailsAction,
  updateStatusAction
}) {
  const router = express.Router();

  // Placing order / checkout (Buyer role only check can be done at controller or usecase)
  router.post('/', authenticate, checkoutAction);

  // List order history (Buyer or Supplier roles handled in usecase)
  router.get('/', authenticate, getOrdersAction);

  // Retrieve single order details
  router.get('/:id', authenticate, getOrderDetailsAction);

  // Update order status (Supplier role check handled in usecase)
  router.patch('/:id/status', authenticate, updateStatusAction);

  return router;
};
