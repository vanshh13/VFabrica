const makeOnboardAction = require('./onboard-action');
const makeGetProfileAction = require('./get-profile-action');
const makeUpdateProfileAction = require('./update-profile-action');
const makeCheckoutAction = require('./checkout-action');
const makeGetOrdersAction = require('./get-orders-action');
const makeGetOrderDetailsAction = require('./get-order-details-action');

module.exports = {
  makeOnboardAction,
  makeGetProfileAction,
  makeUpdateProfileAction,
  makeCheckoutAction,
  makeGetOrdersAction,
  makeGetOrderDetailsAction
};
