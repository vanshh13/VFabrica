module.exports = function makeSeedMarketplaceDataAction(seedMarketplaceDataUsecase) {
  return async function seedMarketplaceDataAction(req, res) {
    try {
      const result = await seedMarketplaceDataUsecase();
      return res.status(200).json({ success: true, message: 'Marketplace data seeded successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};