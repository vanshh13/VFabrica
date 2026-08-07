const makeGetDashboardAction = require('./getDashboard-action');
const makeListPendingSuppliersAction = require('./listPendingSuppliers-action');
const makeReviewSupplierAction = require('./reviewSupplier-action');
const makeListUsersAction = require('./listUsers-action');
const makeUpdateUserStatusAction = require('./updateUserStatus-action');
const makeCreateCategoryAction = require('./createCategory-action');
const makeUpdateCategoryAction = require('./updateCategory-action');
const makeDeleteCategoryAction = require('./deleteCategory-action');
const makeSeedMarketplaceDataAction = require('./seedMarketplaceData-action');

module.exports = {
  makeGetDashboardAction,
  makeListPendingSuppliersAction,
  makeReviewSupplierAction,
  makeListUsersAction,
  makeUpdateUserStatusAction,
  makeCreateCategoryAction,
  makeUpdateCategoryAction,
  makeDeleteCategoryAction,
  makeSeedMarketplaceDataAction
};