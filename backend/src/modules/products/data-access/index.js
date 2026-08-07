// Data Access Layer for Product Browsing (Buyer Experience)
const { logger } = require('../../../utils/logger');
const { buildQueryFromFilters, buildMultiSort } = require('eva-utilities/utils/filter-builder-v2');

async function getProductsForBuyer(sequelize, { search, categoryId, fabricTypeId, supplierId, minPrice, maxPrice, limit = 20, offset = 0, sortBy, filter = [], sort = [] }) {
  logger.info({ search, categoryId, fabricTypeId, supplierId, minPrice, maxPrice, filter, sort }, 'Database: getProductsForBuyer query invoked');

  const fieldMapping = {
    id: 'p.id',
    name: 'p.name',
    description: 'p.description',
    base_price: 'p.base_price',
    minimum_order_quantity: 'p.minimum_order_quantity',
    lead_time_days: 'p.lead_time_days',
    status: 'p.status',
    category_id: 'p.category_id',
    fabric_type_id: 'p.fabric_type_id',
    supplier_id: 'p.supplier_id',
    category_name: 'c.name',
    fabric_type_name: 'ft.name',
    supplier_name: 'sp.company_name',
    created_at: 'p.created_at'
  };

  let baseQuery = `
    FROM "products" p
    LEFT JOIN "categories" c ON p."category_id" = c."id"
    LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
    LEFT JOIN "units" u ON p."unit_id" = u."id"
    LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
    WHERE p."status" = 'active' AND p."is_deleted" = FALSE
  `;

  const bindParams = [];
  let paramIndex = 1;

  // Global Search
  if (search) {
    baseQuery += ` AND (p."name" ILIKE $${paramIndex} OR p."description" ILIKE $${paramIndex})`;
    bindParams.push(`%${search}%`);
    paramIndex++;
  }

  // Combine query filters and flat parameters
  const activeFilters = [...filter];
  if (categoryId) {
    activeFilters.push({ field: 'category_id', operator: 'equals', value: categoryId });
  }
  if (fabricTypeId) {
    activeFilters.push({ field: 'fabric_type_id', operator: 'equals', value: fabricTypeId });
  }
  if (supplierId) {
    activeFilters.push({ field: 'supplier_id', operator: 'equals', value: supplierId });
  }

  // Map Filter fields
  const mappedFilter = activeFilters.map(f => ({
    ...f,
    field: fieldMapping[f.field] || f.field
  }));

  // Handle price bounds
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    baseQuery += ` AND p."base_price" >= $${paramIndex}`;
    bindParams.push(parseFloat(minPrice));
    paramIndex++;
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    baseQuery += ` AND p."base_price" <= $${paramIndex}`;
    bindParams.push(parseFloat(maxPrice));
    paramIndex++;
  }

  // Helper to detect UUID strings
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  // Numeric and UUID fields separation
  const numericFields = ['p.base_price', 'p.minimum_order_quantity', 'p.lead_time_days'];
  const numericFilters = mappedFilter.filter(f => numericFields.includes(f.field));
  const nonNumericFilters = mappedFilter.filter(f => !numericFields.includes(f.field));

  const uuidFilters = [];
  const textFilters = [];

  for (const f of nonNumericFilters) {
    if (isUuid(f.value) || f.field?.includes('category_id') || f.field?.includes('fabric_type_id') || f.field?.includes('supplier_id') || f.field?.includes('id')) {
      uuidFilters.push(f);
    } else {
      textFilters.push(f);
    }
  }

  for (const uf of uuidFilters) {
    if (uf.value) {
      baseQuery += ` AND ${uf.field} = $${paramIndex}`;
      bindParams.push(uf.value);
      paramIndex++;
    }
  }

  for (const nf of numericFilters) {
    if (nf.operator === 'equals' || nf.operator === 'number equals') {
      baseQuery += ` AND ${nf.field} = $${paramIndex}`;
      bindParams.push(Number(nf.value));
      paramIndex++;
    } else if (nf.operator === 'greater than' || nf.operator === 'greater than or equal') {
      baseQuery += ` AND ${nf.field} >= $${paramIndex}`;
      bindParams.push(Number(nf.value));
      paramIndex++;
    } else if (nf.operator === 'less than' || nf.operator === 'less than or equal') {
      baseQuery += ` AND ${nf.field} <= $${paramIndex}`;
      bindParams.push(Number(nf.value));
      paramIndex++;
    }
  }

  if (textFilters && textFilters.length > 0) {
    const filterResult = buildQueryFromFilters(textFilters, paramIndex);
    if (filterResult.query) {
      baseQuery += ` AND ${filterResult.query}`;
      bindParams.push(...filterResult.params);
      paramIndex += filterResult.params.length;
    }
  }

  // Sort Mapping
  let orderClause = '';
  if (sort && sort.length > 0) {
    const mappedSort = sort.map(s => ({
      ...s,
      colId: fieldMapping[s.colId] || s.colId
    }));
    orderClause = buildMultiSort(mappedSort);
  } else {
    if (sortBy === 'price_asc') {
      orderClause = ' ORDER BY p."base_price" ASC';
    } else if (sortBy === 'price_desc') {
      orderClause = ' ORDER BY p."base_price" DESC';
    } else if (sortBy === 'name') {
      orderClause = ' ORDER BY p."name" ASC';
    } else {
      orderClause = ' ORDER BY p."created_at" DESC';
    }
  }

  // Select optimized fields
  const query = `
    SELECT p."id", p."name", p."description", p."base_price", p."minimum_order_quantity",
           p."lead_time_days", p."status", p."category_id", p."fabric_type_id", p."supplier_id",
           p."unit_id", p."created_at",
           c."name" as "category_name",
           ft."name" as "fabric_type_name",
           u."name" as "unit_name",
           sp."company_name" as "supplier_name",
           COALESCE((
             SELECT SUM(wi."available_quantity")
             FROM "warehouse_inventory" wi
             JOIN "product_variants" pv2 ON wi."product_variant_id" = pv2."id"
             WHERE pv2."product_id" = p."id" AND pv2."status" = 'active'
           ), 0)::int as "available_quantity"
    ${baseQuery}
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const products = await sequelize.query(query, {
    bind: [...bindParams, parseInt(limit, 10), parseInt(offset, 10)],
    type: sequelize.QueryTypes.SELECT
  });

  if (!products || products.length === 0) return [];

  // BATCH QUERY: Fetch all images & variants for the product batch in parallel (eliminates N+1 queries!)
  const productIds = products.map(p => p.id);

  const [allImages, allVariants] = await Promise.all([
    sequelize.query(
      `SELECT "id", "product_id", "image_url", "is_primary", "display_order"
       FROM "product_images"
       WHERE "product_id" IN (:productIds)
       ORDER BY "display_order" ASC;`,
      { replacements: { productIds }, type: 'SELECT' }
    ),
    sequelize.query(
      `SELECT pv."id", pv."product_id", pv."sku", pv."price", pv."status",
              ps."name" as "size_name",
              c."name" as "color_name",
              c."hex_code",
              COALESCE((
                SELECT SUM(wi."available_quantity")
                FROM "warehouse_inventory" wi
                WHERE wi."product_variant_id" = pv."id"
              ), 0)::int as "available_quantity"
       FROM "product_variants" pv
       LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
       LEFT JOIN "colors" c ON pv."color_id" = c."id"
       WHERE pv."product_id" IN (:productIds) AND pv."status" = 'active';`,
      { replacements: { productIds }, type: 'SELECT' }
    )
  ]);

  const imageMap = {};
  for (const img of allImages) {
    if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
    imageMap[img.product_id].push(img);
  }

  const variantMap = {};
  for (const v of allVariants) {
    if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
    variantMap[v.product_id].push(v);
  }

  for (const product of products) {
    product.images = imageMap[product.id] || [];
    product.variants = variantMap[product.id] || [];
    if (product.images.length > 0) {
      const primaryImg = product.images.find(img => img.is_primary) || product.images[0];
      product.primary_image_url = primaryImg ? primaryImg.image_url : null;
    }
    product.available_quantity = Number(product.available_quantity || 0);
  }

  return products;
}

async function getProductByIdForBuyer(sequelize, productId) {
  const result = await sequelize.query(
    `SELECT p.*,
            c."name" as "category_name",
            ft."name" as "fabric_type_name",
            u."name" as "unit_name",
            sp."company_name" as "supplier_name",
            COALESCE((
              SELECT SUM(wi."available_quantity")
              FROM "warehouse_inventory" wi
              JOIN "product_variants" pv2 ON wi."product_variant_id" = pv2."id"
              WHERE pv2."product_id" = p."id" AND pv2."status" = 'active'
            ), 0)::int as "available_quantity"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     WHERE p."id" = :productId AND p."status" = 'active' AND p."is_deleted" = FALSE LIMIT 1;`,
    {
      replacements: { productId },
      type: 'SELECT'
    }
  );
  if (!result[0]) return null;
  const product = result[0];
  const [images, variants] = await Promise.all([
    getProductImages(sequelize, product.id),
    getProductVariants(sequelize, product.id)
  ]);
  product.images = images;
  product.variants = variants;
  if (product.images && product.images.length > 0) {
    const primaryImg = product.images.find(img => img.is_primary) || product.images[0];
    product.primary_image_url = primaryImg ? primaryImg.image_url : null;
  }
  product.available_quantity = Number(product.available_quantity || 0);
  return product;
}

async function getProductImages(sequelize, productId) {
  return await sequelize.query(
    `SELECT "id", "product_id", "image_url", "is_primary", "display_order" FROM "product_images" WHERE "product_id" = :productId ORDER BY "display_order" ASC;`,
    {
      replacements: { productId },
      type: 'SELECT'
    }
  );
}

async function getProductVariants(sequelize, productId) {
  return await sequelize.query(
    `SELECT pv.*,
            ps."name" as "size_name",
            c."name" as "color_name",
            c."hex_code",
            COALESCE((
              SELECT SUM(wi."available_quantity")
              FROM "warehouse_inventory" wi
              WHERE wi."product_variant_id" = pv."id"
            ), 0)::int as "available_quantity"
     FROM "product_variants" pv
     LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
     LEFT JOIN "colors" c ON pv."color_id" = c."id"
     WHERE pv."product_id" = :productId AND pv."status" = 'active';`,
    {
      replacements: { productId },
      type: 'SELECT'
    }
  );
}

module.exports = {
  getProductsForBuyer,
  getProductByIdForBuyer,
  getProductImages,
  getProductVariants
};
