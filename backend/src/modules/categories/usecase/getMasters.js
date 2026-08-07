/**
 * Factory for getting lookup masters.
 */
module.exports = function makeGetMasters({ sequelize, getAllMasters }) {
  return async function getMasters() {
    return await getAllMasters(sequelize);
  };
};
