module.exports = function makeListPendingSuppliers({ sequelize, listSuppliers }) {
  return async function listPendingSuppliers() {
    return await listSuppliers(sequelize, 'pending');
  };
};