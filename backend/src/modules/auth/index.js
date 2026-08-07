const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import database instance
const { sequelize } = require('../../../models');

// Import data-access queries
const dataAccess = require('./data-access');

// Import usecase factories
const {
  makeRegister,
  makeLogin,
  makeRefreshToken,
  makeLogout,
  makeGetUserProfile
} = require('./usecase');

// Import controller factories
const {
  makeRegisterAction,
  makeLoginAction,
  makeRefreshTokenAction,
  makeLogoutAction,
  makeGetUserProfileAction
} = require('./controller');

// Import routes factory
const createRoutes = require('./routes');

// Import middleware
const { requireAuth } = require('../../middleware/auth');

// Environment variables
const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || !jwtRefreshSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables must be defined in production!');
  }
}

// Instantiate usecases (Injecting sequelize and raw data-access query functions)
const registerUsecase = makeRegister({
  sequelize,
  createUser: dataAccess.createUser,
  getUserByEmail: dataAccess.getUserByEmail,
  getRoleByName: dataAccess.getRoleByName,
  assignUserRole: dataAccess.assignUserRole,
  bcrypt
});

const loginUsecase = makeLogin({
  sequelize,
  getUserByEmail: dataAccess.getUserByEmail,
  getUserRoles: dataAccess.getUserRoles,
  getUserPermissions: dataAccess.getUserPermissions,
  createRefreshToken: dataAccess.createRefreshToken,
  bcrypt,
  jwt,
  jwtSecret,
  jwtRefreshSecret
});

const refreshTokenUsecase = makeRefreshToken({
  sequelize,
  getRefreshToken: dataAccess.getRefreshToken,
  getUserById: dataAccess.getUserById,
  getUserRoles: dataAccess.getUserRoles,
  getUserPermissions: dataAccess.getUserPermissions,
  jwt,
  jwtSecret,
  jwtRefreshSecret
});

const logoutUsecase = makeLogout({
  sequelize,
  revokeRefreshToken: dataAccess.revokeRefreshToken
});

const getUserProfileUsecase = makeGetUserProfile({
  sequelize,
  getUserById: dataAccess.getUserById,
  getUserRoles: dataAccess.getUserRoles,
  getUserPermissions: dataAccess.getUserPermissions
});

// Instantiate controllers (Injecting usecases)
const registerAction = makeRegisterAction(registerUsecase);
const loginAction = makeLoginAction(loginUsecase);
const refreshTokenAction = makeRefreshTokenAction(refreshTokenUsecase);
const logoutAction = makeLogoutAction(logoutUsecase);
const getUserProfileAction = makeGetUserProfileAction(getUserProfileUsecase);

// Instantiate router
const authRouter = createRoutes({
  registerAction,
  loginAction,
  refreshTokenAction,
  logoutAction,
  getUserProfileAction,
  requireAuth
});

module.exports = {
  authRouter,
  // Expose usecases or helpers for other modules if needed
  registerUsecase,
  loginUsecase,
  getUserProfileUsecase
};
