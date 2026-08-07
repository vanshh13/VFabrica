/**
 * Factory for logout usecase.
 * @param {object} dependencies
 * @param {import('sequelize').Sequelize} dependencies.sequelize
 * @param {Function} dependencies.revokeRefreshToken
 */
module.exports = function makeLogout({
  sequelize,
  revokeRefreshToken
}) {
  return async function logout(token) {
    if (!token) {
      throw new Error('Refresh token is required');
    }
    const result = await revokeRefreshToken(sequelize, token);
    if (!result) {
      throw new Error('Invalid refresh token');
    }
    return { success: true, message: 'Logged out successfully' };
  };
};
