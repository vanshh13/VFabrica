const makeOnboard = require('./onboard');
const makeGetProfile = require('./getProfile');
const makeUpdateProfile = require('./updateProfile');
const makeCheckout = require('./checkout');
const makeGetOrders = require('./getOrders');
const makeGetOrderDetails = require('./getOrderDetails');

module.exports = {
  makeOnboard,
  makeGetProfile,
  makeUpdateProfile,
  makeCheckout,
  makeGetOrders,
  makeGetOrderDetails
};
