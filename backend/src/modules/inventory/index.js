const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const usecases = require('./usecase');
const controllers = require('./controller');
const createRoutes = require('./routes/createRoutes');
const { requireAuth } = require('../../middleware/auth');

// ─── Usecases ─────────────────────────────────────────────────────────
const createWarehouseUsecase = usecases.makeCreateWarehouse({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  createWarehouseRecord: dataAccess.createWarehouseRecord
});

const updateWarehouseUsecase = usecases.makeUpdateWarehouse({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  updateWarehouseRecord: dataAccess.updateWarehouseRecord
});

const deleteWarehouseUsecase = usecases.makeDeleteWarehouse({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehouseById: dataAccess.getWarehouseById,
  softDeleteWarehouse: dataAccess.softDeleteWarehouse
});

const getWarehousesUsecase = usecases.makeGetWarehouses({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehousesList: dataAccess.getWarehousesList
});

const getWarehouseDashboardUsecase = usecases.makeGetWarehouseDashboard({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehouseDashboardStats: dataAccess.getWarehouseDashboardStats,
  getWarehousesList: dataAccess.getWarehousesList
});

const getInventoryUsecase = usecases.makeGetInventory({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getInventoryList: dataAccess.getInventoryList
});

const assignInventoryUsecase = usecases.makeAssignInventory({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehouseById: dataAccess.getWarehouseById,
  assignInventoryToWarehouse: dataAccess.assignInventoryToWarehouse
});

const adjustStockUsecase = usecases.makeAdjustStock({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehouseInventoryById: dataAccess.getWarehouseInventoryById,
  adjustInventoryStock: dataAccess.adjustInventoryStock
});

const transferStockUsecase = usecases.makeTransferStock({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getWarehouseInventoryById: dataAccess.getWarehouseInventoryById,
  getWarehouseById: dataAccess.getWarehouseById,
  transferStock: dataAccess.transferStock
});

const getTransactionsUsecase = usecases.makeGetTransactions({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getInventoryTransactions: dataAccess.getInventoryTransactions
});

// ─── Controllers ──────────────────────────────────────────────────────
const createWarehouseAction = controllers.makeCreateWarehouseAction(createWarehouseUsecase);
const updateWarehouseAction = controllers.makeUpdateWarehouseAction(updateWarehouseUsecase);
const deleteWarehouseAction = controllers.makeDeleteWarehouseAction(deleteWarehouseUsecase);
const getWarehousesAction = controllers.makeGetWarehousesAction(getWarehousesUsecase);
const getWarehouseDashboardAction = controllers.makeGetWarehouseDashboardAction(getWarehouseDashboardUsecase);
const getInventoryAction = controllers.makeGetInventoryAction(getInventoryUsecase);
const assignInventoryAction = controllers.makeAssignInventoryAction(assignInventoryUsecase);
const adjustStockAction = controllers.makeAdjustStockAction(adjustStockUsecase);
const transferStockAction = controllers.makeTransferStockAction(transferStockUsecase);
const getTransactionsAction = controllers.makeGetTransactionsAction(getTransactionsUsecase);

// ─── Router ───────────────────────────────────────────────────────────
const inventoryRouter = createRoutes({
  authenticate: requireAuth,
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
});

module.exports = {
  inventoryRouter,
  // Export usecases for use in other modules (orders lifecycle)
  assignInventoryUsecase,
  adjustStockUsecase,
  transferStockUsecase,
  reserveInventory: dataAccess.reserveInventory,
  releaseInventory: dataAccess.releaseInventory,
  deductInventory: dataAccess.deductInventory,
  checkAvailability: dataAccess.checkAvailability,
  getOrderItemsForInventory: dataAccess.getOrderItemsForInventory,
  sequelize
};
