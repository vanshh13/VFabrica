/**
 * Factory for getting supplier dashboard stats.
 */
module.exports = function makeGetDashboard({
  sequelize,
  getSupplierByUserId,
  getSupplierProductStats,
  getSupplierOrderStats,
  getInventoryAlerts
}) {
  return async function getDashboard(userId) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found. Please complete onboarding first.');
    }

    const productStats = await getSupplierProductStats(sequelize, profile.id);
    const orderStats = await getSupplierOrderStats(sequelize, profile.id);
    const inventoryAlerts = await getInventoryAlerts(sequelize, profile.id);

    return {
      totalProducts: productStats.totalProducts,
      activeProducts: productStats.activeProducts,
      pendingOrders: orderStats.pendingOrders,
      recentOrders: orderStats.recentOrders,
      totalOrders: orderStats.recentOrders?.length ?? 0,
      inventoryAlerts
    };
  };
};
