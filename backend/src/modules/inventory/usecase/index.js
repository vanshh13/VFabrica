const makeCreateWarehouse = require('./createWarehouse');
const makeUpdateWarehouse = require('./updateWarehouse');
const makeDeleteWarehouse = require('./deleteWarehouse');
const makeGetWarehouses = require('./getWarehouses');
const makeGetWarehouseDashboard = require('./getWarehouseDashboard');
const makeGetInventory = require('./getInventory');
const makeAssignInventory = require('./assignInventory');
const makeAdjustStock = require('./adjustStock');
const makeTransferStock = require('./transferStock');
const makeGetTransactions = require('./getTransactions');

module.exports = {
  makeCreateWarehouse,
  makeUpdateWarehouse,
  makeDeleteWarehouse,
  makeGetWarehouses,
  makeGetWarehouseDashboard,
  makeGetInventory,
  makeAssignInventory,
  makeAdjustStock,
  makeTransferStock,
  makeGetTransactions
};
