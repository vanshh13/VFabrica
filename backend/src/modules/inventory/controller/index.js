const makeCreateWarehouseAction = require('./create-warehouse-action');
const makeUpdateWarehouseAction = require('./update-warehouse-action');
const makeDeleteWarehouseAction = require('./delete-warehouse-action');
const makeGetWarehousesAction = require('./get-warehouses-action');
const makeGetWarehouseDashboardAction = require('./get-warehouse-dashboard-action');
const makeGetInventoryAction = require('./get-inventory-action');
const makeAssignInventoryAction = require('./assign-inventory-action');
const makeAdjustStockAction = require('./adjust-stock-action');
const makeTransferStockAction = require('./transfer-stock-action');
const makeGetTransactionsAction = require('./get-transactions-action');

module.exports = {
  makeCreateWarehouseAction,
  makeUpdateWarehouseAction,
  makeDeleteWarehouseAction,
  makeGetWarehousesAction,
  makeGetWarehouseDashboardAction,
  makeGetInventoryAction,
  makeAssignInventoryAction,
  makeAdjustStockAction,
  makeTransferStockAction,
  makeGetTransactionsAction
};
