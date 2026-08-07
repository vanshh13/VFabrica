const { Router } = require('express');

/**
 * Creates auth router.
 * @param {object} dependencies
 * @param {Function} dependencies.registerAction
 * @param {Function} dependencies.loginAction
 * @param {Function} dependencies.refreshTokenAction
 * @param {Function} dependencies.logoutAction
 * @param {Function} dependencies.getUserProfileAction
 * @param {Function} dependencies.requireAuth
 */
module.exports = function createRoutes({
  registerAction,
  loginAction,
  refreshTokenAction,
  logoutAction,
  getUserProfileAction,
  requireAuth
}) {
  const router = Router();

  router.post('/register', registerAction);
  router.post('/login', loginAction);
  router.post('/refresh-token', refreshTokenAction);
  router.post('/logout', logoutAction);
  router.get('/me', requireAuth, getUserProfileAction);

  return router;
};
