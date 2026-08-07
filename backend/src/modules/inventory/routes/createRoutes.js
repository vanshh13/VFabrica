const express = require('express');

/**
 * Build Express Router for complete inventory & warehouse management.
 */
module.exports = function createInventoryRouter({
  authenticate,
  createWarehouseAction,
  updateWarehouseAction,
  deleteWarehouseAction,
  getWarehousesAction,
  getWarehouseDashboardAction,
  getInventoryAction,
  assignInventoryAction,
  adjustStockAction,
  transferStockAction,
  getTransactionsAction
}) {
  const router = express.Router();

  // ─── Warehouse Endpoints ──────────────────────────────────────────
  router.get('/warehouses/dashboard', authenticate, getWarehouseDashboardAction);
  router.get('/warehouses', authenticate, getWarehousesAction);
  router.post('/warehouses', authenticate, createWarehouseAction);
  router.put('/warehouses/:warehouseId', authenticate, updateWarehouseAction);
  router.delete('/warehouses/:warehouseId', authenticate, deleteWarehouseAction);

  // ─── Inventory Endpoints ──────────────────────────────────────────
  router.get('/', authenticate, getInventoryAction);
  router.post('/assign', authenticate, assignInventoryAction);
  router.patch('/stock', authenticate, adjustStockAction);
  router.post('/transfer', authenticate, transferStockAction);

  // ─── Transaction History ──────────────────────────────────────────
  router.get('/transactions', authenticate, getTransactionsAction);

  return router;
};
