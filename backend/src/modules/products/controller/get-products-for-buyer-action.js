const { logger } = require('../../../utils/logger');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Controller action for listing products for buyers.
 */
module.exports = function makeGetProductsForBuyerAction(getProductsForBuyerUsecase) {
  return async function getProductsForBuyerAction(req, res, next) {
    const payload = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    logger.info({ method: req.method, payload }, 'Controller: Get products list request received');

    try {
      const {
        search,
        categoryId,
        fabricTypeId,
        supplierId,
        minPrice,
        maxPrice,
        limit = 20,
        offset = 0,
        sortBy,
        filter,
        sort
      } = payload;

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

      const result = await getProductsForBuyerUsecase({
        search,
        categoryId,
        fabricTypeId,
        supplierId,
        minPrice,
        maxPrice,
        limit,
        offset,
        sortBy,
        filter: parsedFilter,
        sort: parsedSort
      });

      logger.info({ count: result.length }, 'Controller: Get products list success');
      return successResponse(res, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error({ error }, 'Controller: Get products list failed');
      return errorResponse(res, {
        statusCode: 400,
        message: 'Failed to retrieve products list',
        error
      });
    }
  };
};
