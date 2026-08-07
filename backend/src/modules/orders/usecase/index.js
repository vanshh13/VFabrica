const makeCheckout = require('./checkout');
const makeGetOrders = require('./getOrders');
const makeGetOrderDetails = require('./getOrderDetails');
const makeUpdateStatus = require('./updateStatus');

module.exports = {
  makeCheckout,
  makeGetOrders,
  makeGetOrderDetails,
  makeUpdateStatus
};
