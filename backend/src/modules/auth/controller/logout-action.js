/**
 * Controller action for user logout.
 * @param {Function} logoutUsecase
 */
module.exports = function makeLogoutAction(logoutUsecase) {
  return async function logoutAction(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await logoutUsecase(refreshToken);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };
};
