const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const {
  makeGetProductsForBuyer,
  makeGetProductDetailsForBuyer
} = require('./usecase');
const {
  makeGetProductsForBuyerAction,
  makeGetProductDetailsForBuyerAction
} = require('./controller');
const createRoutes = require('./routes');
const { requireAuth } = require('../../middleware/auth');

// Resolve Usecases
const getProductsForBuyerUsecase = makeGetProductsForBuyer({
  sequelize,
  getProductsForBuyer: dataAccess.getProductsForBuyer,
  getProductImages: dataAccess.getProductImages,
  getProductVariants: dataAccess.getProductVariants
});

const getProductDetailsForBuyerUsecase = makeGetProductDetailsForBuyer({
  sequelize,
  getProductByIdForBuyer: dataAccess.getProductByIdForBuyer,
  getProductImages: dataAccess.getProductImages,
  getProductVariants: dataAccess.getProductVariants
});

// Resolve Controllers
const getProductsForBuyerAction = makeGetProductsForBuyerAction(getProductsForBuyerUsecase);
const getProductDetailsForBuyerAction = makeGetProductDetailsForBuyerAction(getProductDetailsForBuyerUsecase);

// Create Router
const productsRouter = createRoutes({
  getProductsForBuyerAction,
  getProductDetailsForBuyerAction,
  requireAuth
});

module.exports = {
  productsRouter,
  getProductsForBuyerUsecase,
  getProductDetailsForBuyerUsecase
};
