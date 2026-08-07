/**
 * Controller action for token refresh.
 * @param {Function} refreshTokenUsecase
 */
module.exports = function makeRefreshTokenAction(refreshTokenUsecase) {
  return async function refreshTokenAction(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await refreshTokenUsecase(refreshToken);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
  };
};
