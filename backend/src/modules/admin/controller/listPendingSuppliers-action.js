module.exports = function makeListPendingSuppliersAction(listPendingSuppliersUsecase) {
  return async function listPendingSuppliersAction(req, res) {
    try {
      const result = await listPendingSuppliersUsecase();
      return res.status(200).json({ success: true, message: 'Pending suppliers retrieved successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};