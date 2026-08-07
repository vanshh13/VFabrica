const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const {
  makeGetDashboard,
  makeListPendingSuppliers,
  makeReviewSupplier,
  makeListUsers,
  makeUpdateUserStatus,
  makeCreateCategory,
  makeUpdateCategory,
  makeDeleteCategory,
  makeSeedMarketplaceData
} = require('./usecase');
const {
  makeGetDashboardAction,
  makeListPendingSuppliersAction,
  makeReviewSupplierAction,
  makeListUsersAction,
  makeUpdateUserStatusAction,
  makeCreateCategoryAction,
  makeUpdateCategoryAction,
  makeDeleteCategoryAction,
  makeSeedMarketplaceDataAction
} = require('./controller');
const createRoutes = require('./routes');
const { requireAuth, requireRole } = require('../../middleware/auth');

const getDashboardUsecase = makeGetDashboard({
  sequelize,
  getDashboardSummary: dataAccess.getDashboardSummary
});

const listPendingSuppliersUsecase = makeListPendingSuppliers({
  sequelize,
  listSuppliers: dataAccess.listSuppliers
});

const reviewSupplierUsecase = makeReviewSupplier({
  sequelize,
  reviewSupplier: dataAccess.reviewSupplier
});

const listUsersUsecase = makeListUsers({
  sequelize,
  listUsers: dataAccess.listUsers
});

const updateUserStatusUsecase = makeUpdateUserStatus({
  sequelize,
  updateUserStatus: dataAccess.updateUserStatus
});

const createCategoryUsecase = makeCreateCategory({
  sequelize,
  createCategory: dataAccess.createCategory,
  getCategoryBySlug: dataAccess.getCategoryBySlug
});

const updateCategoryUsecase = makeUpdateCategory({
  sequelize,
  updateCategory: dataAccess.updateCategory,
  getCategoryById: dataAccess.getCategoryById,
  getCategoryBySlug: dataAccess.getCategoryBySlug
});

const deleteCategoryUsecase = makeDeleteCategory({
  sequelize,
  deleteCategory: dataAccess.deleteCategory,
  getCategoryById: dataAccess.getCategoryById
});

const seedMarketplaceDataUsecase = makeSeedMarketplaceData({
  sequelize,
  seedMarketplaceData: dataAccess.seedMarketplaceData
});

const adminRouter = createRoutes({
  getDashboardAction: makeGetDashboardAction(getDashboardUsecase),
  listPendingSuppliersAction: makeListPendingSuppliersAction(listPendingSuppliersUsecase),
  reviewSupplierAction: makeReviewSupplierAction(reviewSupplierUsecase),
  listUsersAction: makeListUsersAction(listUsersUsecase),
  updateUserStatusAction: makeUpdateUserStatusAction(updateUserStatusUsecase),
  createCategoryAction: makeCreateCategoryAction(createCategoryUsecase),
  updateCategoryAction: makeUpdateCategoryAction(updateCategoryUsecase),
  deleteCategoryAction: makeDeleteCategoryAction(deleteCategoryUsecase),
  seedMarketplaceDataAction: makeSeedMarketplaceDataAction(seedMarketplaceDataUsecase),
  requireAuth,
  requireRole
});

module.exports = {
  adminRouter,
  getDashboardUsecase,
  listPendingSuppliersUsecase,
  reviewSupplierUsecase,
  listUsersUsecase,
  updateUserStatusUsecase,
  createCategoryUsecase,
  updateCategoryUsecase,
  deleteCategoryUsecase,
  seedMarketplaceDataUsecase
};