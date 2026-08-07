/**
 * Factory for getting buyer orders list.
 */
module.exports = function makeGetOrders({
  sequelize,
  getBuyerOrders
}) {
  return async function getOrders(userId) {
    return await getBuyerOrders(sequelize, userId);
  };
};
