/**
 * Factory for getting supplier orders.
 */
module.exports = function makeGetOrders({
  sequelize,
  getSupplierByUserId,
  getSupplierOrders
}) {
  return async function getOrders(userId, options = {}) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const orders = await getSupplierOrders(sequelize, profile.id, options);
    if (!orders || orders.length === 0) {
      const items = [];
      Object.defineProperty(items, 'pagination', {
        value: { totalItems: 0, page: options.page || 1, limit: options.limit || 10, totalPages: 0 },
        enumerable: true,
        writable: true
      });
      return items;
    }

    const totalItems = orders[0]?.total_count !== undefined ? orders[0].total_count : orders.length;
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || (orders.length || 10);
    const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 1;

    const items = orders.map(o => {
      const { total_count, ...orderData } = o;
      return orderData;
    });

    Object.defineProperty(items, 'pagination', {
      value: { totalItems, page, limit, totalPages },
      enumerable: true,
      writable: true
    });

    return items;
  };
};
