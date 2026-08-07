module.exports = function makeGetDashboard({ sequelize, getDashboardSummary }) {
  return async function getDashboard() {
    return await getDashboardSummary(sequelize);
  };
};