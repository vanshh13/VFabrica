const { Router } = require('express');
const { authRouter } = require('../modules/auth');
const { adminRouter } = require('../modules/admin');
const { supplierRouter } = require('../modules/supplier');
const { productsRouter } = require('../modules/products');
const { categoriesRouter } = require('../modules/categories');
const { buyerRouter } = require('../modules/buyer');
const { ordersRouter } = require('../modules/orders');
const { inventoryRouter } = require('../modules/inventory');
const { aiRouter } = require('../modules/ai');

const apiRouter = Router();

// Mount module routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/supplier', supplierRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/buyer', buyerRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/ai', aiRouter);

module.exports = apiRouter;
