const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const {
  makeGetCategories,
  makeGetMasters
} = require('./usecase');
const {
  makeGetCategoriesAction,
  makeGetMastersAction
} = require('./controller');
const createRoutes = require('./routes');

// Resolve Usecases
const getCategoriesUsecase = makeGetCategories({
  sequelize,
  getAllCategories: dataAccess.getAllCategories
});

const getMastersUsecase = makeGetMasters({
  sequelize,
  getAllMasters: dataAccess.getAllMasters
});

// Resolve Controllers
const getCategoriesAction = makeGetCategoriesAction(getCategoriesUsecase);
const getMastersAction = makeGetMastersAction(getMastersUsecase);

// Create Router
const categoriesRouter = createRoutes({
  getCategoriesAction,
  getMastersAction
});

module.exports = {
  categoriesRouter,
  getCategoriesUsecase,
  getMastersUsecase
};
