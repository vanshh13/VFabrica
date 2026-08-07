'use strict';

const { logger } = require('../../../utils/logger');

/**
 * Fetch top active products with category, fabric type, supplier name, primary image, and pricing.
 */
async function getCatalogForAI(sequelize, limit = 40) {
  try {
    const sql = `
      SELECT 
        p."id",
        p."name",
        p."description",
        p."base_price",
        p."minimum_order_quantity",
        p."lead_time_days",
        p."brand",
        c."name" AS category_name,
        ft."name" AS fabric_type_name,
        u."symbol" AS unit_symbol,
        sp."company_name" AS supplier_name,
        (
          SELECT pi."image_url" 
          FROM "product_images" pi 
          WHERE pi."product_id" = p."id" 
          ORDER BY pi."is_primary" DESC, pi."display_order" ASC 
          LIMIT 1
        ) AS primary_image
      FROM "products" p
      LEFT JOIN "categories" c ON p."category_id" = c."id"
      LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
      LEFT JOIN "units" u ON p."unit_id" = u."id"
      LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
      WHERE p."status" = 'active' AND p."is_deleted" = FALSE
      ORDER BY p."created_at" DESC
      LIMIT :limit;
    `;

    const products = await sequelize.query(sql, {
      replacements: { limit },
      type: 'SELECT'
    });

    return products;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch catalog for AI assistant');
    return [];
  }
}

/**
 * Fetch detailed product list by array of IDs.
 */
async function getProductsByIds(sequelize, ids = []) {
  if (!ids || ids.length === 0) return [];
  try {
    const sql = `
      SELECT 
        p."id",
        p."name",
        p."description",
        p."base_price",
        p."minimum_order_quantity",
        p."lead_time_days",
        p."brand",
        c."name" AS category_name,
        ft."name" AS fabric_type_name,
        u."symbol" AS unit_symbol,
        sp."company_name" AS supplier_name,
        (
          SELECT pi."image_url" 
          FROM "product_images" pi 
          WHERE pi."product_id" = p."id" 
          ORDER BY pi."is_primary" DESC, pi."display_order" ASC 
          LIMIT 1
        ) AS primary_image
      FROM "products" p
      LEFT JOIN "categories" c ON p."category_id" = c."id"
      LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
      LEFT JOIN "units" u ON p."unit_id" = u."id"
      LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
      WHERE p."id" IN (:ids) AND p."is_deleted" = FALSE;
    `;

    return await sequelize.query(sql, {
      replacements: { ids },
      type: 'SELECT'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch products by IDs for AI assistant');
    return [];
  }
}

module.exports = {
  getCatalogForAI,
  getProductsByIds
};
