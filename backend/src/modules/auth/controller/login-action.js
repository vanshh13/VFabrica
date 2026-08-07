/**
 * Controller action for user login.
 * @param {Function} loginUsecase
 */
module.exports = function makeLoginAction(loginUsecase) {
  return async function loginAction(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const device = req.headers['user-agent'];

      const result = await loginUsecase({ email, password, device, ipAddress });
      return res.status(200).json({
        success: true,
        message: 'Login successful',
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
