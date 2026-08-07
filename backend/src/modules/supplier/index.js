// Main Entry point for the Supplier module
const { sequelize } = require('../../../models');

// Import data-access queries
const dataAccess = require('./data-access');

// Import usecase factories
const {
  makeOnboard,
  makeGetProfile,
  makeUpdateProfile,
  makeGetDashboard,
  makeGetProducts,
  makeGetProductDetails,
  makeCreateProduct,
  makeUpdateProduct,
  makeDeleteProduct,
  makeUpdateStock,
  makeGetOrders,
  makeGetOrderDetails,
  makeUpdateOrderStatus
} = require('./usecase');

// Import controller factories
const {
  makeOnboardAction,
  makeGetProfileAction,
  makeUpdateProfileAction,
  makeGetDashboardAction,
  makeGetProductsAction,
  makeGetProductDetailsAction,
  makeCreateProductAction,
  makeUpdateProductAction,
  makeDeleteProductAction,
  makeUpdateStockAction,
  makeGetOrdersAction,
  makeGetOrderDetailsAction,
  makeUpdateOrderStatusAction
} = require('./controller');

// Import routes factory
const createRoutes = require('./routes');

// Import middleware
const { requireAuth, requireRole } = require('../../middleware/auth');

// Resolve Usecases (Injecting database client and queries)
const onboardUsecase = makeOnboard({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  createSupplierProfile: dataAccess.createSupplierProfile,
  createAddress: dataAccess.createAddress,
  linkSupplierAddress: dataAccess.linkSupplierAddress,
  createWarehouse: dataAccess.createWarehouse
});

const getProfileUsecase = makeGetProfile({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierAddresses: dataAccess.getSupplierAddresses,
  getSupplierWarehouses: dataAccess.getSupplierWarehouses
});

const updateProfileUsecase = makeUpdateProfile({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  updateSupplierProfile: dataAccess.updateSupplierProfile
});

const getDashboardUsecase = makeGetDashboard({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierProductStats: dataAccess.getSupplierProductStats,
  getSupplierOrderStats: dataAccess.getSupplierOrderStats,
  getInventoryAlerts: dataAccess.getInventoryAlerts
});

const getProductsUsecase = makeGetProducts({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierProducts: dataAccess.getSupplierProducts,
  getProductImagesByProductIds: dataAccess.getProductImagesByProductIds,
  getProductVariantsByProductIds: dataAccess.getProductVariantsByProductIds,
  getSupplierInventorySummary: dataAccess.getSupplierInventorySummary
});

const getProductDetailsUsecase = makeGetProductDetails({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierProductById: dataAccess.getSupplierProductById,
  getSupplierProductImages: dataAccess.getSupplierProductImages,
  getSupplierProductVariants: dataAccess.getSupplierProductVariants,
  getSupplierVariantAttributes: dataAccess.getSupplierVariantAttributes,
  getSupplierInventorySummary: dataAccess.getSupplierInventorySummary
});

const createProductUsecase = makeCreateProduct({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  createProduct: dataAccess.createProduct,
  createProductImage: dataAccess.createProductImage,
  createProductVariant: dataAccess.createProductVariant,
  createProductAttributeValue: dataAccess.createProductAttributeValue,
  getSupplierProductById: dataAccess.getSupplierProductById
});

const updateProductUsecase = makeUpdateProduct({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  updateProduct: dataAccess.updateProduct,
  deleteProductImages: dataAccess.deleteProductImages,
  createProductImage: dataAccess.createProductImage,
  deleteProductVariants: dataAccess.deleteProductVariants,
  createProductVariant: dataAccess.createProductVariant,
  createProductAttributeValue: dataAccess.createProductAttributeValue,
  deleteProductAttributeValuesByVariantId: dataAccess.deleteProductAttributeValuesByVariantId,
  getSupplierProductById: dataAccess.getSupplierProductById,
  getProductImageById: dataAccess.getProductImageById,
  getProductVariantById: dataAccess.getProductVariantById,
  updateProductVariant: dataAccess.updateProductVariant,
  deleteProductVariantById: dataAccess.deleteProductVariantById,
  updateProductStatus: dataAccess.updateProductStatus
});

const deleteProductUsecase = makeDeleteProduct({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  softDeleteProduct: dataAccess.softDeleteProduct
});

const updateStockUsecase = makeUpdateStock({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierWarehouses: dataAccess.getSupplierWarehouses,
  upsertInventory: dataAccess.upsertInventory
});

const getOrdersUsecase = makeGetOrders({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getSupplierOrders: dataAccess.getSupplierOrders
});

const getOrderDetailsUsecase = makeGetOrderDetails({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getOrderById: dataAccess.getOrderById,
  getOrderItems: dataAccess.getOrderItems
});

const updateOrderStatusUsecase = makeUpdateOrderStatus({
  sequelize,
  getSupplierByUserId: dataAccess.getSupplierByUserId,
  getOrderById: dataAccess.getOrderById,
  getOrderStatusByName: dataAccess.getOrderStatusByName,
  updateOrderStatus: dataAccess.updateOrderStatus,
  createOrderStatusHistory: dataAccess.createOrderStatusHistory
});

// Resolve Controller Actions
const onboardAction = makeOnboardAction(onboardUsecase);
const getProfileAction = makeGetProfileAction(getProfileUsecase);
const updateProfileAction = makeUpdateProfileAction(updateProfileUsecase);
const getDashboardAction = makeGetDashboardAction(getDashboardUsecase);
const getProductsAction = makeGetProductsAction(getProductsUsecase);
const getProductDetailsAction = makeGetProductDetailsAction(getProductDetailsUsecase);
const createProductAction = makeCreateProductAction(createProductUsecase);
const updateProductAction = makeUpdateProductAction(updateProductUsecase);
const deleteProductAction = makeDeleteProductAction(deleteProductUsecase);
const updateStockAction = makeUpdateStockAction(updateStockUsecase);
const getOrdersAction = makeGetOrdersAction(getOrdersUsecase);
const getOrderDetailsAction = makeGetOrderDetailsAction(getOrderDetailsUsecase);
const updateOrderStatusAction = makeUpdateOrderStatusAction(updateOrderStatusUsecase);

// Create Router
const supplierRouter = createRoutes({
  onboardAction,
  getProfileAction,
  updateProfileAction,
  getDashboardAction,
  getProductsAction,
  getProductDetailsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  updateStockAction,
  getOrdersAction,
  getOrderDetailsAction,
  updateOrderStatusAction,
  requireAuth,
  requireRole
});

module.exports = {
  supplierRouter,
  onboardUsecase,
  getProductsUsecase,
  createProductUsecase,
  updateStockUsecase,
  getOrdersUsecase,
  updateOrderStatusUsecase
};
