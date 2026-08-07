const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for supplier onboarding.
 */
module.exports = function makeOnboardAction(onboardUsecase) {
  return async function onboardAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Onboard supplier request received');

    try {
      const {
        companyName,
        companyDescription,
        website,
        minimumOrderQuantity,
        addressLine1,
        landmark,
        zipcode,
        cityId,
        contactNumber
      } = req.body;

      const result = await onboardUsecase(userId, {
        companyName,
        companyDescription,
        website,
        minimumOrderQuantity,
        addressLine1,
        landmark,
        zipcode,
        cityId,
        contactNumber
      });

      logger.info({ userId, supplierId: result.profile.id }, 'Controller: Onboard supplier success');
      return successResponse(res, {
        statusCode: 201,
        message: 'Supplier onboarding completed successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Onboard supplier failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Supplier onboarding failed',
        error
      });
    }
  };
};
