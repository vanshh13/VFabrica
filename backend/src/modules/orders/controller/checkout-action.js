const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for order checkout.
 */
module.exports = function makeCheckoutAction(checkoutUsecase) {
  return async function checkoutAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, body: req.body }, 'Controller: Place order checkout request received');

    try {
      const {
        supplierId,
        billingAddressId,
        shippingAddressId,
        subtotal,
        discount,
        tax,
        shippingCharge,
        grandTotal,
        items
      } = req.body;

      const result = await checkoutUsecase(userId, {
        supplierId,
        billingAddressId,
        shippingAddressId,
        subtotal,
        discount,
        tax,
        shippingCharge,
        grandTotal,
        items
      });

      logger.info({ userId, orderId: result.order.id }, 'Controller: Place order success');
      return successResponse(res, {
        statusCode: 201,
        message: 'Order placed successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Place order failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to place order',
        error
      });
    }
  };
};
