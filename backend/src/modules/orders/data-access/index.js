// Data Access Layer for Unified Orders Module
const { logger } = require('../../../utils/logger');
const { buildQueryFromFilters, buildMultiSort } = require('eva-utilities/utils/filter-builder-v2');

// ─── Order Creation ───────────────────────────────────────────────────
async function getPendingOrderStatus(sequelize) {
  const result = await sequelize.query(
    `SELECT * FROM "order_statuses" WHERE "name" = 'Pending' LIMIT 1;`,
    { type: 'SELECT' }
  );
  return result[0] || null;
}

async function getOrderStatusByName(sequelize, name) {
  if (!name) return null;
  const trimmed = String(name).trim();

  // 1. Try exact/case-insensitive match
  let result = await sequelize.query(
    `SELECT * FROM "order_statuses" WHERE "name" ILIKE :name LIMIT 1;`,
    { replacements: { name: trimmed }, type: 'SELECT' }
  );

  if (result[0]) return result[0];

  // 2. Try alias mapping
  const aliasMap = {
    'ready for dispatch': 'Ready',
    'ready_for_dispatch': 'Ready',
    'ready-for-dispatch': 'Ready',
    'dispatched': 'Dispatched',
    'in transit': 'Dispatched',
    'shipped': 'Dispatched'
  };

  const alias = aliasMap[trimmed.toLowerCase()];
  if (alias) {
    result = await sequelize.query(
      `SELECT * FROM "order_statuses" WHERE "name" ILIKE :name LIMIT 1;`,
      { replacements: { name: alias }, type: 'SELECT' }
    );
    if (result[0]) return result[0];
  }

  // 3. Fallback: match by prefix word
  const firstWord = trimmed.split(' ')[0];
  result = await sequelize.query(
    `SELECT * FROM "order_statuses" WHERE "name" ILIKE :pattern LIMIT 1;`,
    { replacements: { pattern: `${firstWord}%` }, type: 'SELECT' }
  );

  if (result[0]) return result[0];

  // 4. Auto-provision missing status name into order_statuses table
  try {
    const inserted = await sequelize.query(
      `INSERT INTO "order_statuses" ("name", "created_at", "updated_at")
       VALUES (:name, NOW(), NOW())
       ON CONFLICT ("name") DO NOTHING
       RETURNING *;`,
      { replacements: { name: trimmed }, type: 'INSERT' }
    );
    if (inserted[0] && inserted[0][0]) return inserted[0][0];

    const reFetch = await sequelize.query(
      `SELECT * FROM "order_statuses" WHERE "name" ILIKE :name LIMIT 1;`,
      { replacements: { name: trimmed }, type: 'SELECT' }
    );
    return reFetch[0] || null;
  } catch (err) {
    logger.warn({ error: err.message }, 'Failed auto-inserting order status');
    return null;
  }
}

async function createOrderRecord(sequelize, { orderNumber, buyerId, supplierId, billingAddressId, shippingAddressId, subtotal, discount, tax, shippingCharge, grandTotal, orderStatusId }) {
  const result = await sequelize.query(
    `INSERT INTO "orders" ("order_number", "buyer_id", "supplier_id", "billing_address_id", "shipping_address_id", "subtotal", "discount", "tax", "shipping_charge", "grand_total", "order_status_id", "placed_at", "created_at", "updated_at")
     VALUES (:orderNumber, :buyerId, :supplierId, :billingAddressId, :shippingAddressId, :subtotal, :discount, :tax, :shippingCharge, :grandTotal, :orderStatusId, NOW(), NOW(), NOW())
     RETURNING *;`,
    {
      replacements: { orderNumber, buyerId, supplierId, billingAddressId, shippingAddressId, subtotal, discount, tax, shippingCharge, grandTotal, orderStatusId },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

async function createOrderItemRecord(sequelize, { orderId, productVariantId, quantity, unitPrice, totalPrice }) {
  const result = await sequelize.query(
    `INSERT INTO "order_items" ("order_id", "product_variant_id", "quantity", "unit_price", "total_price", "created_at", "updated_at")
     VALUES (:orderId, :productVariantId, :quantity, :unitPrice, :totalPrice, NOW(), NOW())
     RETURNING *;`,
    {
      replacements: { orderId, productVariantId, quantity, unitPrice, totalPrice },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

async function createOrderStatusHistoryRecord(sequelize, { orderId, statusId, remarks, changedBy }) {
  const result = await sequelize.query(
    `INSERT INTO "order_status_history" ("order_id", "status_id", "remarks", "changed_by", "changed_at")
     VALUES (:orderId, :statusId, :remarks, :changedBy, NOW())
     RETURNING *;`,
    {
      replacements: { orderId, statusId, remarks, changedBy },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

// ─── Supplier Resolving ───────────────────────────────────────────────
async function getSupplierProfileIdByUserId(sequelize, userId) {
  const result = await sequelize.query(
    `SELECT id FROM "supplier_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
    { replacements: { userId }, type: 'SELECT' }
  );
  return result[0] ? result[0].id : null;
}

// ─── Query Listing with Filtering (eva-utilities) ────────────────────
async function getOrdersList(sequelize, { userId, supplierId, limit = 20, offset = 0, filter = [], sort = [], search = '' }) {
  logger.info({ userId, supplierId, filter, sort, search }, 'Database: getOrdersList invoked');

  const fieldMapping = {
    id: 'o.id',
    order_number: 'o.order_number',
    subtotal: 'o.subtotal',
    grand_total: 'o.grand_total',
    placed_at: 'o.placed_at',
    status: 'os.name',
    supplier_name: 'sp.company_name'
  };

  let baseQuery = `
    FROM "orders" o
    JOIN "order_statuses" os ON o."order_status_id" = os."id"
    LEFT JOIN "supplier_profiles" sp ON o."supplier_id" = sp."id"
    WHERE 1=1
  `;

  const bindParams = [];
  let paramIndex = 1;

  // Role Filtering
  if (userId) {
    baseQuery += ` AND o."buyer_id" = $${paramIndex}`;
    bindParams.push(userId);
    paramIndex++;
  } else if (supplierId) {
    baseQuery += ` AND o."supplier_id" = $${paramIndex}`;
    bindParams.push(supplierId);
    paramIndex++;
  }

  // Global Search
  if (search) {
    baseQuery += ` AND (o."order_number" ILIKE $${paramIndex} OR sp."company_name" ILIKE $${paramIndex} OR os."name" ILIKE $${paramIndex})`;
    bindParams.push(`%${search}%`);
    paramIndex++;
  }

  // Map Filter fields
  const mappedFilter = filter.map(f => ({
    ...f,
    field: fieldMapping[f.field] || f.field
  }));

  // Numeric fields
  const numericFields = ['o.subtotal', 'o.grand_total'];
  const numericFilters = mappedFilter.filter(f => numericFields.includes(f.field));
  const textFilters = mappedFilter.filter(f => !numericFields.includes(f.field));

  // Handle numeric filters
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

  // Text/Categorical Filters
  if (textFilters && textFilters.length > 0) {
    const filterResult = buildQueryFromFilters(textFilters, paramIndex);
    if (filterResult.query) {
      baseQuery += ` AND ${filterResult.query}`;
      bindParams.push(...filterResult.params);
      paramIndex += filterResult.params.length;
    }
  }

  // Count Query
  const countResult = await sequelize.query(`SELECT COUNT(*)::int as total ${baseQuery}`, {
    bind: bindParams,
    type: sequelize.QueryTypes.SELECT
  });
  const total = countResult[0] ? countResult[0].total : 0;

  // Sort Mapping
  let orderClause = '';
  if (sort && sort.length > 0) {
    const mappedSort = sort.map(s => ({
      ...s,
      colId: fieldMapping[s.colId] || s.colId
    }));
    orderClause = buildMultiSort(mappedSort);
  } else {
    orderClause = ' ORDER BY o."placed_at" DESC';
  }

  // Data Query
  const query = `
    SELECT o.*, os."name" as "status", sp."company_name" as "supplier_name"
    ${baseQuery}
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  const rows = await sequelize.query(query, {
    bind: [...bindParams, parseInt(limit, 10), parseInt(offset, 10)],
    type: sequelize.QueryTypes.SELECT
  });

  return {
    total,
    orders: rows,
    pagination: {
      limit,
      offset,
      total,
      page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(total / limit)
    }
  };
}

// ─── Order Detail ─────────────────────────────────────────────────────
async function getOrderById(sequelize, orderId) {
  const result = await sequelize.query(
    `SELECT o.*, os."name" as "status", sp."company_name" as "supplier_name"
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     LEFT JOIN "supplier_profiles" sp ON o."supplier_id" = sp."id"
     WHERE o."id" = :orderId LIMIT 1;`,
    { replacements: { orderId }, type: 'SELECT' }
  );
  return result[0] || null;
}

async function getOrderItems(sequelize, orderId) {
  return await sequelize.query(
    `SELECT oi.*, pv."sku", COALESCE(p."name", 'Product') as "product_name", p."id" as "product_id"
     FROM "order_items" oi
     LEFT JOIN "product_variants" pv ON oi."product_variant_id" = pv."id"
     LEFT JOIN "products" p ON pv."product_id" = p."id"
     WHERE oi."order_id" = :orderId;`,
    { replacements: { orderId }, type: 'SELECT' }
  );
}

async function getOrderStatusHistory(sequelize, orderId) {
  return await sequelize.query(
    `SELECT osh.*, os."name" as "status_name", u."full_name" as "changed_by_name"
     FROM "order_status_history" osh
     JOIN "order_statuses" os ON osh."status_id" = os."id"
     LEFT JOIN "users" u ON osh."changed_by" = u."id"
     WHERE osh."order_id" = :orderId
     ORDER BY osh."changed_at" ASC;`,
    { replacements: { orderId }, type: 'SELECT' }
  );
}

// ─── Update Order Status ──────────────────────────────────────────────
async function updateOrderStatus(sequelize, { orderId, statusId }) {
  const result = await sequelize.query(
    `UPDATE "orders" SET "order_status_id" = :statusId, "updated_at" = NOW() WHERE "id" = :orderId RETURNING *;`,
    { replacements: { orderId, statusId }, type: 'UPDATE' }
  );
  return result[0][0] || null;
}

module.exports = {
  getPendingOrderStatus,
  getOrderStatusByName,
  createOrderRecord,
  createOrderItemRecord,
  createOrderStatusHistoryRecord,
  getSupplierProfileIdByUserId,
  getOrdersList,
  getOrderById,
  getOrderItems,
  getOrderStatusHistory,
  updateOrderStatus
};
