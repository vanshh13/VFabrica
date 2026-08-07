// Data Access Layer for Supplier Experience (Profile, Inventory, Orders, Dashboard)
const { logger } = require('../../../utils/logger');
const { buildQueryFromFilters, buildMultiSort, validateFiltersAndSorts } = require('eva-utilities/utils/filter-builder-v2');

// ─── Profile & Address ────────────────────────────────────────────────
async function getSupplierByUserId(sequelize, userId) {
    const result = await sequelize.query(
        `SELECT * FROM "supplier_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
        {
            replacements: { userId },
            type: 'SELECT'
        }
    );
    return result[0] || null;
}

async function createSupplierProfile(sequelize, { userId, companyName, companyDescription, website, minimumOrderQuantity }) {
    const result = await sequelize.query(
        `INSERT INTO "supplier_profiles" ("user_id", "company_name", "company_description", "website", "minimum_order_quantity", "approval_status", "created_at", "updated_at")
     VALUES (:userId, :companyName, :companyDescription, :website, :minimumOrderQuantity, 'pending', NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { userId, companyName, companyDescription, website, minimumOrderQuantity },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function updateSupplierProfile(sequelize, { profileId, companyName, companyDescription, website, minimumOrderQuantity }) {
    const result = await sequelize.query(
        `UPDATE "supplier_profiles"
     SET "company_name" = :companyName,
         "company_description" = :companyDescription,
         "website" = :website,
         "minimum_order_quantity" = :minimumOrderQuantity,
         "updated_at" = NOW()
     WHERE "id" = :profileId AND "is_deleted" = FALSE
     RETURNING *;`,
        {
            replacements: { profileId, companyName, companyDescription, website, minimumOrderQuantity },
            type: 'UPDATE'
        }
    );
    return result[0][0] || null;
}

async function createAddress(sequelize, { userId, addressLine1, landmark, zipcode, cityId }) {
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
    const validCityId = isUuid(cityId) ? cityId.trim() : null;

    const result = await sequelize.query(
        `INSERT INTO "addresses" ("user_id", "address_line_1", "landmark", "zipcode", "city_id", "address_type", "created_at", "updated_at")
     VALUES (:userId, :addressLine1, :landmark, :zipcode, :cityId, 'Warehouse', NOW(), NOW())
     RETURNING *;`,
        {
            replacements: {
                userId,
                addressLine1: addressLine1 || null,
                landmark: landmark || null,
                zipcode: zipcode ? String(zipcode).trim() : null,
                cityId: validCityId
            },
            type: 'INSERT'
        }
    );
    return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function linkSupplierAddress(sequelize, { supplierProfileId, addressId, isPrimary }) {
    const result = await sequelize.query(
        `INSERT INTO "supplier_addresses" ("supplier_profile_id", "address_id", "address_type", "is_primary", "created_at", "updated_at")
     VALUES (:supplierProfileId, :addressId, 'Warehouse', :isPrimary, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { supplierProfileId, addressId, isPrimary },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function getSupplierAddresses(sequelize, supplierProfileId) {
    return await sequelize.query(
        `SELECT a.*, sa."is_primary", sa."address_type"
     FROM "addresses" a
     JOIN "supplier_addresses" sa ON a."id" = sa."address_id"
     WHERE sa."supplier_profile_id" = :supplierProfileId AND a."is_deleted" = FALSE;`,
        {
            replacements: { supplierProfileId },
            type: 'SELECT'
        }
    );
}

// ─── Dashboard Stats ───────────────────────────────────────────────
async function getSupplierProductStats(sequelize, supplierId) {
    const total = await sequelize.query(
        `SELECT COUNT(*)::int as count FROM "products" WHERE "supplier_id" = :supplierId AND "is_deleted" = FALSE;`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
    const active = await sequelize.query(
        `SELECT COUNT(*)::int as count FROM "products" WHERE "supplier_id" = :supplierId AND "status" = 'active' AND "is_deleted" = FALSE;`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
    return {
        totalProducts: total[0] ? total[0].count : 0,
        activeProducts: active[0] ? active[0].count : 0
    };
}

async function getSupplierOrderStats(sequelize, supplierId) {
    const pending = await sequelize.query(
        `SELECT COUNT(*)::int as count FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     WHERE o."supplier_id" = :supplierId AND os."name" = 'Pending';`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
    const recent = await sequelize.query(
        `SELECT o.*, os."name" as "status"
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     WHERE o."supplier_id" = :supplierId
     ORDER BY o."placed_at" DESC LIMIT 5;`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
    return {
        pendingOrders: pending[0] ? pending[0].count : 0,
        recentOrders: recent
    };
}

async function getInventoryAlerts(sequelize, supplierId) {
    return await sequelize.query(
        `SELECT p."name" as "product_name", pv."sku", wi."quantity", wi."reorder_level"
     FROM "warehouse_inventory" wi
     JOIN "product_variants" pv ON wi."product_variant_id" = pv."id"
     JOIN "products" p ON pv."product_id" = p."id"
     WHERE p."supplier_id" = :supplierId AND wi."quantity" <= wi."reorder_level" AND p."is_deleted" = FALSE;`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
}

// ─── Inventory / Catalog ───────────────────────────────────────────
async function getSupplierProducts(sequelize, supplierId, options = {}) {
    let extraWhere = '';
    let replacements = { supplierId };
    let sortClause = ' ORDER BY p."created_at" DESC';
    let limitClause = '';

    if (options && typeof options === 'object') {
        let rawFilters = Array.isArray(options.filters) ? options.filters : [];
        let rawSort = Array.isArray(options.sort) ? options.sort : (Array.isArray(options.sortArray) ? options.sortArray : []);

        if (rawSort.length === 0 && (options.sortBy || options.colId)) {
            rawSort = [{ colId: options.sortBy || options.colId, sort: options.sortOrder || options.sort || 'desc' }];
        }

        if (rawFilters.length === 0) {
            const reserved = ['filters', 'sort', 'sortArray', 'sortBy', 'sortOrder', 'colId', 'page', 'limit'];
            Object.keys(options).forEach(k => {
                if (!reserved.includes(k) && options[k] !== undefined && options[k] !== null && options[k] !== '') {
                    rawFilters.push({ field: k, operator: 'equals', value: options[k] });
                }
            });
        }

        if (rawFilters.length > 0) {
            const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
            const mappedFilters = [];
            let paramCounter = 0;

            for (const f of rawFilters) {
                let field = f.field;
                let operator = f.operator || 'equals';
                if (operator === 'eq' || operator === '=') operator = 'equals';
                if (operator === 'ne' || operator === '!=') operator = 'does not equal';
                if (operator === 'gt' || operator === '>') operator = 'greater than';
                if (operator === 'gte' || operator === '>=') operator = 'greater than or equal';
                if (operator === 'lt' || operator === '<') operator = 'less than';
                if (operator === 'lte' || operator === '<=') operator = 'less than or equal';
                if (operator === 'like' || operator === 'includes') operator = 'contains';
                if (operator === 'in') operator = 'is in';

                if (field === 'category_name' || field === 'category') field = 'c."name"';
                else if (field === 'name') field = 'p."name"';
                else if (field === 'status') field = 'p."status"';
                else if (field === 'base_price' || field === 'price') field = 'p."base_price"';
                else if (field === 'created_at') field = 'p."created_at"';
                else if (field === 'categoryId' || field === 'category_id') field = 'p."category_id"';
                else if (field === 'fabricTypeId' || field === 'fabric_type_id') field = 'p."fabric_type_id"';
                else if (field === 'unitId' || field === 'unit_id') field = 'p."unit_id"';
                else if (!field.includes('"') && !field.includes('.')) field = `p."${field}"`;

                if (isUuid(f.value) || field.includes('category_id') || field.includes('fabric_type_id') || field.includes('supplier_id') || field.includes('id') || field.includes('unit_id')) {
                    const key = `eva_uuid_${paramCounter++}`;
                    extraWhere += ` AND ${field} = :${key}`;
                    replacements[key] = f.value;
                } else {
                    mappedFilters.push({ field, operator, value: f.value });
                }
            }

            if (mappedFilters.length > 0) {
                try {
                    const { filters: validFilters } = validateFiltersAndSorts(mappedFilters, []);
                    const filterRes = buildQueryFromFilters(validFilters, 1);
                    if (filterRes.query) {
                        let whereStr = filterRes.query;
                        filterRes.params.forEach((val, i) => {
                            const key = `eva_p_${i}`;
                            whereStr = whereStr.replace(`$${i + 1}`, `:${key}`);
                            replacements[key] = val;
                        });
                        extraWhere += ` AND (${whereStr.trim()})`;
                    }
                } catch (err) {
                    logger.warn({ error: err.message }, 'eva-utilities product filter validation warning');
                }
            }
        }

        if (rawSort.length > 0) {
            const mappedSort = rawSort.map(s => {
                let colId = s.colId || s.field;
                if (colId === 'category_name' || colId === 'category') colId = 'c."name"';
                else if (colId === 'name') colId = 'p."name"';
                else if (colId === 'status') colId = 'p."status"';
                else if (colId === 'base_price' || colId === 'price') colId = 'p."base_price"';
                else if (colId === 'unit_name' || colId === 'unit') colId = 'u."name"';
                else if (!colId.includes('"') && !colId.includes('.')) colId = `p."${colId}"`;
                return { colId, sort: (s.sort || s.order || 'desc').toLowerCase() };
            });
            try {
                const { sort: validSort } = validateFiltersAndSorts([], mappedSort);
                const sortRes = buildMultiSort(validSort);
                if (sortRes) {
                    sortClause = sortRes;
                }
            } catch (err) {
                logger.warn({ error: err.message }, 'eva-utilities product sort validation warning');
            }
        }

        if (options.page !== undefined || options.limit !== undefined) {
            const page = Math.max(1, parseInt(options.page) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(options.limit) || 10));
            const offset = (page - 1) * limit;
            replacements.limit = limit;
            replacements.offset = offset;
            limitClause = ` LIMIT :limit OFFSET :offset`;
        }
    }

    const sql = `SELECT p.*, c."name" as "category_name", u."name" as "unit_name"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     WHERE p."supplier_id" = :supplierId AND p."is_deleted" = FALSE ${extraWhere}
     ${sortClause}
     ${limitClause};`;

    return await sequelize.query(sql, { replacements, type: 'SELECT' });
}
async function getProductImagesByProductIds(sequelize, productIds) {
    if (!productIds || productIds.length === 0) return [];
    return await sequelize.query(
        `SELECT * FROM "product_images" WHERE "product_id" IN (:productIds) ORDER BY "display_order" ASC;`,
        { replacements: { productIds }, type: 'SELECT' }
    );
}

async function getProductVariantsByProductIds(sequelize, productIds) {
    if (!productIds || productIds.length === 0) return [];
    return await sequelize.query(
        `SELECT pv.*, ps."name" as "size_name", c."name" as "color_name", c."hex_code"
     FROM "product_variants" pv
     LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
     LEFT JOIN "colors" c ON pv."color_id" = c."id"
     WHERE pv."product_id" IN (:productIds);`,
        { replacements: { productIds }, type: 'SELECT' }
    );
}

async function createProduct(sequelize, { supplierId, categoryId, fabricTypeId, unitId, brand, name, slug, description, basePrice, minimumOrderQuantity, leadTimeDays, status }, transaction) {
    const result = await sequelize.query(
        `INSERT INTO "products" ("supplier_id", "category_id", "fabric_type_id", "unit_id", "brand", "name", "slug", "description", "base_price", "minimum_order_quantity", "lead_time_days", "status", "created_at", "updated_at")
     VALUES (:supplierId, :categoryId, :fabricTypeId, :unitId, :brand, :name, :slug, :description, :basePrice, :minimumOrderQuantity, :leadTimeDays, :status, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { supplierId, categoryId, fabricTypeId, unitId, brand, name, slug, description, basePrice, minimumOrderQuantity, leadTimeDays, status },
            type: 'INSERT',
            transaction
        }
    );
    return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function updateProduct(sequelize, { productId, categoryId, fabricTypeId, unitId, brand, name, slug, description, basePrice, minimumOrderQuantity, leadTimeDays, status }, transaction) {
    const result = await sequelize.query(
        `UPDATE "products"
     SET "category_id" = :categoryId,
         "fabric_type_id" = :fabricTypeId,
         "unit_id" = :unitId,
         "brand" = :brand,
         "name" = :name,
         "slug" = :slug,
         "description" = :description,
         "base_price" = :basePrice,
         "minimum_order_quantity" = :minimumOrderQuantity,
         "lead_time_days" = :leadTimeDays,
         "status" = :status,
         "updated_at" = NOW()
     WHERE "id" = :productId AND "is_deleted" = FALSE
     RETURNING *;`,
        {
            replacements: { productId, categoryId, fabricTypeId, unitId, brand, name, slug, description, basePrice, minimumOrderQuantity, leadTimeDays, status },
            type: 'UPDATE',
            transaction
        }
    );
    return result[0][0] || null;
}

async function softDeleteProduct(sequelize, { productId, deletedBy }, transaction) {
    const result = await sequelize.query(
        `UPDATE "products"
     SET "is_deleted" = TRUE,
         "deleted_at" = NOW(),
         "deleted_by" = :deletedBy
     WHERE "id" = :productId AND "is_deleted" = FALSE
     RETURNING *;`,
        { replacements: { productId, deletedBy: deletedBy || null }, type: 'UPDATE', transaction }
    );
    return result[0][0] || null;
}

async function createProductImage(sequelize, { productId, imageUrl, displayOrder, isPrimary }, transaction) {
    const result = await sequelize.query(
        `INSERT INTO "product_images" ("product_id", "image_url", "display_order", "is_primary", "created_at", "updated_at")
     VALUES (:productId, :imageUrl, :displayOrder, :isPrimary, NOW(), NOW())
     RETURNING *;`,
        { replacements: { productId, imageUrl, displayOrder, isPrimary }, type: 'INSERT', transaction }
    );
    return result[0][0];
}

async function getProductImages(sequelize, productId) {
    return await sequelize.query(
        `SELECT * FROM "product_images" WHERE "product_id" = :productId ORDER BY "display_order" ASC;`,
        { replacements: { productId }, type: 'SELECT' }
    );
}

async function deleteProductImages(sequelize, productId, transaction) {
    return await sequelize.query(
        `DELETE FROM "product_images" WHERE "product_id" = :productId;`,
        { replacements: { productId }, type: 'DELETE', transaction }
    );
}

async function createProductVariant(sequelize, { productId, sizeId, colorId, sku, price, status = 'active' }, transaction) {
    const result = await sequelize.query(
        `INSERT INTO "product_variants" ("product_id", "size_id", "color_id", "sku", "price", "status", "created_at", "updated_at")
     VALUES (:productId, :sizeId, :colorId, :sku, :price, :status, NOW(), NOW())
     RETURNING *;`,
        { replacements: { productId, sizeId, colorId, sku, price, status }, type: 'INSERT', transaction }
    );
    return result[0][0];
}

async function getProductVariants(sequelize, productId) {
    return await sequelize.query(
        `SELECT pv.*, ps."name" as "size_name", c."name" as "color_name", c."hex_code"
     FROM "product_variants" pv
     LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
     LEFT JOIN "colors" c ON pv."color_id" = c."id"
     WHERE pv."product_id" = :productId;`,
        { replacements: { productId }, type: 'SELECT' }
    );
}

async function deleteProductVariants(sequelize, productId, transaction) {
    return await sequelize.query(
        `DELETE FROM "product_variants" WHERE "product_id" = :productId;`,
        { replacements: { productId }, type: 'DELETE', transaction }
    );
}

async function createWarehouse(sequelize, { supplierId, name, addressId, contactNumber, isDefault }) {
    const result = await sequelize.query(
        `INSERT INTO "warehouses" ("supplier_id", "name", "address_id", "contact_number", "is_default", "created_at", "updated_at")
     VALUES (:supplierId, :name, :addressId, :contactNumber, :isDefault, NOW(), NOW())
     RETURNING *;`,
        { replacements: { supplierId, name, addressId, contactNumber, isDefault }, type: 'INSERT' }
    );
    return result[0][0];
}

async function getSupplierWarehouses(sequelize, supplierId) {
    return await sequelize.query(
        `SELECT * FROM "warehouses" WHERE "supplier_id" = :supplierId;`,
        { replacements: { supplierId }, type: 'SELECT' }
    );
}

async function upsertInventory(sequelize, { warehouseId, variantId, quantity, reorderLevel }, transaction) {
    const result = await sequelize.query(
        `INSERT INTO "warehouse_inventory" ("warehouse_id", "product_variant_id", "quantity", "available_quantity", "reorder_level", "created_at", "updated_at")
     VALUES (:warehouseId, :variantId, :quantity, :quantity, :reorderLevel, NOW(), NOW())
     ON CONFLICT ("warehouse_id", "product_variant_id")
     DO UPDATE SET "quantity" = EXCLUDED."quantity", "available_quantity" = EXCLUDED."quantity", "reorder_level" = EXCLUDED."reorder_level", "updated_at" = NOW()
     RETURNING *;`,
        { replacements: { warehouseId, variantId, quantity, reorderLevel }, type: 'INSERT', transaction }
    );
    return result[0][0];
}

async function getInventoryByVariantId(sequelize, variantId) {
    return await sequelize.query(
        `SELECT * FROM "warehouse_inventory" WHERE "product_variant_id" = :variantId;`,
        { replacements: { variantId }, type: 'SELECT' }
    );
}

async function getSupplierProductById(sequelize, { supplierId, productId }) {
    const result = await sequelize.query(
        `SELECT p.*, c."name" as "category_name", ft."name" as "fabric_type_name", u."name" as "unit_name", sp."company_name" as "supplier_name"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     WHERE p."id" = :productId AND p."supplier_id" = :supplierId AND p."is_deleted" = FALSE LIMIT 1;`,
        { replacements: { supplierId, productId }, type: 'SELECT' }
    );
    return result[0] || null;
}

async function getSupplierProductImages(sequelize, { supplierId, productId }) {
    return await sequelize.query(
        `SELECT pi.*
     FROM "product_images" pi
     JOIN "products" p ON pi."product_id" = p."id"
     WHERE pi."product_id" = :productId AND p."supplier_id" = :supplierId AND p."is_deleted" = FALSE
     ORDER BY pi."is_primary" DESC, pi."display_order" ASC, pi."created_at" ASC;`,
        { replacements: { supplierId, productId }, type: 'SELECT' }
    );
}

async function getSupplierProductVariants(sequelize, { supplierId, productId }) {
    return await sequelize.query(
        `SELECT pv.*, ps."name" as "size_name", ps."width", ps."length", c."name" as "color_name", c."hex_code"
     FROM "product_variants" pv
     JOIN "products" p ON pv."product_id" = p."id"
     LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
     LEFT JOIN "colors" c ON pv."color_id" = c."id"
     WHERE pv."product_id" = :productId AND p."supplier_id" = :supplierId AND p."is_deleted" = FALSE
     ORDER BY pv."created_at" ASC;`,
        { replacements: { supplierId, productId }, type: 'SELECT' }
    );
}

async function getSupplierVariantAttributes(sequelize, variantIds) {
    if (!variantIds || variantIds.length === 0) {
        return [];
    }

    return await sequelize.query(
        `SELECT pav.*, pa."name" as "attribute_name", pa."datatype" as "attribute_datatype"
     FROM "product_attribute_values" pav
     JOIN "product_attributes" pa ON pav."attribute_id" = pa."id"
     WHERE pav."product_variant_id" IN (:variantIds)
     ORDER BY pa."name" ASC;`,
        { replacements: { variantIds }, type: 'SELECT' }
    );
}

async function getSupplierInventorySummary(sequelize, { supplierId, productId, productIds = [] }) {
    const replacements = { supplierId, productId: productId || null, productIds };
    const productFilter = productId
        ? `AND p."id" = :productId`
        : (Array.isArray(productIds) && productIds.length > 0 ? `AND p."id" IN (:productIds)` : '');

    return await sequelize.query(
        `SELECT pv."product_id", pv."id" as "product_variant_id", COALESCE(SUM(wi."quantity"), 0)::int as "total_quantity",
            COALESCE(SUM(wi."reserved_quantity"), 0)::int as "reserved_quantity",
            COALESCE(SUM(wi."available_quantity"), 0)::int as "available_quantity"
     FROM "product_variants" pv
     JOIN "products" p ON pv."product_id" = p."id"
     LEFT JOIN "warehouse_inventory" wi ON wi."product_variant_id" = pv."id"
     WHERE p."supplier_id" = :supplierId AND p."is_deleted" = FALSE ${productFilter}
     GROUP BY pv."product_id", pv."id";`,
        { replacements, type: 'SELECT' }
    );
}

async function getProductImageById(sequelize, imageId) {
    const result = await sequelize.query(
        `SELECT * FROM "product_images" WHERE "id" = :imageId LIMIT 1;`,
        { replacements: { imageId }, type: 'SELECT' }
    );
    return result[0] || null;
}

async function deleteProductImageById(sequelize, { imageId, supplierId }) {
    const result = await sequelize.query(
        `DELETE FROM "product_images"
     WHERE "id" = :imageId
       AND "product_id" IN (SELECT id FROM "products" WHERE "supplier_id" = :supplierId AND "is_deleted" = FALSE)
     RETURNING *;`,
        { replacements: { imageId, supplierId }, type: 'DELETE' }
    );
    return result[0][0] || null;
}

async function reorderProductImages(sequelize, { supplierId, productId, items }) {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    const transaction = await sequelize.transaction();
    try {
        const updated = [];
        for (const item of items) {
            const result = await sequelize.query(
                `UPDATE "product_images"
         SET "display_order" = :displayOrder,
             "is_primary" = :isPrimary,
             "updated_at" = NOW()
         WHERE "id" = :imageId
           AND "product_id" = :productId
           AND "product_id" IN (SELECT id FROM "products" WHERE "supplier_id" = :supplierId AND "is_deleted" = FALSE)
         RETURNING *;`,
                {
                    replacements: {
                        imageId: item.imageId,
                        productId,
                        supplierId,
                        displayOrder: Number(item.displayOrder) || 0,
                        isPrimary: !!item.isPrimary
                    },
                    type: 'UPDATE',
                    transaction
                }
            );
            if (result[0][0]) {
                updated.push(result[0][0]);
            }
        }
        await transaction.commit();
        return updated;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getProductVariantById(sequelize, variantId) {
    const result = await sequelize.query(
        `SELECT pv.*, p."supplier_id", p."name" as "product_name", p."status" as "product_status"
     FROM "product_variants" pv
     JOIN "products" p ON pv."product_id" = p."id"
     WHERE pv."id" = :variantId LIMIT 1;`,
        { replacements: { variantId }, type: 'SELECT' }
    );
    return result[0] || null;
}

async function createProductAttributeValue(sequelize, { productVariantId, attributeId, value }, transaction) {
    const result = await sequelize.query(
        `INSERT INTO "product_attribute_values" ("product_variant_id", "attribute_id", "value", "created_at", "updated_at")
     VALUES (:productVariantId, :attributeId, :value, NOW(), NOW())
     RETURNING *;`,
        { replacements: { productVariantId, attributeId, value }, type: 'INSERT', transaction }
    );
    return result[0][0];
}

async function deleteProductAttributeValuesByVariantId(sequelize, variantId, transaction) {
    return await sequelize.query(
        `DELETE FROM "product_attribute_values" WHERE "product_variant_id" = :variantId;`,
        { replacements: { variantId }, type: 'DELETE', transaction }
    );
}

async function updateProductVariant(sequelize, { variantId, sizeId, colorId, sku, price, status }, transaction) {
    const result = await sequelize.query(
        `UPDATE "product_variants"
     SET "size_id" = :sizeId,
         "color_id" = :colorId,
         "sku" = :sku,
         "price" = :price,
         "status" = :status,
         "updated_at" = NOW()
     WHERE "id" = :variantId
     RETURNING *;`,
        { replacements: { variantId, sizeId, colorId, sku, price, status }, type: 'UPDATE', transaction }
    );
    return result[0][0] || null;
}

async function deleteProductVariantById(sequelize, { supplierId, variantId }, transaction) {
    const result = await sequelize.query(
        `DELETE FROM "product_variants"
     WHERE "id" = :variantId
       AND "product_id" IN (SELECT id FROM "products" WHERE "supplier_id" = :supplierId AND "is_deleted" = FALSE)
     RETURNING *;`,
        { replacements: { supplierId, variantId }, type: 'DELETE', transaction }
    );
    return result[0][0] || null;
}

async function getProductAttributeDefinitions(sequelize) {
    return await sequelize.query(
        `SELECT * FROM "product_attributes" ORDER BY "name" ASC;`,
        { type: 'SELECT' }
    );
}

async function updateProductStatus(sequelize, { supplierId, productId, status }, transaction) {
    const result = await sequelize.query(
        `UPDATE "products"
     SET "status" = :status,
         "updated_at" = NOW()
     WHERE "id" = :productId AND "supplier_id" = :supplierId AND "is_deleted" = FALSE
     RETURNING *;`,
        { replacements: { supplierId, productId, status }, type: 'UPDATE', transaction }
    );
    return result[0][0] || null;
}

// ─── Order Management ──────────────────────────────────────────────
async function getSupplierOrders(sequelize, supplierId, options = {}) {
    let extraWhere = '';
    let replacements = { supplierId };
    let sortClause = ' ORDER BY o."placed_at" DESC';
    let limitClause = '';

    if (options && typeof options === 'object') {
        let rawFilters = Array.isArray(options.filters) ? options.filters : [];
        let rawSort = Array.isArray(options.sort) ? options.sort : (Array.isArray(options.sortArray) ? options.sortArray : []);

        if (rawSort.length === 0 && (options.sortBy || options.colId)) {
            rawSort = [{ colId: options.sortBy || options.colId, sort: options.sortOrder || options.sort || 'desc' }];
        }

        if (rawFilters.length === 0) {
            const reserved = ['filters', 'sort', 'sortArray', 'sortBy', 'sortOrder', 'colId', 'page', 'limit'];
            Object.keys(options).forEach(k => {
                if (!reserved.includes(k) && options[k] !== undefined && options[k] !== null && options[k] !== '') {
                    rawFilters.push({ field: k, operator: 'equals', value: options[k] });
                }
            });
        }

        if (rawFilters.length > 0) {
            const mappedFilters = rawFilters.map(f => {
                let field = f.field;
                let operator = f.operator || 'equals';
                if (operator === 'eq' || operator === '=') operator = 'equals';
                if (operator === 'ne' || operator === '!=') operator = 'does not equal';
                if (operator === 'gt' || operator === '>') operator = 'greater than';
                if (operator === 'gte' || operator === '>=') operator = 'greater than or equal';
                if (operator === 'lt' || operator === '<') operator = 'less than';
                if (operator === 'lte' || operator === '<=') operator = 'less than or equal';
                if (operator === 'like' || operator === 'includes') operator = 'contains';
                if (operator === 'in') operator = 'is in';

                if (field === 'status') {
                    field = 'os."name"';
                    if (f.value === 'Ready for Dispatch' || f.value === 'Ready') {
                        return { field: 'os."name"', operator: 'contains', value: 'Ready' };
                    }
                }
                else if (field === 'placed_at') field = 'o."placed_at"';
                else if (field === 'grand_total') field = 'o."grand_total"';
                else if (field === 'order_number') field = 'o."order_number"';
                else if (!field.includes('"') && !field.includes('.')) field = `o."${field}"`;

                return { field, operator, value: f.value };
            });

            try {
                const { filters: validFilters } = validateFiltersAndSorts(mappedFilters, []);
                const filterRes = buildQueryFromFilters(validFilters, 1);
                if (filterRes.query) {
                    let whereStr = filterRes.query;
                    filterRes.params.forEach((val, i) => {
                        const key = `eva_p_${i}`;
                        whereStr = whereStr.replace(`$${i + 1}`, `:${key}`);
                        replacements[key] = val;
                    });
                    extraWhere = ` AND (${whereStr.trim()})`;
                }
            } catch (err) {
                logger.warn({ error: err.message }, 'eva-utilities filter validation warning');
            }
        }

        if (rawSort.length > 0) {
            const mappedSort = rawSort.map(s => {
                let colId = s.colId || s.field;
                if (colId === 'status') colId = 'os."name"';
                else if (colId === 'placed_at') colId = 'o."placed_at"';
                else if (colId === 'grand_total') colId = 'o."grand_total"';
                else if (!colId.includes('"') && !colId.includes('.')) colId = `o."${colId}"`;
                return { colId, sort: (s.sort || s.order || 'desc').toLowerCase() };
            });
            try {
                const { sort: validSort } = validateFiltersAndSorts([], mappedSort);
                const sortRes = buildMultiSort(validSort);
                if (sortRes) {
                    sortClause = sortRes;
                }
            } catch (err) {
                logger.warn({ error: err.message }, 'eva-utilities sort validation warning');
            }
        }

        if (options.page !== undefined || options.limit !== undefined) {
            const page = Math.max(1, parseInt(options.page) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(options.limit) || 10));
            const offset = (page - 1) * limit;
            replacements.limit = limit;
            replacements.offset = offset;
            limitClause = ` LIMIT :limit OFFSET :offset`;
        }
    }

    const sql = `SELECT o.*, os."name" as "status",
             sa."address_line_1" as "shipping_address_line_1", sa."landmark" as "shipping_landmark", sa."zipcode" as "shipping_zipcode",
             COUNT(*) OVER()::int as total_count
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     LEFT JOIN "addresses" sa ON o."shipping_address_id" = sa."id"
     WHERE o."supplier_id" = :supplierId ${extraWhere}
     ${sortClause}
     ${limitClause};`;

    const orders = await sequelize.query(sql, { replacements, type: 'SELECT' });
    for (const order of orders) {
        order.items = await getOrderItems(sequelize, order.id);
    }
    return orders;
}

async function getOrderById(sequelize, orderId) {
    const result = await sequelize.query(
        `SELECT o.*, os."name" as "status"
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     WHERE o."id" = :orderId LIMIT 1;`,
        { replacements: { orderId }, type: 'SELECT' }
    );
    return result[0] || null;
}

async function getOrderItems(sequelize, orderId) {
    return await sequelize.query(
        `SELECT oi.*, pv."sku", COALESCE(p."name", 'Product') as "product_name"
     FROM "order_items" oi
     LEFT JOIN "product_variants" pv ON oi."product_variant_id" = pv."id"
     LEFT JOIN "products" p ON pv."product_id" = p."id"
     WHERE oi."order_id" = :orderId;`,
        { replacements: { orderId }, type: 'SELECT' }
    );
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

async function updateOrderStatus(sequelize, { orderId, statusId }) {
    const result = await sequelize.query(
        `UPDATE "orders" SET "order_status_id" = :statusId, "updated_at" = NOW() WHERE "id" = :orderId RETURNING *;`,
        { replacements: { orderId, statusId }, type: 'UPDATE' }
    );
    return result[0][0] || null;
}

async function createOrderStatusHistory(sequelize, { orderId, statusId, remarks, changedBy }) {
    const result = await sequelize.query(
        `INSERT INTO "order_status_history" ("order_id", "status_id", "remarks", "changed_by", "changed_at")
     VALUES (:orderId, :statusId, :remarks, :changedBy, NOW())
     RETURNING *;`,
        { replacements: { orderId, statusId, remarks, changedBy }, type: 'INSERT' }
    );
    return result[0][0];
}

module.exports = {
    getSupplierByUserId,
    createSupplierProfile,
    updateSupplierProfile,
    createAddress,
    linkSupplierAddress,
    getSupplierAddresses,
    getSupplierProductStats,
    getSupplierOrderStats,
    getInventoryAlerts,
    getSupplierProducts,
    getProductImagesByProductIds,
    getProductVariantsByProductIds,
    getSupplierProductById,
    getSupplierProductImages,
    getSupplierProductVariants,
    getSupplierVariantAttributes,
    getSupplierInventorySummary,
    getProductImageById,
    deleteProductImageById,
    reorderProductImages,
    getProductVariantById,
    createProductAttributeValue,
    deleteProductAttributeValuesByVariantId,
    updateProductVariant,
    deleteProductVariantById,
    getProductAttributeDefinitions,
    updateProductStatus,
    createProduct,
    updateProduct,
    softDeleteProduct,
    createProductImage,
    getProductImages,
    deleteProductImages,
    createProductVariant,
    getProductVariants,
    deleteProductVariants,
    createWarehouse,
    getSupplierWarehouses,
    upsertInventory,
    getInventoryByVariantId,
    getSupplierOrders,
    getOrderById,
    getOrderItems,
    getOrderStatusByName,
    updateOrderStatus,
    createOrderStatusHistory
};
