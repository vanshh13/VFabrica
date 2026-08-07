const makeRegisterAction = require('./register-action');
const makeLoginAction = require('./login-action');
const makeRefreshTokenAction = require('./refresh-token-action');
const makeLogoutAction = require('./logout-action');
const makeGetUserProfileAction = require('./get-user-profile-action');

module.exports = {
  makeRegisterAction,
  makeLoginAction,
  makeRefreshTokenAction,
  makeLogoutAction,
  makeGetUserProfileAction
};
