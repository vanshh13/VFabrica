module.exports = function makeGetDashboardAction(getDashboardUsecase) {
  return async function getDashboardAction(req, res) {
    try {
      const result = await getDashboardUsecase();
      return res.status(200).json({ success: true, message: 'Admin dashboard summary retrieved successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};