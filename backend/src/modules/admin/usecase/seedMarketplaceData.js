module.exports = function makeSeedMarketplaceData({ sequelize, seedMarketplaceData }) {
  return async function seedMarketplaceDataUsecase() {
    return await seedMarketplaceData(sequelize);
  };
};