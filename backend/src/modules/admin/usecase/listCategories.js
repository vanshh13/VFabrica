module.exports = function makeListCategories({ sequelize, listCategories }) {
  return async function getCategories() {
    return await listCategories(sequelize);
  };
};