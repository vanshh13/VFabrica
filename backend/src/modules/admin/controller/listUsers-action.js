module.exports = function makeListUsersAction(listUsersUsecase) {
  return async function listUsersAction(req, res) {
    try {
      const result = await listUsersUsecase();
      return res.status(200).json({ success: true, message: 'Users retrieved successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};