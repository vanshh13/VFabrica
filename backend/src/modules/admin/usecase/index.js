const makeGetDashboard = require('./getDashboard');
const makeListPendingSuppliers = require('./listPendingSuppliers');
const makeReviewSupplier = require('./reviewSupplier');
const makeListUsers = require('./listUsers');
const makeUpdateUserStatus = require('./updateUserStatus');
const makeCreateCategory = require('./createCategory');
const makeUpdateCategory = require('./updateCategory');
const makeDeleteCategory = require('./deleteCategory');
const makeSeedMarketplaceData = require('./seedMarketplaceData');

module.exports = {
  makeGetDashboard,
  makeListPendingSuppliers,
  makeReviewSupplier,
  makeListUsers,
  makeUpdateUserStatus,
  makeCreateCategory,
  makeUpdateCategory,
  makeDeleteCategory,
  makeSeedMarketplaceData
};