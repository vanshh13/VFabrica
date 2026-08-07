const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for buyer onboarding.
 */
module.exports = function makeOnboardAction(onboardUsecase) {
  return async function onboardAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Onboard buyer request received');

    try {
      const {
        companyName,
        buyerType,
        businessType,
        industry,
        preferences,
        addressLine1,
        landmark,
        zipcode,
        cityId
      } = req.body;

      const result = await onboardUsecase(userId, {
        companyName,
        buyerType,
        businessType,
        industry,
        preferences,
        addressLine1,
        landmark,
        zipcode,
        cityId
      });

      logger.info({ userId, buyerId: result.profile.id }, 'Controller: Onboard buyer success');
      return successResponse(res, {
        statusCode: 201,
        message: 'Buyer onboarding completed successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Onboard buyer failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Buyer onboarding failed',
        error
      });
    }
  };
};
