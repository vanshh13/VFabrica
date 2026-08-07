/**
 * Controller action for getting authenticated user profile.
 * @param {Function} getUserProfileUsecase
 */
module.exports = function makeGetUserProfileAction(getUserProfileUsecase) {
  return async function getUserProfileAction(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await getUserProfileUsecase(userId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };
};
