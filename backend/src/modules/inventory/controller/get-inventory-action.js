const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action to get inventory items with filters.
 */
module.exports = function makeGetInventoryAction(getInventoryUsecase) {
  return async function getInventoryAction(req, res, next) {
    const userId = req.user.id;
    logger.info({ userId, query: req.query }, 'Controller: Get inventory list request received');

    try {
      const {
        limit = 20,
        offset = 0,
        filter,
        sort,
        search,
        lowStockOnly
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

      const result = await getInventoryUsecase(userId, {
        limit,
        offset,
        filter: parsedFilter,
        sort: parsedSort,
        search,
        lowStockOnly: lowStockOnly === 'true'
      });

      logger.info({ count: result.inventory.length }, 'Controller: Get inventory list success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Inventory list retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ userId, error }, 'Controller: Get inventory list failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve inventory list',
        error
      });
    }
  };
};
