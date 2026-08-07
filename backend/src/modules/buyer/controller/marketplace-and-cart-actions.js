const { logger } = require('../../../utils/logger');

function makeGetMarketplaceProductsAction(getMarketplaceProductsFn, sequelize) {
  return async function getMarketplaceProductsAction(req, res, next) {
    try {
      const { search, categoryId, fabricTypeId, colorId, brand, supplierId, minPrice, maxPrice, minMoq, page = 1, limit = 20, sort } = req.query;
      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const result = await getMarketplaceProductsFn(sequelize, {
        search,
        categoryId,
        fabricTypeId,
        colorId,
        brand,
        supplierId,
        minPrice,
        maxPrice,
        minMoq,
        limit: parseInt(limit, 10),
        offset,
        sort
      });
      res.json({
        success: true,
        message: 'Marketplace products retrieved successfully',
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeGetProductDetailsForBuyerAction(getProductDetailsFn, sequelize) {
  return async function getProductDetailsForBuyerAction(req, res, next) {
    try {
      const { id } = req.params;
      const product = await getProductDetailsFn(sequelize, id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
      }
      res.json({
        success: true,
        message: 'Product details retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeGetRecommendationsAction(getRecommendationsFn, sequelize) {
  return async function getRecommendationsAction(req, res, next) {
    try {
      const { categoryId, fabricTypeId, excludeProductId, limit = 6 } = req.query;
      const data = await getRecommendationsFn(sequelize, { categoryId, fabricTypeId, excludeProductId, limit });
      res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeCartActions(cartFns, sequelize) {
  return {
    async getCartAction(req, res, next) {
      try {
        const userId = req.user.id;
        const items = await cartFns.getCart(sequelize, userId);
        res.json({ success: true, message: 'Cart retrieved successfully', data: items });
      } catch (error) { next(error); }
    },
    async addToCartAction(req, res, next) {
      try {
        const userId = req.user.id;
        const roles = req.user.roles || [];
        const role = req.user.role || roles[0];
        const isBuyer = roles.includes('BUYER') || role === 'BUYER' || roles.includes('ADMIN') || role === 'ADMIN';

        if (!isBuyer) {
          return res.status(403).json({
            success: false,
            message: 'Only buyers can purchase products.'
          });
        }

        const { productVariantId, productId, quantity } = req.body;
        const items = await cartFns.addToCart(sequelize, userId, { productVariantId, productId, quantity: parseInt(quantity, 10) || 1 });
        res.json({ success: true, message: 'Added to cart successfully', data: items });
      } catch (error) { next(error); }
    },
    async updateCartItemAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { cartItemId, quantity } = req.body;
        const items = await cartFns.updateCartItem(sequelize, userId, { cartItemId, quantity: parseInt(quantity, 10) });
        res.json({ success: true, message: 'Cart item updated successfully', data: items });
      } catch (error) { next(error); }
    },
    async removeCartItemAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        const items = await cartFns.removeCartItem(sequelize, userId, id);
        res.json({ success: true, message: 'Cart item removed successfully', data: items });
      } catch (error) { next(error); }
    },
    async clearCartAction(req, res, next) {
      try {
        const userId = req.user.id;
        const items = await cartFns.clearCart(sequelize, userId);
        res.json({ success: true, message: 'Cart cleared successfully', data: items });
      } catch (error) { next(error); }
    }
  };
}

function makeCancelOrderAction(cancelOrderFn, releaseInventoryFn, sequelize) {
  return async function cancelOrderAction(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { remarks } = req.body || {};
      const result = await cancelOrderFn(sequelize, userId, id, remarks, releaseInventoryFn);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  };
}

function makeReorderAction(reorderFn, sequelize) {
  return async function reorderAction(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const cartItems = await reorderFn(sequelize, userId, id);
      res.json({ success: true, message: 'Items from previous order added to cart', data: cartItems });
    } catch (error) {
      next(error);
    }
  };
}

function makeAddressActions(addressFns, sequelize) {
  return {
    async getAddressesAction(req, res, next) {
      try {
        const userId = req.user.id;
        const profile = await addressFns.getBuyerByUserId(sequelize, userId);
        if (!profile) return res.json({ success: true, data: [] });
        const addresses = await addressFns.getBuyerAddresses(sequelize, profile.id);
        res.json({ success: true, data: addresses });
      } catch (error) { next(error); }
    },
    async addAddressAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { addressLine1, landmark, zipcode, cityId, addressType, isPrimary } = req.body;
        const addresses = await addressFns.addBuyerAddress(sequelize, userId, {
          addressLine1, landmark, zipcode, cityId, addressType, isPrimary
        });
        res.json({ success: true, message: 'Address added successfully', data: addresses });
      } catch (error) { next(error); }
    },
    async deleteAddressAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        const addresses = await addressFns.deleteBuyerAddress(sequelize, userId, id);
        res.json({ success: true, message: 'Address removed successfully', data: addresses });
      } catch (error) { next(error); }
    }
  };
}

function makeGetSuppliersAction(getSuppliersFn, sequelize) {
  return async function getSuppliersAction(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const result = await getSuppliersFn(sequelize, {
        search,
        limit: parseInt(limit, 10),
        offset
      });
      res.json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeFavoritesActions(favoritesFns, sequelize) {
  return {
    async getFavoritesAction(req, res, next) {
      try {
        const userId = req.user.id;
        const favorites = await favoritesFns.getBuyerFavorites(sequelize, userId);
        res.json({ success: true, message: 'Favorites retrieved successfully', data: favorites });
      } catch (error) { next(error); }
    },
    async addFavoriteAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { productId } = req.params;
        const favorites = await favoritesFns.addBuyerFavorite(sequelize, userId, productId);
        res.json({ success: true, message: 'Product added to favorites', data: favorites });
      } catch (error) { next(error); }
    },
    async removeFavoriteAction(req, res, next) {
      try {
        const userId = req.user.id;
        const { productId } = req.params;
        const favorites = await favoritesFns.removeBuyerFavorite(sequelize, userId, productId);
        res.json({ success: true, message: 'Product removed from favorites', data: favorites });
      } catch (error) { next(error); }
    }
  };
}

module.exports = {
  makeGetMarketplaceProductsAction,
  makeGetProductDetailsForBuyerAction,
  makeGetRecommendationsAction,
  makeCartActions,
  makeCancelOrderAction,
  makeReorderAction,
  makeAddressActions,
  makeGetSuppliersAction,
  makeFavoritesActions
};
