// Data Access Layer for Unified Inventory Module
const { logger } = require('../../../utils/logger');
const { buildQueryFromFilters, buildMultiSort } = require('eva-utilities/utils/filter-builder-v2');

// ─── Supplier Resolving ───────────────────────────────────────────────
async function getSupplierProfileIdByUserId(sequelize, userId) {
  const result = await sequelize.query(
    `SELECT id FROM "supplier_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
    { replacements: { userId }, type: 'SELECT' }
  );
  return result[0] ? result[0].id : null;
}

// ─── Warehouse CRUD ───────────────────────────────────────────────────
async function createWarehouseRecord(sequelize, { supplierId, userId, name, addressId, newAddress, contactNumber, isDefault }) {
  const transaction = await sequelize.transaction();
  try {
    let finalAddressId = addressId || null;
    if (!finalAddressId && newAddress && newAddress.addressLine1) {
      const addrResult = await sequelize.query(
        `INSERT INTO "addresses" ("user_id", "address_line_1", "landmark", "zipcode", "address_type", "created_at", "updated_at")
         VALUES (:userId, :addressLine1, :landmark, :zipcode, 'Warehouse', NOW(), NOW())
         RETURNING *;`,
        {
          replacements: {
            userId: userId || null,
            addressLine1: newAddress.addressLine1,
            landmark: newAddress.landmark || null,
            zipcode: newAddress.zipcode || null
          },
          type: 'INSERT',
          transaction
        }
      );
      finalAddressId = addrResult[0][0].id;

      await sequelize.query(
        `INSERT INTO "supplier_addresses" ("supplier_profile_id", "address_id", "address_type", "is_primary", "created_at", "updated_at")
         VALUES (:supplierId, :addressId, 'Warehouse', FALSE, NOW(), NOW());`,
        {
          replacements: { supplierId, addressId: finalAddressId },
          type: 'INSERT',
          transaction
        }
      );
    }

    if (isDefault) {
      await sequelize.query(
        `UPDATE "warehouses" SET "is_default" = FALSE WHERE "supplier_id" = :supplierId;`,
        { replacements: { supplierId }, type: 'UPDATE', transaction }
      );
    }
    const result = await sequelize.query(
      `INSERT INTO "warehouses" ("supplier_id", "name", "address_id", "contact_number", "is_default", "created_at", "updated_at")
       VALUES (:supplierId, :name, :addressId, :contactNumber, :isDefault, NOW(), NOW())
       RETURNING *;`,
      {
        replacements: {
          supplierId,
          name,
          addressId: finalAddressId,
          contactNumber: contactNumber || null,
          isDefault: !!isDefault
        },
        type: 'INSERT',
        transaction
      }
    );
    await transaction.commit();
    return result[0][0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateWarehouseRecord(sequelize, { warehouseId, supplierId, userId, name, addressId, newAddress, contactNumber, isDefault }) {
  const transaction = await sequelize.transaction();
  try {
    let finalAddressId = addressId || null;
    if (!finalAddressId && newAddress && newAddress.addressLine1) {
      const addrResult = await sequelize.query(
        `INSERT INTO "addresses" ("user_id", "address_line_1", "landmark", "zipcode", "address_type", "created_at", "updated_at")
         VALUES (:userId, :addressLine1, :landmark, :zipcode, 'Warehouse', NOW(), NOW())
         RETURNING *;`,
        {
          replacements: {
            userId: userId || null,
            addressLine1: newAddress.addressLine1,
            landmark: newAddress.landmark || null,
            zipcode: newAddress.zipcode || null
          },
          type: 'INSERT',
          transaction
        }
      );
      finalAddressId = addrResult[0][0].id;

      await sequelize.query(
        `INSERT INTO "supplier_addresses" ("supplier_profile_id", "address_id", "address_type", "is_primary", "created_at", "updated_at")
         VALUES (:supplierId, :addressId, 'Warehouse', FALSE, NOW(), NOW());`,
        {
          replacements: { supplierId, addressId: finalAddressId },
          type: 'INSERT',
          transaction
        }
      );
    }

    if (isDefault) {
      await sequelize.query(
        `UPDATE "warehouses" SET "is_default" = FALSE WHERE "supplier_id" = :supplierId AND "id" != :warehouseId;`,
        { replacements: { supplierId, warehouseId }, type: 'UPDATE', transaction }
      );
    }
    const result = await sequelize.query(
      `UPDATE "warehouses"
       SET "name" = :name, "address_id" = :addressId, "contact_number" = :contactNumber,
           "is_default" = :isDefault, "updated_at" = NOW()
       WHERE "id" = :warehouseId AND "supplier_id" = :supplierId
       RETURNING *;`,
      {
        replacements: {
          warehouseId,
          supplierId,
          name,
          addressId: finalAddressId,
          contactNumber: contactNumber || null,
          isDefault: !!isDefault
        },
        type: 'UPDATE',
        transaction
      }
    );
    await transaction.commit();
    return result[0][0] || null;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function softDeleteWarehouse(sequelize, { warehouseId, supplierId }) {
  const result = await sequelize.query(
    `UPDATE "warehouses" SET "is_default" = FALSE, "updated_at" = NOW()
     WHERE "id" = :warehouseId AND "supplier_id" = :supplierId
     RETURNING *;`,
    { replacements: { warehouseId, supplierId }, type: 'UPDATE' }
  );
  return result[0][0] || null;
}

async function getWarehousesList(sequelize, supplierId) {
  return await sequelize.query(
    `SELECT w.*, a."address_line_1", a."city_id", a."zipcode"
     FROM "warehouses" w
     LEFT JOIN "addresses" a ON w."address_id" = a."id"
     WHERE w."supplier_id" = :supplierId ORDER BY w."is_default" DESC, w."name" ASC;`,
    { replacements: { supplierId }, type: 'SELECT' }
  );
}

async function getWarehouseById(sequelize, { warehouseId, supplierId }) {
  const result = await sequelize.query(
    `SELECT w.*, a."address_line_1", a."city_id", a."zipcode"
     FROM "warehouses" w
     LEFT JOIN "addresses" a ON w."address_id" = a."id"
     WHERE w."id" = :warehouseId AND w."supplier_id" = :supplierId LIMIT 1;`,
    { replacements: { warehouseId, supplierId }, type: 'SELECT' }
  );
  return result[0] || null;
}

// ─── Warehouse Dashboard Stats ────────────────────────────────────────
async function getWarehouseDashboardStats(sequelize, supplierId) {
  const result = await sequelize.query(
    `SELECT
       COUNT(DISTINCT wi."product_variant_id")::int as total_products,
       COALESCE(SUM(wi."quantity"), 0)::int as total_stock,
       COALESCE(SUM(wi."reserved_quantity"), 0)::int as reserved_stock,
       COALESCE(SUM(wi."available_quantity"), 0)::int as available_stock,
       COUNT(CASE WHEN wi."available_quantity" = 0 THEN 1 END)::int as out_of_stock,
       COUNT(CASE WHEN wi."available_quantity" > 0 AND wi."available_quantity" <= wi."reorder_level" THEN 1 END)::int as low_stock
     FROM "warehouse_inventory" wi
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     WHERE w."supplier_id" = :supplierId;`,
    { replacements: { supplierId }, type: 'SELECT' }
  );
  return result[0] || { total_products: 0, total_stock: 0, reserved_stock: 0, available_stock: 0, out_of_stock: 0, low_stock: 0 };
}

// ─── Inventory Assignment ─────────────────────────────────────────────
async function assignInventoryToWarehouse(sequelize, { warehouseId, productVariantId, quantity, reorderLevel, performedBy }) {
  const transaction = await sequelize.transaction();
  try {
    // Ensure performed_by column exists on inventory_transactions
    await sequelize.query(`ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "performed_by" UUID;`, { transaction });

    // Resolve productVariantId: ensure it's a valid product_variant ID
    let validVariantId = productVariantId;
    const variantCheck = await sequelize.query(
      `SELECT id FROM "product_variants" WHERE "id" = :productVariantId LIMIT 1;`,
      { replacements: { productVariantId }, type: 'SELECT', transaction }
    );

    if (!variantCheck[0]) {
      // If productVariantId is not in product_variants, check if it's a Product ID
      const productCheck = await sequelize.query(
        `SELECT id, name, slug, base_price FROM "products" WHERE "id" = :productVariantId LIMIT 1;`,
        { replacements: { productVariantId }, type: 'SELECT', transaction }
      );

      if (productCheck[0]) {
        const prod = productCheck[0];
        const existingVar = await sequelize.query(
          `SELECT id FROM "product_variants" WHERE "product_id" = :productId LIMIT 1;`,
          { replacements: { productId: prod.id }, type: 'SELECT', transaction }
        );

        if (existingVar[0]) {
          validVariantId = existingVar[0].id;
        } else {
          const newVar = await sequelize.query(
            `INSERT INTO "product_variants" ("product_id", "sku", "price", "status", "created_at", "updated_at")
             VALUES (:productId, :sku, :price, 'active', NOW(), NOW())
             RETURNING id;`,
            {
              replacements: {
                productId: prod.id,
                sku: `SKU-${String(prod.id).slice(0, 8)}`,
                price: prod.base_price || 0
              },
              type: 'INSERT',
              transaction
            }
          );
          validVariantId = newVar[0][0].id;
        }
      } else {
        throw new Error(`Product variant with ID '${productVariantId}' not found.`);
      }
    }

    // Upsert warehouse_inventory
    const result = await sequelize.query(
      `INSERT INTO "warehouse_inventory" ("warehouse_id", "product_variant_id", "quantity", "reserved_quantity", "available_quantity", "reorder_level", "created_at", "updated_at")
       VALUES (:warehouseId, :productVariantId, :quantity, 0, :quantity, :reorderLevel, NOW(), NOW())
       ON CONFLICT ("warehouse_id", "product_variant_id")
       DO UPDATE SET
         "quantity" = "warehouse_inventory"."quantity" + EXCLUDED."quantity",
         "available_quantity" = ("warehouse_inventory"."quantity" + EXCLUDED."quantity") - "warehouse_inventory"."reserved_quantity",
         "reorder_level" = EXCLUDED."reorder_level",
         "updated_at" = NOW()
       RETURNING *;`,
      { replacements: { warehouseId, productVariantId: validVariantId, quantity, reorderLevel }, type: 'INSERT', transaction }
    );
    const inv = result[0][0];

    // Record transaction
    await sequelize.query(
      `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "remarks", "performed_by", "created_at")
       VALUES (:invId, 'IN', :quantity, 'MANUAL', 'Initial stock assignment', :performedBy, NOW());`,
      { replacements: { invId: inv.id, quantity, performedBy }, type: 'INSERT', transaction }
    );

    await transaction.commit();
    return inv;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── Stock Level Listing (eva-utilities) ──────────────────────────────
async function getInventoryList(sequelize, { supplierId, warehouseId, limit = 20, offset = 0, filter = [], sort = [], search = '', lowStockOnly = false }) {
  logger.info({ supplierId, filter, sort, search, lowStockOnly }, 'Database: getInventoryList invoked');

  const fieldMapping = {
    id: 'wi.id',
    warehouse_name: 'w.name',
    sku: 'pv.sku',
    product_name: 'p.name',
    quantity: 'wi.quantity',
    reserved_quantity: 'wi.reserved_quantity',
    available_quantity: 'wi.available_quantity',
    reorder_level: 'wi.reorder_level'
  };

  let baseQuery = `
    FROM "warehouse_inventory" wi
    JOIN "warehouses" w ON wi."warehouse_id" = w."id"
    JOIN "product_variants" pv ON wi."product_variant_id" = pv."id"
    JOIN "products" p ON pv."product_id" = p."id"
    WHERE w."supplier_id" = $${1}
  `;

  const bindParams = [supplierId];
  let paramIndex = 2;

  if (warehouseId) {
    baseQuery += ` AND wi."warehouse_id" = $${paramIndex}`;
    bindParams.push(warehouseId);
    paramIndex++;
  }

  if (lowStockOnly) {
    baseQuery += ` AND wi."available_quantity" <= wi."reorder_level"`;
  }

  if (search) {
    baseQuery += ` AND (p."name" ILIKE $${paramIndex} OR pv."sku" ILIKE $${paramIndex} OR w."name" ILIKE $${paramIndex})`;
    bindParams.push(`%${search}%`);
    paramIndex++;
  }

  const mappedFilter = filter.map(f => ({ ...f, field: fieldMapping[f.field] || f.field }));
  const numericFields = ['wi.quantity', 'wi.available_quantity', 'wi.reserved_quantity', 'wi.reorder_level'];
  const numericFilters = mappedFilter.filter(f => numericFields.includes(f.field));
  const textFilters = mappedFilter.filter(f => !numericFields.includes(f.field));

  for (const nf of numericFilters) {
    if (nf.operator === 'equals' || nf.operator === 'number equals') {
      baseQuery += ` AND ${nf.field} = $${paramIndex}`; bindParams.push(Number(nf.value)); paramIndex++;
    } else if (nf.operator === 'greater than' || nf.operator === 'greater than or equal') {
      baseQuery += ` AND ${nf.field} >= $${paramIndex}`; bindParams.push(Number(nf.value)); paramIndex++;
    } else if (nf.operator === 'less than' || nf.operator === 'less than or equal') {
      baseQuery += ` AND ${nf.field} <= $${paramIndex}`; bindParams.push(Number(nf.value)); paramIndex++;
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

  const countResult = await sequelize.query(`SELECT COUNT(*)::int as total ${baseQuery}`, {
    bind: bindParams, type: sequelize.QueryTypes.SELECT
  });
  const total = countResult[0] ? countResult[0].total : 0;

  let orderClause = '';
  if (sort && sort.length > 0) {
    const mappedSort = sort.map(s => ({ ...s, colId: fieldMapping[s.colId] || s.colId }));
    orderClause = buildMultiSort(mappedSort);
  } else {
    orderClause = ' ORDER BY p."name" ASC, pv."sku" ASC';
  }

  const query = `
    SELECT wi.*, w."name" as "warehouse_name", pv."sku", p."name" as "product_name", pv."price",
           CASE WHEN wi."available_quantity" <= 0 THEN 'out_of_stock'
                WHEN wi."available_quantity" <= wi."reorder_level" THEN 'low_stock'
                ELSE 'in_stock' END as "stock_status"
    ${baseQuery}
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  const rows = await sequelize.query(query, {
    bind: [...bindParams, parseInt(limit, 10), parseInt(offset, 10)],
    type: sequelize.QueryTypes.SELECT
  });

  return { total, inventory: rows, pagination: { limit, offset, total, page: Math.floor(offset / limit) + 1, total_pages: Math.ceil(total / limit) } };
}

// ─── Single Inventory Record ──────────────────────────────────────────
async function getWarehouseInventoryById(sequelize, id) {
  const result = await sequelize.query(
    `SELECT wi.*, w."supplier_id", w."name" as "warehouse_name"
     FROM "warehouse_inventory" wi
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     WHERE wi."id" = :id LIMIT 1;`,
    { replacements: { id }, type: 'SELECT' }
  );
  return result[0] || null;
}

async function getInventoryByVariantAndWarehouse(sequelize, { productVariantId, warehouseId }) {
  const result = await sequelize.query(
    `SELECT wi.*, w."supplier_id"
     FROM "warehouse_inventory" wi
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     WHERE wi."product_variant_id" = :productVariantId AND wi."warehouse_id" = :warehouseId LIMIT 1;`,
    { replacements: { productVariantId, warehouseId }, type: 'SELECT' }
  );
  return result[0] || null;
}

async function getInventoryByVariantId(sequelize, productVariantId) {
  return await sequelize.query(
    `SELECT wi.*, w."name" as "warehouse_name", w."supplier_id", w."is_default"
     FROM "warehouse_inventory" wi
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     WHERE wi."product_variant_id" = :productVariantId
     ORDER BY w."is_default" DESC, wi."available_quantity" DESC;`,
    { replacements: { productVariantId }, type: 'SELECT' }
  );
}

// ─── Manual Stock Adjustment ──────────────────────────────────────────
async function adjustInventoryStock(sequelize, { inventoryId, quantityDelta, transactionType, referenceType, referenceId, remarks, performedBy }) {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query(`ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "performed_by" UUID;`, { transaction });

    const result = await sequelize.query(
      `UPDATE "warehouse_inventory"
       SET "quantity" = "quantity" + :quantityDelta,
           "available_quantity" = "quantity" + :quantityDelta - "reserved_quantity",
           "updated_at" = NOW()
       WHERE "id" = :inventoryId
       RETURNING *;`,
      { replacements: { inventoryId, quantityDelta }, type: 'UPDATE', transaction }
    );
    const updatedInventory = result[0][0];

    await sequelize.query(
      `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "reference_type", "reference_id", "quantity", "remarks", "performed_by", "created_at")
       VALUES (:inventoryId, :transactionType, :referenceType, :referenceId, :quantityDelta, :remarks, :performedBy, NOW());`,
      { replacements: { inventoryId, transactionType, referenceType: referenceType || null, referenceId: referenceId || null, quantityDelta, remarks: remarks || 'Manual stock adjustment', performedBy: performedBy || null }, type: 'INSERT', transaction }
    );

    await transaction.commit();
    return updatedInventory;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── Stock Transfer ───────────────────────────────────────────────────
async function transferStock(sequelize, { fromInventoryId, toWarehouseId, productVariantId, quantity, reorderLevel, performedBy }) {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query(`ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "performed_by" UUID;`, { transaction });
    // Deduct from source
    const srcResult = await sequelize.query(
      `UPDATE "warehouse_inventory"
       SET "quantity" = "quantity" - :quantity,
           "available_quantity" = "available_quantity" - :quantity,
           "updated_at" = NOW()
       WHERE "id" = :fromInventoryId AND "available_quantity" >= :quantity
       RETURNING *;`,
      { replacements: { fromInventoryId, quantity }, type: 'UPDATE', transaction }
    );
    if (!srcResult[0][0]) throw new Error('Insufficient available stock in source warehouse');
    const srcInv = srcResult[0][0];

    // Record TRANSFER_OUT
    await sequelize.query(
      `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "performed_by", "created_at")
       VALUES (:fromInventoryId, 'TRANSFER_OUT', :quantity, 'TRANSFER', :toWarehouseId, 'Stock transferred out', :performedBy, NOW());`,
      { replacements: { fromInventoryId, quantity, toWarehouseId, performedBy }, type: 'INSERT', transaction }
    );

    // Upsert destination
    const destResult = await sequelize.query(
      `INSERT INTO "warehouse_inventory" ("warehouse_id", "product_variant_id", "quantity", "reserved_quantity", "available_quantity", "reorder_level", "created_at", "updated_at")
       VALUES (:toWarehouseId, :productVariantId, :quantity, 0, :quantity, :reorderLevel, NOW(), NOW())
       ON CONFLICT ("warehouse_id", "product_variant_id")
       DO UPDATE SET
         "quantity" = "warehouse_inventory"."quantity" + EXCLUDED."quantity",
         "available_quantity" = ("warehouse_inventory"."quantity" + EXCLUDED."quantity") - "warehouse_inventory"."reserved_quantity",
         "updated_at" = NOW()
       RETURNING *;`,
      { replacements: { toWarehouseId, productVariantId, quantity, reorderLevel: reorderLevel || 0 }, type: 'INSERT', transaction }
    );
    const destInv = destResult[0][0];

    // Record TRANSFER_IN
    await sequelize.query(
      `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "performed_by", "created_at")
       VALUES (:destInvId, 'TRANSFER_IN', :quantity, 'TRANSFER', :fromInventoryId, 'Stock transferred in', :performedBy, NOW());`,
      { replacements: { destInvId: destInv.id, quantity, fromInventoryId, performedBy }, type: 'INSERT', transaction }
    );

    await transaction.commit();
    return { source: srcInv, destination: destInv };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── Order Lifecycle: Reserve (Multi-Warehouse Allocation) ───────────
async function reserveInventory(sequelize, { productVariantId, quantity, orderId, supplierId, transaction: externalTx }) {
  const transaction = externalTx || (await sequelize.transaction());
  try {
    // Ensure stock_reservations table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stock_reservations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" UUID REFERENCES "orders"("id") ON DELETE CASCADE,
        "warehouse_inventory_id" UUID NOT NULL REFERENCES "warehouse_inventory"("id") ON DELETE CASCADE,
        "product_variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "quantity" INTEGER NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'RESERVED',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    // Find all warehouses with available stock for this variant
    const warehouseInventories = await sequelize.query(
      `SELECT wi.* FROM "warehouse_inventory" wi
       JOIN "warehouses" w ON wi."warehouse_id" = w."id"
       WHERE wi."product_variant_id" = :productVariantId
         AND w."supplier_id" = :supplierId
         AND wi."available_quantity" > 0
       ORDER BY w."is_default" DESC, wi."available_quantity" DESC
       FOR UPDATE;`,
      { replacements: { productVariantId, supplierId }, type: 'SELECT', transaction }
    );

    const totalAvailable = warehouseInventories.reduce((sum, inv) => sum + (parseInt(inv.available_quantity, 10) || 0), 0);
    if (totalAvailable < quantity) {
      throw new Error(`Insufficient stock available for reservation. Needed: ${quantity}, Available: ${totalAvailable}`);
    }

    let remainingNeeded = quantity;
    const reservedItems = [];

    for (const inv of warehouseInventories) {
      if (remainingNeeded <= 0) break;
      const alloc = Math.min(remainingNeeded, parseInt(inv.available_quantity, 10));

      await sequelize.query(
        `UPDATE "warehouse_inventory"
         SET "reserved_quantity" = "reserved_quantity" + :alloc,
             "available_quantity" = "available_quantity" - :alloc,
             "updated_at" = NOW()
         WHERE "id" = :id;`,
        { replacements: { id: inv.id, alloc }, type: 'UPDATE', transaction }
      );

      await sequelize.query(
        `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "created_at")
         VALUES (:invId, 'RESERVED', :alloc, 'ORDER', :orderId, 'Stock reserved for order', NOW());`,
        { replacements: { invId: inv.id, alloc, orderId }, type: 'INSERT', transaction }
      );

      await sequelize.query(
        `INSERT INTO "stock_reservations" ("order_id", "warehouse_inventory_id", "product_variant_id", "quantity", "status", "created_at", "updated_at")
         VALUES (:orderId, :invId, :productVariantId, :alloc, 'RESERVED', NOW(), NOW());`,
        { replacements: { orderId, invId: inv.id, productVariantId, alloc }, type: 'INSERT', transaction }
      );

      reservedItems.push({ inventoryId: inv.id, allocated: alloc });
      remainingNeeded -= alloc;
    }

    if (!externalTx) await transaction.commit();
    return reservedItems;
  } catch (error) {
    if (!externalTx) await transaction.rollback();
    throw error;
  }
}

// ─── Order Lifecycle: Release Reservation ────────────────────────────
async function releaseInventory(sequelize, { productVariantId, quantity, orderId, supplierId, transaction: externalTx }) {
  const transaction = externalTx || (await sequelize.transaction());
  try {
    const reservations = await sequelize.query(
      `SELECT * FROM "stock_reservations"
       WHERE "order_id" = :orderId AND "product_variant_id" = :productVariantId AND "status" = 'RESERVED'
       FOR UPDATE;`,
      { replacements: { orderId, productVariantId }, type: 'SELECT', transaction }
    );

    if (reservations && reservations.length > 0) {
      for (const res of reservations) {
        await sequelize.query(
          `UPDATE "warehouse_inventory"
           SET "reserved_quantity" = GREATEST("reserved_quantity" - :qty, 0),
               "available_quantity" = "available_quantity" + :qty,
               "updated_at" = NOW()
           WHERE "id" = :invId;`,
          { replacements: { invId: res.warehouse_inventory_id, qty: res.quantity }, type: 'UPDATE', transaction }
        );

        await sequelize.query(
          `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "created_at")
           VALUES (:invId, 'RELEASED', :qty, 'ORDER', :orderId, 'Reservation released due to order cancellation', NOW());`,
          { replacements: { invId: res.warehouse_inventory_id, qty: res.quantity, orderId }, type: 'INSERT', transaction }
        );

        await sequelize.query(
          `UPDATE "stock_reservations" SET "status" = 'RELEASED', "updated_at" = NOW() WHERE "id" = :resId;`,
          { replacements: { resId: res.id }, type: 'UPDATE', transaction }
        );
      }
    } else {
      const inventory = await sequelize.query(
        `SELECT wi.* FROM "warehouse_inventory" wi
         JOIN "warehouses" w ON wi."warehouse_id" = w."id"
         WHERE wi."product_variant_id" = :productVariantId
           AND w."supplier_id" = :supplierId
         ORDER BY wi."reserved_quantity" DESC LIMIT 1 FOR UPDATE;`,
        { replacements: { productVariantId, supplierId }, type: 'SELECT', transaction }
      );

      if (inventory[0]) {
        const inv = inventory[0];
        const qtyToRelease = Math.min(quantity, inv.reserved_quantity || 0);
        if (qtyToRelease > 0) {
          await sequelize.query(
            `UPDATE "warehouse_inventory"
             SET "reserved_quantity" = "reserved_quantity" - :qty,
                 "available_quantity" = "available_quantity" + :qty,
                 "updated_at" = NOW()
             WHERE "id" = :id;`,
            { replacements: { id: inv.id, qty: qtyToRelease }, type: 'UPDATE', transaction }
          );

          await sequelize.query(
            `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "created_at")
             VALUES (:invId, 'RELEASED', :qty, 'ORDER', :orderId, 'Reservation released due to order cancellation', NOW());`,
            { replacements: { invId: inv.id, qty: qtyToRelease, orderId }, type: 'INSERT', transaction }
          );
        }
      }
    }

    if (!externalTx) await transaction.commit();
    return true;
  } catch (error) {
    if (!externalTx) await transaction.rollback();
    throw error;
  }
}

// ─── Order Lifecycle: Deduct on Dispatch ─────────────────────────────
async function deductInventory(sequelize, { productVariantId, quantity, orderId, supplierId, transaction: externalTx }) {
  const transaction = externalTx || (await sequelize.transaction());
  try {
    const reservations = await sequelize.query(
      `SELECT * FROM "stock_reservations"
       WHERE "order_id" = :orderId AND "product_variant_id" = :productVariantId AND "status" = 'RESERVED'
       FOR UPDATE;`,
      { replacements: { orderId, productVariantId }, type: 'SELECT', transaction }
    );

    if (reservations && reservations.length > 0) {
      for (const res of reservations) {
        await sequelize.query(
          `UPDATE "warehouse_inventory"
           SET "quantity" = GREATEST("quantity" - :qty, 0),
               "reserved_quantity" = GREATEST("reserved_quantity" - :qty, 0),
               "updated_at" = NOW()
           WHERE "id" = :invId;`,
          { replacements: { invId: res.warehouse_inventory_id, qty: res.quantity }, type: 'UPDATE', transaction }
        );

        await sequelize.query(
          `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "created_at")
           VALUES (:invId, 'OUT', :qty, 'ORDER', :orderId, 'Stock deducted on order dispatch', NOW());`,
          { replacements: { invId: res.warehouse_inventory_id, qty: res.quantity, orderId }, type: 'INSERT', transaction }
        );

        await sequelize.query(
          `UPDATE "stock_reservations" SET "status" = 'DEDUCTED', "updated_at" = NOW() WHERE "id" = :resId;`,
          { replacements: { resId: res.id }, type: 'UPDATE', transaction }
        );
      }
    } else {
      const inventory = await sequelize.query(
        `SELECT wi.* FROM "warehouse_inventory" wi
         JOIN "warehouses" w ON wi."warehouse_id" = w."id"
         WHERE wi."product_variant_id" = :productVariantId
           AND w."supplier_id" = :supplierId
         ORDER BY wi."reserved_quantity" DESC LIMIT 1 FOR UPDATE;`,
        { replacements: { productVariantId, supplierId }, type: 'SELECT', transaction }
      );

      if (inventory[0]) {
        const inv = inventory[0];
        const qtyToDeduct = Math.min(quantity, inv.reserved_quantity || inv.quantity || 0);
        if (qtyToDeduct > 0) {
          await sequelize.query(
            `UPDATE "warehouse_inventory"
             SET "quantity" = GREATEST("quantity" - :qty, 0),
                 "reserved_quantity" = GREATEST("reserved_quantity" - :qty, 0),
                 "updated_at" = NOW()
             WHERE "id" = :id;`,
            { replacements: { id: inv.id, qty: qtyToDeduct }, type: 'UPDATE', transaction }
          );

          await sequelize.query(
            `INSERT INTO "inventory_transactions" ("warehouse_inventory_id", "transaction_type", "quantity", "reference_type", "reference_id", "remarks", "created_at")
             VALUES (:invId, 'OUT', :qty, 'ORDER', :orderId, 'Stock deducted on order dispatch', NOW());`,
            { replacements: { invId: inv.id, qty: qtyToDeduct, orderId }, type: 'INSERT', transaction }
          );
        }
      }
    }

    if (!externalTx) await transaction.commit();
    return true;
  } catch (error) {
    if (!externalTx) await transaction.rollback();
    throw error;
  }
}

// ─── Availability Check ───────────────────────────────────────────────
async function checkAvailability(sequelize, { productVariantId, quantity, supplierId }) {
  const result = await sequelize.query(
    `SELECT COALESCE(SUM(wi."available_quantity"), 0)::int as total_available
     FROM "warehouse_inventory" wi
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     WHERE wi."product_variant_id" = :productVariantId AND w."supplier_id" = :supplierId;`,
    { replacements: { productVariantId, supplierId }, type: 'SELECT' }
  );
  const available = result[0] ? result[0].total_available : 0;
  return { available, sufficient: available >= quantity };
}

// ─── Transaction History ──────────────────────────────────────────────
async function getInventoryTransactions(sequelize, { supplierId, warehouseId, inventoryId, limit = 20, offset = 0 }) {
  let whereClause = `WHERE w."supplier_id" = :supplierId`;
  const replacements = { supplierId };

  if (warehouseId) { whereClause += ` AND wi."warehouse_id" = :warehouseId`; replacements.warehouseId = warehouseId; }
  if (inventoryId) { whereClause += ` AND it."warehouse_inventory_id" = :inventoryId`; replacements.inventoryId = inventoryId; }

  replacements.limit = limit;
  replacements.offset = offset;

  const countResult = await sequelize.query(
    `SELECT COUNT(*)::int as total
     FROM "inventory_transactions" it
     JOIN "warehouse_inventory" wi ON it."warehouse_inventory_id" = wi."id"
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     ${whereClause};`,
    { replacements, type: 'SELECT' }
  );
  const total = countResult[0] ? countResult[0].total : 0;

  const rows = await sequelize.query(
    `SELECT it.*, wi."product_variant_id", w."name" as "warehouse_name",
            pv."sku", p."name" as "product_name"
     FROM "inventory_transactions" it
     JOIN "warehouse_inventory" wi ON it."warehouse_inventory_id" = wi."id"
     JOIN "warehouses" w ON wi."warehouse_id" = w."id"
     JOIN "product_variants" pv ON wi."product_variant_id" = pv."id"
     JOIN "products" p ON pv."product_id" = p."id"
     ${whereClause}
     ORDER BY it."created_at" DESC
     LIMIT :limit OFFSET :offset;`,
    { replacements, type: 'SELECT' }
  );

  return { total, transactions: rows, pagination: { limit, offset, total, page: Math.floor(offset / limit) + 1, total_pages: Math.ceil(total / limit) } };
}

// ─── Get order items for inventory ops ───────────────────────────────
async function getOrderItemsForInventory(sequelize, orderId) {
  return await sequelize.query(
    `SELECT oi."product_variant_id", oi."quantity", o."supplier_id"
     FROM "order_items" oi
     JOIN "orders" o ON oi."order_id" = o."id"
     WHERE oi."order_id" = :orderId;`,
    { replacements: { orderId }, type: 'SELECT' }
  );
}

module.exports = {
  getSupplierProfileIdByUserId,
  createWarehouseRecord,
  updateWarehouseRecord,
  softDeleteWarehouse,
  getWarehousesList,
  getWarehouseById,
  getWarehouseDashboardStats,
  assignInventoryToWarehouse,
  getInventoryList,
  getWarehouseInventoryById,
  getInventoryByVariantAndWarehouse,
  getInventoryByVariantId,
  adjustInventoryStock,
  transferStock,
  reserveInventory,
  releaseInventory,
  deductInventory,
  checkAvailability,
  getInventoryTransactions,
  getOrderItemsForInventory
};
