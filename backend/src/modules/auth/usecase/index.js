const makeRegister = require('./register');
const makeLogin = require('./login');
const makeRefreshToken = require('./refreshToken');
const makeLogout = require('./logout');
const makeGetUserProfile = require('./getUserProfile');

module.exports = {
  makeRegister,
  makeLogin,
  makeRefreshToken,
  makeLogout,
  makeGetUserProfile
};
