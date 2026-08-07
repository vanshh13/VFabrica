module.exports = function makeUpdateUserStatusAction(updateUserStatusUsecase) {
  return async function updateUserStatusAction(req, res) {
    try {
      const { userId, status } = req.body;
      const result = await updateUserStatusUsecase({ userId, status });
      return res.status(200).json({ success: true, message: 'User status updated successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};