module.exports = function makeListUsers({ sequelize, listUsers }) {
  return async function getUsers() {
    return await listUsers(sequelize);
  };
};