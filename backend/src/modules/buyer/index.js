const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const inventoryDataAccess = require('../inventory/data-access');
const {
  makeOnboard,
  makeGetProfile,
  makeUpdateProfile,
  makeCheckout,
  makeGetOrders,
  makeGetOrderDetails
} = require('./usecase');
const {
  makeOnboardAction,
  makeGetProfileAction,
  makeUpdateProfileAction,
  makeCheckoutAction,
  makeGetOrdersAction,
  makeGetOrderDetailsAction
} = require('./controller');

const {
  makeGetMarketplaceProductsAction,
  makeGetProductDetailsForBuyerAction,
  makeGetRecommendationsAction,
  makeCartActions,
  makeCancelOrderAction,
  makeReorderAction,
  makeAddressActions,
  makeGetSuppliersAction,
  makeFavoritesActions
} = require('./controller/marketplace-and-cart-actions');

const createRoutes = require('./routes');
const { requireAuth, requireRole } = require('../../middleware/auth');

// Resolve Usecases
const onboardUsecase = makeOnboard({
  sequelize,
  getBuyerByUserId: dataAccess.getBuyerByUserId,
  createBuyerProfile: dataAccess.createBuyerProfile,
  createAddress: dataAccess.createAddress,
  linkBuyerAddress: dataAccess.linkBuyerAddress
});

const getProfileUsecase = makeGetProfile({
  sequelize,
  getBuyerByUserId: dataAccess.getBuyerByUserId,
  getBuyerAddresses: dataAccess.getBuyerAddresses
});

const updateProfileUsecase = makeUpdateProfile({
  sequelize,
  getBuyerByUserId: dataAccess.getBuyerByUserId,
  updateBuyerProfile: dataAccess.updateBuyerProfile
});

const checkoutUsecase = makeCheckout({
  sequelize,
  getBuyerByUserId: dataAccess.getBuyerByUserId,
  createAddress: dataAccess.createAddress,
  linkBuyerAddress: dataAccess.linkBuyerAddress,
  getPendingOrderStatus: dataAccess.getPendingOrderStatus,
  createOrder: dataAccess.createOrder,
  createOrderItem: dataAccess.createOrderItem,
  createOrderStatusHistory: dataAccess.createOrderStatusHistory,
  reserveInventory: inventoryDataAccess.reserveInventory,
  clearCart: dataAccess.clearCart
});

const getOrdersUsecase = makeGetOrders({
  sequelize,
  getBuyerOrders: dataAccess.getBuyerOrders
});

const getOrderDetailsUsecase = makeGetOrderDetails({
  sequelize,
  getBuyerOrderById: dataAccess.getBuyerOrderById,
  getBuyerOrderItems: dataAccess.getBuyerOrderItems
});

// Marketplace & Cart & Address & Supplier & Favorites actions
const getMarketplaceProductsAction = makeGetMarketplaceProductsAction(dataAccess.getMarketplaceProducts, sequelize);
const getProductDetailsForBuyerAction = makeGetProductDetailsForBuyerAction(dataAccess.getProductDetailsForBuyer, sequelize);
const getRecommendationsAction = makeGetRecommendationsAction(dataAccess.getProductRecommendations, sequelize);
const getSuppliersAction = makeGetSuppliersAction(dataAccess.getSuppliers, sequelize);
const favoritesActions = makeFavoritesActions({
  getBuyerFavorites: dataAccess.getBuyerFavorites,
  addBuyerFavorite: dataAccess.addBuyerFavorite,
  removeBuyerFavorite: dataAccess.removeBuyerFavorite
}, sequelize);

const cartActions = makeCartActions({
  getCart: dataAccess.getCart,
  addToCart: dataAccess.addToCart,
  updateCartItem: dataAccess.updateCartItem,
  removeCartItem: dataAccess.removeCartItem,
  clearCart: dataAccess.clearCart
}, sequelize);

const addressActions = makeAddressActions({
  getBuyerByUserId: dataAccess.getBuyerByUserId,
  getBuyerAddresses: dataAccess.getBuyerAddresses,
  addBuyerAddress: dataAccess.addBuyerAddress,
  deleteBuyerAddress: dataAccess.deleteBuyerAddress
}, sequelize);

const cancelOrderAction = makeCancelOrderAction(dataAccess.cancelBuyerOrder, inventoryDataAccess.releaseInventory, sequelize);
const reorderAction = makeReorderAction(dataAccess.reorderBuyerOrder, sequelize);

// Resolve Controllers
const onboardAction = makeOnboardAction(onboardUsecase);
const getProfileAction = makeGetProfileAction(getProfileUsecase);
const updateProfileAction = makeUpdateProfileAction(updateProfileUsecase);
const checkoutAction = makeCheckoutAction(checkoutUsecase);
const getOrdersAction = makeGetOrdersAction(getOrdersUsecase);
const getOrderDetailsAction = makeGetOrderDetailsAction(getOrderDetailsUsecase);

// Create Router
const buyerRouter = createRoutes({
  onboardAction,
  getProfileAction,
  updateProfileAction,
  getMarketplaceProductsAction,
  getProductDetailsForBuyerAction,
  getRecommendationsAction,
  getSuppliersAction,
  favoritesActions,
  cartActions,
  addressActions,
  checkoutAction,
  getOrdersAction,
  getOrderDetailsAction,
  cancelOrderAction,
  reorderAction,
  requireAuth,
  requireRole
});

module.exports = {
  buyerRouter,
  onboardUsecase,
  getProfileUsecase,
  checkoutUsecase,
  getOrdersUsecase,
  getOrderDetailsUsecase
};
