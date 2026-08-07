const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const usecases = require('./usecase');
const controllers = require('./controller');
const createRoutes = require('./routes/createRoutes');
const { requireAuth } = require('../../middleware/auth');

// Import inventory lifecycle functions from inventory module
const {
  reserveInventory,
  releaseInventory,
  deductInventory,
  checkAvailability
} = require('../inventory');

// ─── Usecases ─────────────────────────────────────────────────────────
const checkoutUsecase = usecases.makeCheckout({
  sequelize,
  getPendingOrderStatus: dataAccess.getPendingOrderStatus,
  createOrderRecord: dataAccess.createOrderRecord,
  createOrderItemRecord: dataAccess.createOrderItemRecord,
  createOrderStatusHistoryRecord: dataAccess.createOrderStatusHistoryRecord,
  reserveInventory,
  checkAvailability
});

const getOrdersUsecase = usecases.makeGetOrders({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getOrdersList: dataAccess.getOrdersList
});

const getOrderDetailsUsecase = usecases.makeGetOrderDetails({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getOrderById: dataAccess.getOrderById,
  getOrderItems: dataAccess.getOrderItems,
  getOrderStatusHistory: dataAccess.getOrderStatusHistory
});

const updateStatusUsecase = usecases.makeUpdateStatus({
  sequelize,
  getSupplierProfileIdByUserId: dataAccess.getSupplierProfileIdByUserId,
  getOrderById: dataAccess.getOrderById,
  getOrderItems: dataAccess.getOrderItems,
  getOrderStatusByName: dataAccess.getOrderStatusByName,
  updateOrderStatus: dataAccess.updateOrderStatus,
  createOrderStatusHistoryRecord: dataAccess.createOrderStatusHistoryRecord,
  deductInventory,
  releaseInventory
});

// ─── Controllers ──────────────────────────────────────────────────────
const checkoutAction = controllers.makeCheckoutAction(checkoutUsecase);
const getOrdersAction = controllers.makeGetOrdersAction(getOrdersUsecase);
const getOrderDetailsAction = controllers.makeGetOrderDetailsAction(getOrderDetailsUsecase);
const updateStatusAction = controllers.makeUpdateStatusAction(updateStatusUsecase);

// ─── Router ───────────────────────────────────────────────────────────
const ordersRouter = createRoutes({
  authenticate: requireAuth,
  checkoutAction,
  getOrdersAction,
  getOrderDetailsAction,
  updateStatusAction
});

module.exports = {
  ordersRouter,
  checkoutUsecase,
  getOrdersUsecase,
  getOrderDetailsUsecase,
  updateStatusUsecase
};
