const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for getting orders history list.
 */
module.exports = function makeGetOrdersAction(getOrdersUsecase) {
  return async function getOrdersAction(req, res, next) {
    logger.info({ user: req.user, query: req.query }, 'Controller: Get orders request received');

    try {
      const {
        limit = 20,
        offset = 0,
        filter,
        sort,
        search
      } = req.query;

      let parsedFilter = [];
      if (filter) {
        try {
          parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;
        } catch (e) {
          logger.warn({ filter }, 'Failed to parse filter query parameter, using empty array');
        }
      }

      let parsedSort = [];
      if (sort) {
        try {
          parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;
        } catch (e) {
          logger.warn({ sort }, 'Failed to parse sort query parameter, using empty array');
        }
      }

      const result = await getOrdersUsecase(req.user, {
        limit,
        offset,
        filter: parsedFilter,
        sort: parsedSort,
        search
      });

      logger.info({ count: result.orders.length }, 'Controller: Get orders success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Orders list retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ error }, 'Controller: Get orders failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve orders list',
        error
      });
    }
  };
};
