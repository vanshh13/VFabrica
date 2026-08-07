const makeOnboard = require('./onboard');
const makeGetProfile = require('./getProfile');
const makeUpdateProfile = require('./updateProfile');
const makeGetDashboard = require('./getDashboard');
const makeGetProducts = require('./getProducts');
const makeGetProductDetails = require('./getProductDetails');
const makeCreateProduct = require('./createProduct');
const makeUpdateProduct = require('./updateProduct');
const makeDeleteProduct = require('./deleteProduct');
const makeUpdateStock = require('./updateStock');
const makeGetOrders = require('./getOrders');
const makeGetOrderDetails = require('./getOrderDetails');
const makeUpdateOrderStatus = require('./updateOrderStatus');

module.exports = {
  makeOnboard,
  makeGetProfile,
  makeUpdateProfile,
  makeGetDashboard,
  makeGetProducts,
  makeGetProductDetails,
  makeCreateProduct,
  makeUpdateProduct,
  makeDeleteProduct,
  makeUpdateStock,
  makeGetOrders,
  makeGetOrderDetails,
  makeUpdateOrderStatus
};
