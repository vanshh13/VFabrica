module.exports = function makeUpdateUserStatus({ sequelize, updateUserStatus }) {
  return async function updateUserStatusUsecase({ userId, status }) {
    if (!userId || !status) {
      throw new Error('userId and status are required');
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new Error('Invalid user status');
    }

    return await updateUserStatus(sequelize, { userId, status });
  };
};