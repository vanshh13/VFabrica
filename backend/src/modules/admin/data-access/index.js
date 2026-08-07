const bcrypt = require('bcrypt');

async function getDashboardSummary(sequelize) {
    const users = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "users" WHERE "is_deleted" = FALSE;`,
        { type: 'SELECT' }
    );
    const suppliers = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "supplier_profiles" WHERE "is_deleted" = FALSE;`,
        { type: 'SELECT' }
    );
    const pendingSuppliers = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "supplier_profiles" WHERE "approval_status" = 'pending' AND "is_deleted" = FALSE;`,
        { type: 'SELECT' }
    );
    const categories = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "categories" WHERE "is_deleted" = FALSE;`,
        { type: 'SELECT' }
    );
    const products = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "products" WHERE "is_deleted" = FALSE;`,
        { type: 'SELECT' }
    );
    const orders = await sequelize.query(
        `SELECT COUNT(*)::int AS count FROM "orders";`,
        { type: 'SELECT' }
    );

    const recentUsers = await sequelize.query(
        `SELECT u."id", u."email", u."status", u."created_at", COALESCE(array_agg(r."name") FILTER (WHERE r."name" IS NOT NULL), '{}') AS roles
     FROM "users" u
     LEFT JOIN "user_roles" ur ON ur."user_id" = u."id"
     LEFT JOIN "roles" r ON r."id" = ur."role_id"
     WHERE u."is_deleted" = FALSE
     GROUP BY u."id"
     ORDER BY u."created_at" DESC
     LIMIT 6;`,
        { type: 'SELECT' }
    );

    const recentSuppliers = await sequelize.query(
        `SELECT sp."id", sp."company_name", sp."approval_status", sp."created_at", u."email"
     FROM "supplier_profiles" sp
     JOIN "users" u ON u."id" = sp."user_id"
     WHERE sp."is_deleted" = FALSE
     ORDER BY sp."created_at" DESC
     LIMIT 6;`,
        { type: 'SELECT' }
    );

    const recentOrders = await sequelize.query(
        `SELECT o."id", o."order_number", o."grand_total", o."placed_at", os."name" AS "status", u."email" AS "buyer_email"
     FROM "orders" o
     LEFT JOIN "order_statuses" os ON os."id" = o."order_status_id"
     LEFT JOIN "users" u ON u."id" = o."buyer_id"
     ORDER BY o."placed_at" DESC
     LIMIT 6;`,
        { type: 'SELECT' }
    );

    return {
        totalUsers: users[0]?.count || 0,
        totalSuppliers: suppliers[0]?.count || 0,
        pendingSuppliers: pendingSuppliers[0]?.count || 0,
        totalCategories: categories[0]?.count || 0,
        totalProducts: products[0]?.count || 0,
        totalOrders: orders[0]?.count || 0,
        recentUsers,
        recentSuppliers,
        recentOrders
    };
}

async function listSuppliers(sequelize, approvalStatus = 'pending') {
    const condition = approvalStatus ? `AND sp."approval_status" = :approvalStatus` : '';
    return await sequelize.query(
        `SELECT sp."id", sp."user_id", sp."company_name", sp."company_description", sp."website", sp."minimum_order_quantity", sp."approval_status", sp."approved_by", sp."approved_at", sp."created_at", sp."status", u."email", u."phone"
     FROM "supplier_profiles" sp
     JOIN "users" u ON u."id" = sp."user_id"
     WHERE sp."is_deleted" = FALSE ${condition}
     ORDER BY sp."created_at" DESC;`,
        {
            replacements: approvalStatus ? { approvalStatus } : {},
            type: 'SELECT'
        }
    );
}

async function reviewSupplier(sequelize, { supplierProfileId, approvalStatus, approvedBy }) {
    const result = await sequelize.query(
        `UPDATE "supplier_profiles"
     SET "approval_status" = :approvalStatus,
         "approved_by" = :approvedBy,
         "approved_at" = CASE WHEN :approvalStatus = 'approved' THEN NOW() ELSE NULL END,
         "status" = CASE WHEN :approvalStatus = 'approved' THEN 'active' ELSE 'inactive' END,
         "updated_at" = NOW()
     WHERE "id" = :supplierProfileId AND "is_deleted" = FALSE
     RETURNING *;`,
        {
            replacements: { supplierProfileId, approvalStatus, approvedBy },
            type: 'UPDATE'
        }
    );
    return result[0][0] || null;
}

async function listUsers(sequelize) {
    return await sequelize.query(
        `SELECT u."id", u."email", u."phone", u."status", u."is_email_verified", u."is_phone_verified", u."created_at",
            COALESCE(array_agg(r."name") FILTER (WHERE r."name" IS NOT NULL), '{}') AS roles
     FROM "users" u
     LEFT JOIN "user_roles" ur ON ur."user_id" = u."id"
     LEFT JOIN "roles" r ON r."id" = ur."role_id"
     WHERE u."is_deleted" = FALSE
     GROUP BY u."id"
     ORDER BY u."created_at" DESC;`,
        { type: 'SELECT' }
    );
}

async function updateUserStatus(sequelize, { userId, status }) {
    const result = await sequelize.query(
        `UPDATE "users"
     SET "status" = :status,
         "updated_at" = NOW()
     WHERE "id" = :userId AND "is_deleted" = FALSE
     RETURNING "id", "email", "status";`,
        {
            replacements: { userId, status },
            type: 'UPDATE'
        }
    );
    return result[0][0] || null;
}

async function getCategoryBySlug(sequelize, slug) {
    const result = await sequelize.query(
        `SELECT * FROM "categories" WHERE "slug" = :slug AND "is_deleted" = FALSE LIMIT 1;`,
        {
            replacements: { slug },
            type: 'SELECT'
        }
    );
    return result[0] || null;
}

async function getCategoryById(sequelize, categoryId) {
    const result = await sequelize.query(
        `SELECT * FROM "categories" WHERE "id" = :categoryId AND "is_deleted" = FALSE LIMIT 1;`,
        {
            replacements: { categoryId },
            type: 'SELECT'
        }
    );
    return result[0] || null;
}

async function createCategory(sequelize, { parentId, name, slug, description, createdBy }) {
    const result = await sequelize.query(
        `INSERT INTO "categories" ("parent_id", "name", "slug", "description", "created_by", "created_at", "updated_at")
     VALUES (:parentId, :name, :slug, :description, :createdBy, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { parentId, name, slug, description, createdBy },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function updateCategory(sequelize, { categoryId, parentId, name, slug, description, status, updatedBy }) {
    const result = await sequelize.query(
        `UPDATE "categories"
     SET "parent_id" = :parentId,
         "name" = :name,
         "slug" = :slug,
         "description" = :description,
         "status" = :status,
         "updated_by" = :updatedBy,
         "updated_at" = NOW()
     WHERE "id" = :categoryId AND "is_deleted" = FALSE
     RETURNING *;`,
        {
            replacements: { categoryId, parentId, name, slug, description, status, updatedBy },
            type: 'UPDATE'
        }
    );
    return result[0][0] || null;
}

async function deleteCategory(sequelize, { categoryId, deletedBy }) {
    const result = await sequelize.query(
        `UPDATE "categories"
     SET "is_deleted" = TRUE,
         "deleted_at" = NOW(),
         "deleted_by" = :deletedBy,
         "updated_at" = NOW()
     WHERE "id" = :categoryId AND "is_deleted" = FALSE
     RETURNING *;`,
        {
            replacements: { categoryId, deletedBy },
            type: 'UPDATE'
        }
    );
    return result[0][0] || null;
}

async function ensureRole(sequelize, roleName) {
    const existing = await sequelize.query(
        `SELECT * FROM "roles" WHERE "name" = :roleName LIMIT 1;`,
        {
            replacements: { roleName },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "roles" ("name", "description", "created_at", "updated_at")
     VALUES (:roleName, :description, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { roleName, description: `${roleName} role` },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureUser(sequelize, { email, phone, passwordHash, status = 'active' }) {
    const existing = await sequelize.query(
        `SELECT * FROM "users" WHERE "email" = :email LIMIT 1;`,
        {
            replacements: { email },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "users" ("email", "phone", "password_hash", "status", "created_at", "updated_at")
     VALUES (:email, :phone, :passwordHash, :status, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { email, phone, passwordHash, status },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function assignUserRole(sequelize, { userId, roleId }) {
    const result = await sequelize.query(
        `INSERT INTO "user_roles" ("user_id", "role_id", "created_at")
     VALUES (:userId, :roleId, NOW())
     ON CONFLICT ("user_id", "role_id") DO NOTHING
     RETURNING *;`,
        {
            replacements: { userId, roleId },
            type: 'INSERT'
        }
    );
    return result[0][0] || null;
}

async function ensureSupplierProfile(sequelize, { userId, companyName, companyDescription, website, minimumOrderQuantity, approvalStatus }) {
    const existing = await sequelize.query(
        `SELECT * FROM "supplier_profiles" WHERE "user_id" = :userId LIMIT 1;`,
        {
            replacements: { userId },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "supplier_profiles" ("user_id", "company_name", "company_description", "website", "minimum_order_quantity", "approval_status", "status", "created_at", "updated_at")
     VALUES (:userId, :companyName, :companyDescription, :website, :minimumOrderQuantity, :approvalStatus, 'active', NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { userId, companyName, companyDescription, website, minimumOrderQuantity, approvalStatus },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureWarehouse(sequelize, { supplierId, name, contactNumber }) {
    const existing = await sequelize.query(
        `SELECT * FROM "warehouses" WHERE "supplier_id" = :supplierId LIMIT 1;`,
        {
            replacements: { supplierId },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "warehouses" ("supplier_id", "name", "contact_number", "is_default", "created_at", "updated_at")
     VALUES (:supplierId, :name, :contactNumber, TRUE, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { supplierId, name, contactNumber },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureProduct(sequelize, { supplierId, categoryId, fabricTypeId, unitId, name, slug, description, brand, basePrice, minimumOrderQuantity, leadTimeDays }) {
    const existing = await sequelize.query(
        `SELECT * FROM "products" WHERE "slug" = :slug LIMIT 1;`,
        {
            replacements: { slug },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "products" ("supplier_id", "category_id", "name", "slug", "description", "fabric_type_id", "brand", "unit_id", "base_price", "minimum_order_quantity", "lead_time_days", "status", "created_at", "updated_at")
     VALUES (:supplierId, :categoryId, :name, :slug, :description, :fabricTypeId, :brand, :unitId, :basePrice, :minimumOrderQuantity, :leadTimeDays, 'active', NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { supplierId, categoryId, fabricTypeId, unitId, name, slug, description, brand, basePrice, minimumOrderQuantity, leadTimeDays },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureProductImage(sequelize, { productId, imageUrl, displayOrder, isPrimary }) {
    const existing = await sequelize.query(
        `SELECT * FROM "product_images" WHERE "product_id" = :productId AND "image_url" = :imageUrl LIMIT 1;`,
        {
            replacements: { productId, imageUrl },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "product_images" ("product_id", "image_url", "display_order", "is_primary", "created_at", "updated_at")
     VALUES (:productId, :imageUrl, :displayOrder, :isPrimary, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { productId, imageUrl, displayOrder, isPrimary },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureVariant(sequelize, { productId, sizeId, colorId, sku, price }) {
    const existing = await sequelize.query(
        `SELECT * FROM "product_variants" WHERE "sku" = :sku LIMIT 1;`,
        {
            replacements: { sku },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "product_variants" ("product_id", "size_id", "color_id", "sku", "price", "status", "created_at", "updated_at")
     VALUES (:productId, :sizeId, :colorId, :sku, :price, 'active', NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { productId, sizeId, colorId, sku, price },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureInventory(sequelize, { warehouseId, variantId, quantity, reorderLevel }) {
    const existing = await sequelize.query(
        `SELECT * FROM "warehouse_inventory" WHERE "warehouse_id" = :warehouseId AND "product_variant_id" = :variantId LIMIT 1;`,
        {
            replacements: { warehouseId, variantId },
            type: 'SELECT'
        }
    );

    if (existing[0]) {
        return existing[0];
    }

    const result = await sequelize.query(
        `INSERT INTO "warehouse_inventory" ("warehouse_id", "product_variant_id", "quantity", "available_quantity", "reorder_level", "created_at", "updated_at")
     VALUES (:warehouseId, :variantId, :quantity, :quantity, :reorderLevel, NOW(), NOW())
     RETURNING *;`,
        {
            replacements: { warehouseId, variantId, quantity, reorderLevel },
            type: 'INSERT'
        }
    );
    return result[0][0];
}

async function ensureMasters(sequelize) {
    await sequelize.query(
        `INSERT INTO "units" ("name", "symbol", "created_at", "updated_at") VALUES
      ('Piece', 'pc', NOW(), NOW()),
      ('Set of 5', 'set-5', NOW(), NOW()),
      ('Set', 'set', NOW(), NOW()),
      ('Dozen', 'dz', NOW(), NOW()),
      ('Meter', 'm', NOW(), NOW()),
      ('Yard', 'yd', NOW(), NOW()),
      ('Roll', 'roll', NOW(), NOW()),
      ('Kg', 'kg', NOW(), NOW()),
      ('Metric Ton', 'MT', NOW(), NOW()),
      ('Bale', 'bale', NOW(), NOW()),
      ('Unit', 'unit', NOW(), NOW()),
      ('Machine', 'mach', NOW(), NOW())
     ON CONFLICT ("name") DO NOTHING;`,
        { type: 'INSERT' }
    );

    await sequelize.query(
        `INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'S', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'S');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'M', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'M');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'L', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'L');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'XL', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'XL');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'XXL', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'XXL');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'XXXL', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'XXXL');

     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Small', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Small');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Medium', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Medium');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Normal', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Normal');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Large', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Large');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Compact', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Compact');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Standard', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Standard');
     INSERT INTO "product_sizes" ("name", "created_at", "updated_at")
     SELECT 'Heavy Duty', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = 'Heavy Duty');

     INSERT INTO "product_sizes" ("name", "width", "length", "unit_id", "created_at", "updated_at")
     SELECT '60 inches', 60.00, 1.00, (SELECT "id" FROM "units" WHERE "name" = 'Meter' LIMIT 1), NOW(), NOW()
     WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = '60 inches');

     INSERT INTO "product_sizes" ("name", "width", "length", "unit_id", "created_at", "updated_at")
     SELECT '44 inches', 44.00, 1.00, (SELECT "id" FROM "units" WHERE "name" = 'Meter' LIMIT 1), NOW(), NOW()
     WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = '44 inches');

     INSERT INTO "product_sizes" ("name", "width", "length", "unit_id", "created_at", "updated_at")
     SELECT '100 meters', 1.00, 100.00, (SELECT "id" FROM "units" WHERE "name" = 'Meter' LIMIT 1), NOW(), NOW()
     WHERE NOT EXISTS (SELECT 1 FROM "product_sizes" WHERE "name" = '100 meters');`,
        { type: 'INSERT' }
    );

    await sequelize.query(
        `INSERT INTO "categories" ("name", "slug", "description", "status", "created_at", "updated_at") VALUES
      ('Fabric', 'fabric', 'Root category for all fabric items', 'active', NOW(), NOW()),
      ('Cotton', 'cotton', 'Cotton fabrics and blends', 'active', NOW(), NOW()),
      ('Silk', 'silk', 'Premium silk fabric products', 'active', NOW(), NOW()),
      ('Linen', 'linen', 'Natural linen fabrics', 'active', NOW(), NOW()),
      ('Apparel & Garments', 'apparel-garments', 'Finished clothing, shirts, sets, and apparel', 'active', NOW(), NOW()),
      ('Yarn & Fiber', 'yarn-fiber', 'Raw fibers, synthetic yarns, and cotton bales', 'active', NOW(), NOW()),
      ('Textile Machinery', 'textile-machinery', 'Weaving looms, spinning machines, and textile equipment', 'active', NOW(), NOW()),
      ('Trims & Accessories', 'trims-accessories', 'Buttons, zippers, ribbons, and garment accessories', 'active', NOW(), NOW())
     ON CONFLICT ("slug") DO NOTHING;`,
        { type: 'INSERT' }
    );

    await sequelize.query(
        `INSERT INTO "fabric_types" ("name", "description", "created_at", "updated_at") VALUES
      ('Cotton', 'Cotton fabric', NOW(), NOW()),
      ('Silk', 'Silk fabric', NOW(), NOW()),
      ('Linen', 'Linen fabric', NOW(), NOW())
     ON CONFLICT ("name") DO NOTHING;`,
        { type: 'INSERT' }
    );

    await sequelize.query(
        `INSERT INTO "colors" ("name", "hex_code", "created_at", "updated_at") VALUES
      ('Off-White', '#FDFBF7', NOW(), NOW()),
      ('Indigo Blue', '#4B0082', NOW(), NOW()),
      ('Olive Green', '#808000', NOW(), NOW()),
      ('Crimson Red', '#DC143C', NOW(), NOW())
     ON CONFLICT ("name") DO NOTHING;`,
        { type: 'INSERT' }
    );

    await sequelize.query(
        `INSERT INTO "product_attributes" ("name", "datatype", "created_at", "updated_at")
     SELECT 'GSM', 'number', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_attributes" WHERE "name" = 'GSM');

     INSERT INTO "product_attributes" ("name", "datatype", "created_at", "updated_at")
     SELECT 'Composition', 'string', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_attributes" WHERE "name" = 'Composition');

     INSERT INTO "product_attributes" ("name", "datatype", "created_at", "updated_at")
     SELECT 'Width', 'string', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_attributes" WHERE "name" = 'Width');

     INSERT INTO "product_attributes" ("name", "datatype", "created_at", "updated_at")
     SELECT 'Shrinkage', 'string', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_attributes" WHERE "name" = 'Shrinkage');

     INSERT INTO "product_attributes" ("name", "datatype", "created_at", "updated_at")
     SELECT 'Finish', 'string', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "product_attributes" WHERE "name" = 'Finish');`,
        { type: 'INSERT' }
    );
}

async function seedMarketplaceData(sequelize) {
    await ensureMasters(sequelize);

    await ensureRole(sequelize, 'ADMIN');
    await ensureRole(sequelize, 'SUPPLIER');
    await ensureRole(sequelize, 'BUYER');

    return {
        message: 'System masters and roles seeded successfully'
    };
}

module.exports = {
    getDashboardSummary,
    listSuppliers,
    reviewSupplier,
    listUsers,
    updateUserStatus,
    getCategoryBySlug,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    seedMarketplaceData,
    ensureRole,
    assignUserRole
};