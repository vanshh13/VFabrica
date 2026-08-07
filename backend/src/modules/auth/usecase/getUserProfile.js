/**
 * Factory for getUserProfile usecase.
 * @param {object} dependencies
 * @param {import('sequelize').Sequelize} dependencies.sequelize
 * @param {Function} dependencies.getUserById
 * @param {Function} dependencies.getUserRoles
 * @param {Function} dependencies.getUserPermissions
 */
module.exports = function makeGetUserProfile({
  sequelize,
  getUserById,
  getUserRoles,
  getUserPermissions
}) {
  return async function getUserProfile(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await getUserById(sequelize, userId);
    if (!user) {
      throw new Error('User not found');
    }

    const roles = await getUserRoles(sequelize, userId);
    const permissions = await getUserPermissions(sequelize, userId);

    return {
      user,
      roles: roles.map(r => r.name),
      permissions: permissions.map(p => `${p.module}:${p.action}`)
    };
  };
};
