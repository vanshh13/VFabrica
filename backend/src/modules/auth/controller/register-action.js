/**
 * Controller action for user registration.
 * @param {Function} registerUsecase
 */
module.exports = function makeRegisterAction(registerUsecase) {
  return async function registerAction(req, res, next) {
    try {
      const { email, phone, password, roleName } = req.body;
      const user = await registerUsecase({ email, phone, password, roleName });
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };
};
