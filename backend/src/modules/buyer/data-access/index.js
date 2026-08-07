// Data Access Layer for Buyer Experience (Profile, Onboarding, Checkout, Orders)
const { logger } = require('../../../utils/logger');

// ─── Profile & Address ────────────────────────────────────────────────
async function getBuyerByUserId(sequelize, userId) {
  const result = await sequelize.query(
    `SELECT * FROM "buyer_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
    {
      replacements: { userId },
      type: 'SELECT'
    }
  );
  if (result && result[0]) return result[0];

  // Auto-provision buyer profile if none exists for active user
  try {
    const userRes = await sequelize.query(
      `SELECT "email" FROM "users" WHERE "id" = :userId LIMIT 1;`,
      { replacements: { userId }, type: 'SELECT' }
    );
    const u = userRes[0] || {};
    const defaultCompanyName = u.email ? `Buyer (${u.email.split('@')[0]})` : 'Individual Buyer';

    await createBuyerProfile(sequelize, {
      userId,
      companyName: defaultCompanyName,
      buyerType: 'Individual',
      businessType: null,
      industry: null,
      preferences: null
    });

    const reFetch = await sequelize.query(
      `SELECT * FROM "buyer_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
      { replacements: { userId }, type: 'SELECT' }
    );
    return reFetch[0] || null;
  } catch (err) {
    logger.error({ error: err.message, userId }, 'Failed to auto-create buyer profile');
    const reFetch = await sequelize.query(
      `SELECT * FROM "buyer_profiles" WHERE "user_id" = :userId AND "is_deleted" = FALSE LIMIT 1;`,
      { replacements: { userId }, type: 'SELECT' }
    );
    return reFetch[0] || null;
  }
}

async function createBuyerProfile(sequelize, { userId, companyName, buyerType, businessType, industry, preferences }) {
  const result = await sequelize.query(
    `INSERT INTO "buyer_profiles" ("user_id", "company_name", "buyer_type", "business_type", "industry", "preferences", "created_at", "updated_at")
     VALUES (:userId, :companyName, :buyerType, :businessType, :industry, :preferences, NOW(), NOW())
     RETURNING *;`,
    {
      replacements: {
        userId,
        companyName: companyName || null,
        buyerType: buyerType || 'Individual',
        businessType: businessType || null,
        industry: industry || null,
        preferences: preferences ? JSON.stringify(preferences) : null
      },
      type: 'INSERT'
    }
  );
  return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function updateBuyerProfile(sequelize, { profileId, companyName, buyerType, businessType, industry, preferences }) {
  const result = await sequelize.query(
    `UPDATE "buyer_profiles"
     SET "company_name" = :companyName,
         "buyer_type" = :buyerType,
         "business_type" = :businessType,
         "industry" = :industry,
         "preferences" = :preferences,
         "updated_at" = NOW()
     WHERE "id" = :profileId AND "is_deleted" = FALSE
     RETURNING *;`,
    {
      replacements: {
        profileId,
        companyName,
        buyerType,
        businessType,
        industry,
        preferences: preferences ? JSON.stringify(preferences) : null
      },
      type: 'UPDATE'
    }
  );
  return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function createAddress(sequelize, { userId, addressLine1, landmark, zipcode, cityId, addressType }) {
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  const validCityId = isUuid(cityId) ? cityId.trim() : null;

  const result = await sequelize.query(
    `INSERT INTO "addresses" ("user_id", "address_line_1", "landmark", "zipcode", "city_id", "address_type", "created_at", "updated_at")
     VALUES (:userId, :addressLine1, :landmark, :zipcode, :cityId, :addressType, NOW(), NOW())
     RETURNING *;`,
    {
      replacements: {
        userId,
        addressLine1: addressLine1 || null,
        landmark: landmark || null,
        zipcode: zipcode ? String(zipcode).trim() : null,
        cityId: validCityId,
        addressType: addressType || 'Shipping'
      },
      type: 'INSERT'
    }
  );
  return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function linkBuyerAddress(sequelize, { buyerProfileId, addressId, addressType, isPrimary }) {
  const result = await sequelize.query(
    `INSERT INTO "buyer_addresses" ("buyer_profile_id", "address_id", "address_type", "is_primary", "created_at", "updated_at")
     VALUES (:buyerProfileId, :addressId, :addressType, :isPrimary, NOW(), NOW())
     RETURNING *;`,
    {
      replacements: { buyerProfileId, addressId, addressType: addressType || 'Shipping', isPrimary },
      type: 'INSERT'
    }
  );
  return (Array.isArray(result[0]) ? result[0][0] : result[0]) || result;
}

async function getBuyerAddresses(sequelize, buyerProfileId) {
  return await sequelize.query(
    `SELECT a.*, ba."is_primary", ba."address_type"
     FROM "addresses" a
     JOIN "buyer_addresses" ba ON a."id" = ba."address_id"
     WHERE ba."buyer_profile_id" = :buyerProfileId AND a."is_deleted" = FALSE;`,
    {
      replacements: { buyerProfileId },
      type: 'SELECT'
    }
  );
}

async function addBuyerAddress(sequelize, userId, { addressLine1, landmark, zipcode, cityId, addressType = 'Shipping', isPrimary = false }) {
  const profile = await getBuyerByUserId(sequelize, userId);
  if (!profile) throw new Error('Buyer profile not found. Please complete onboarding first.');

  const address = await createAddress(sequelize, {
    userId,
    addressLine1,
    landmark,
    zipcode,
    cityId,
    addressType
  });

  if (isPrimary) {
    await sequelize.query(
      `UPDATE "buyer_addresses" SET "is_primary" = FALSE WHERE "buyer_profile_id" = :profileId AND "address_type" = :addressType;`,
      { replacements: { profileId: profile.id, addressType }, type: 'UPDATE' }
    );
  }

  await linkBuyerAddress(sequelize, {
    buyerProfileId: profile.id,
    addressId: address.id,
    addressType,
    isPrimary: Boolean(isPrimary)
  });

  return await getBuyerAddresses(sequelize, profile.id);
}

async function deleteBuyerAddress(sequelize, userId, addressId) {
  const profile = await getBuyerByUserId(sequelize, userId);
  if (!profile) throw new Error('Buyer profile not found.');

  await sequelize.query(
    `DELETE FROM "buyer_addresses" WHERE "buyer_profile_id" = :profileId AND "address_id" = :addressId;`,
    { replacements: { profileId: profile.id, addressId }, type: 'DELETE' }
  );

  await sequelize.query(
    `UPDATE "addresses" SET "is_deleted" = TRUE WHERE "id" = :addressId AND "user_id" = :userId;`,
    { replacements: { addressId, userId }, type: 'UPDATE' }
  );

  return await getBuyerAddresses(sequelize, profile.id);
}

// ─── Order & Checkout ───────────────────────────────────────────────
async function getPendingOrderStatus(sequelize) {
  const result = await sequelize.query(
    `SELECT * FROM "order_statuses" WHERE "name" = 'Pending' LIMIT 1;`,
    { type: 'SELECT' }
  );
  return result[0] || null;
}

async function createOrder(sequelize, { orderNumber, buyerId, supplierId, billingAddressId, shippingAddressId, subtotal, discount, tax, shippingCharge, grandTotal, orderStatusId }) {
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

async function createOrderItem(sequelize, { orderId, productVariantId, quantity, unitPrice, totalPrice }) {
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

async function createOrderStatusHistory(sequelize, { orderId, statusId, remarks, changedBy }) {
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

async function getBuyerOrders(sequelize, buyerId) {
  const orders = await sequelize.query(
    `SELECT o.*, os."name" as "status", sp."company_name" as "supplier_name",
            sa."address_line_1" as "shipping_address_line_1", sa."landmark" as "shipping_landmark", sa."zipcode" as "shipping_zipcode"
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     LEFT JOIN "supplier_profiles" sp ON o."supplier_id" = sp."id"
     LEFT JOIN "addresses" sa ON o."shipping_address_id" = sa."id"
     WHERE o."buyer_id" = :buyerId
     ORDER BY o."placed_at" DESC;`,
    { replacements: { buyerId }, type: 'SELECT' }
  );

  for (const order of orders) {
    order.items = await getBuyerOrderItems(sequelize, order.id);
  }

  return orders;
}

async function getBuyerOrderById(sequelize, orderId, buyerId) {
  const result = await sequelize.query(
    `SELECT o.*, os."name" as "status", sp."company_name" as "supplier_name",
            sa."address_line_1" as "shipping_address_line_1", sa."landmark" as "shipping_landmark", sa."zipcode" as "shipping_zipcode"
     FROM "orders" o
     JOIN "order_statuses" os ON o."order_status_id" = os."id"
     LEFT JOIN "supplier_profiles" sp ON o."supplier_id" = sp."id"
     LEFT JOIN "addresses" sa ON o."shipping_address_id" = sa."id"
     WHERE o."id" = :orderId AND o."buyer_id" = :buyerId LIMIT 1;`,
    { replacements: { orderId, buyerId }, type: 'SELECT' }
  );
  if (!result[0]) return null;
  const order = result[0];
  order.items = await getBuyerOrderItems(sequelize, order.id);
  return order;
}

async function getBuyerOrderItems(sequelize, orderId) {
  return await sequelize.query(
    `SELECT oi.*, pv."sku", COALESCE(p."name", 'Product') as "product_name", p."id" as "product_id"
     FROM "order_items" oi
     LEFT JOIN "product_variants" pv ON oi."product_variant_id" = pv."id"
     LEFT JOIN "products" p ON pv."product_id" = p."id"
     WHERE oi."order_id" = :orderId;`,
    { replacements: { orderId }, type: 'SELECT' }
  );
}

// ─── Marketplace Products Search & Details ────────────────────────────
async function getMarketplaceProducts(sequelize, { search, categoryId, fabricTypeId, colorId, brand, supplierId, minPrice, maxPrice, minMoq, limit = 20, offset = 0, sort = 'newest' }) {
  let where = `WHERE p."status" IN ('active', 'published') AND p."is_deleted" = FALSE`;
  const replacements = {};

  if (search) {
    where += ` AND (p."name" ILIKE :search OR p."description" ILIKE :search OR sp."company_name" ILIKE :search)`;
    replacements.search = `%${search}%`;
  }
  if (categoryId) {
    where += ` AND p."category_id" = :categoryId`;
    replacements.categoryId = categoryId;
  }
  if (fabricTypeId) {
    where += ` AND p."fabric_type_id" = :fabricTypeId`;
    replacements.fabricTypeId = fabricTypeId;
  }
  if (brand) {
    where += ` AND p."brand" ILIKE :brand`;
    replacements.brand = `%${brand}%`;
  }
  if (supplierId) {
    where += ` AND (p."supplier_id" = :supplierId OR sp."id" = :supplierId)`;
    replacements.supplierId = supplierId;
  }
  if (minPrice) {
    where += ` AND p."base_price" >= :minPrice`;
    replacements.minPrice = Number(minPrice);
  }
  if (maxPrice) {
    where += ` AND p."base_price" <= :maxPrice`;
    replacements.maxPrice = Number(maxPrice);
  }
  if (minMoq) {
    where += ` AND p."minimum_order_quantity" <= :minMoq`;
    replacements.minMoq = Number(minMoq);
  }

  let orderBy = `ORDER BY p."created_at" DESC`;
  if (sort === 'price_asc') orderBy = `ORDER BY p."base_price" ASC`;
  else if (sort === 'price_desc') orderBy = `ORDER BY p."base_price" DESC`;
  else if (sort === 'name') orderBy = `ORDER BY p."name" ASC`;

  replacements.limit = Number(limit);
  replacements.offset = Number(offset);

  const countResult = await sequelize.query(
    `SELECT COUNT(DISTINCT p."id")::int as total
     FROM "products" p
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     ${where};`,
    { replacements, type: 'SELECT' }
  );
  const total = countResult[0] ? countResult[0].total : 0;

  const rows = await sequelize.query(
    `SELECT p.*,
            c."name" as "category_name",
            ft."name" as "fabric_type_name",
            u."name" as "unit_name",
            sp."id" as "supplier_profile_id",
            sp."company_name" as "supplier_name",
            sp."company_description" as "supplier_description",
            sp."website" as "supplier_website",
            (SELECT pi."image_url" FROM "product_images" pi WHERE pi."product_id" = p."id" ORDER BY pi."is_primary" DESC, pi."display_order" ASC LIMIT 1) as "primary_image_url",
            COALESCE(SUM(wi."available_quantity"), 0)::int as "available_quantity"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     LEFT JOIN "product_variants" pv ON p."id" = pv."product_id"
     LEFT JOIN "warehouse_inventory" wi ON pv."id" = wi."product_variant_id"
     ${where}
     GROUP BY p."id", c."name", ft."name", u."name", sp."id", sp."company_name", sp."company_description", sp."website"
     ${orderBy}
     LIMIT :limit OFFSET :offset;`,
    { replacements, type: 'SELECT' }
  );

  return {
    total,
    items: rows,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getProductDetailsForBuyer(sequelize, productId) {
  const productRes = await sequelize.query(
    `SELECT p.*,
            c."name" as "category_name",
            ft."name" as "fabric_type_name",
            u."name" as "unit_name",
            sp."id" as "supplier_profile_id",
            sp."company_name" as "supplier_name",
            sp."company_description" as "supplier_description",
            sp."website" as "supplier_website",
            COALESCE(SUM(wi."available_quantity"), 0)::int as "available_quantity"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     LEFT JOIN "product_variants" pv ON p."id" = pv."product_id"
     LEFT JOIN "warehouse_inventory" wi ON pv."id" = wi."product_variant_id"
     WHERE p."id" = :productId AND p."status" IN ('active', 'published') AND p."is_deleted" = FALSE
     GROUP BY p."id", c."name", ft."name", u."name", sp."id", sp."company_name", sp."company_description", sp."website" LIMIT 1;`,
    { replacements: { productId }, type: 'SELECT' }
  );

  if (!productRes[0]) return null;
  const product = productRes[0];

  const images = await sequelize.query(
    `SELECT id, image_url, is_primary, display_order FROM "product_images" WHERE "product_id" = :productId ORDER BY "is_primary" DESC, "display_order" ASC;`,
    { replacements: { productId }, type: 'SELECT' }
  );

  const variants = await sequelize.query(
    `SELECT pv.id, pv.sku, pv.price, ps.name as size_name, c.name as color_name,
            COALESCE(SUM(wi.available_quantity), 0)::int as available_quantity
     FROM "product_variants" pv
     LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
     LEFT JOIN "colors" c ON pv."color_id" = c."id"
     LEFT JOIN "warehouse_inventory" wi ON pv."id" = wi."product_variant_id"
     WHERE pv."product_id" = :productId AND pv."status" = 'active'
     GROUP BY pv.id, ps.name, c.name;`,
    { replacements: { productId }, type: 'SELECT' }
  );

  let attributes = [];
  try {
    attributes = await sequelize.query(
      `SELECT pav.id, pa.name as attribute_name, pav.value as attribute_value
       FROM "product_attribute_values" pav
       JOIN "product_attributes" pa ON pav."attribute_id" = pa."id"
       JOIN "product_variants" pv ON pav."product_variant_id" = pv."id"
       WHERE pv."product_id" = :productId;`,
      { replacements: { productId }, type: 'SELECT' }
    );
  } catch (err) {
    attributes = [];
  }

  return {
    ...product,
    images,
    variants,
    attributes
  };
}

async function getProductRecommendations(sequelize, { categoryId, fabricTypeId, excludeProductId, limit = 6 }) {
  let where = `WHERE p."status" IN ('active', 'published') AND p."is_deleted" = FALSE`;
  const replacements = { limit: Number(limit) };

  if (excludeProductId) {
    where += ` AND p."id" != :excludeProductId`;
    replacements.excludeProductId = excludeProductId;
  }
  if (categoryId) {
    where += ` AND p."category_id" = :categoryId`;
    replacements.categoryId = categoryId;
  } else if (fabricTypeId) {
    where += ` AND p."fabric_type_id" = :fabricTypeId`;
    replacements.fabricTypeId = fabricTypeId;
  }

  const recommendations = await sequelize.query(
    `SELECT p.*, c."name" as "category_name", sp."company_name" as "supplier_name",
            (SELECT pi."image_url" FROM "product_images" pi WHERE pi."product_id" = p."id" ORDER BY pi."is_primary" DESC, pi."display_order" ASC LIMIT 1) as "primary_image_url",
            COALESCE(SUM(wi."available_quantity"), 0)::int as "available_quantity"
     FROM "products" p
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     LEFT JOIN "product_variants" pv ON p."id" = pv."product_id"
     LEFT JOIN "warehouse_inventory" wi ON pv."id" = wi."product_variant_id"
     ${where}
     GROUP BY p."id", c."name", sp."company_name"
     ORDER BY RANDOM()
     LIMIT :limit;`,
    { replacements, type: 'SELECT' }
  );

  return recommendations;
}

// ─── Persistent Cart Operations ───────────────────────────────────────
async function ensureCartExists(sequelize, userId, transaction) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "carts" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "cart_items" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "cart_id" UUID NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
      "product_variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "unique_cart_variant" UNIQUE ("cart_id", "product_variant_id")
    );
  `, { transaction });

  const result = await sequelize.query(
    `INSERT INTO "carts" ("user_id", "created_at", "updated_at")
     VALUES (:userId, NOW(), NOW())
     ON CONFLICT ("user_id") DO UPDATE SET "updated_at" = NOW()
     RETURNING *;`,
    { replacements: { userId }, type: 'INSERT', transaction }
  );
  return result[0][0];
}

async function getCart(sequelize, userId) {
  await ensureCartExists(sequelize, userId);
  const items = await sequelize.query(
    `SELECT ci.id as cart_item_id, ci.quantity, ci.product_variant_id,
            pv.sku, pv.price as variant_price,
            p.id as product_id, p.name as product_name, p.base_price, p.supplier_id, p.minimum_order_quantity,
            sp.company_name as supplier_name,
            (SELECT pi.image_url FROM "product_images" pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1) as image_url,
            COALESCE(SUM(wi.available_quantity), 0)::int as available_quantity
     FROM "cart_items" ci
     JOIN "carts" c ON ci.cart_id = c.id
     JOIN "product_variants" pv ON ci.product_variant_id = pv.id
     JOIN "products" p ON pv.product_id = p.id
     LEFT JOIN "supplier_profiles" sp ON p.supplier_id = sp.id
     LEFT JOIN "warehouse_inventory" wi ON pv.id = wi.product_variant_id
     WHERE c.user_id = :userId
     GROUP BY ci.id, ci.quantity, ci.product_variant_id, pv.sku, pv.price, p.id, p.name, p.base_price, p.supplier_id, p.minimum_order_quantity, sp.company_name;`,
    { replacements: { userId }, type: 'SELECT' }
  );

  return items;
}

async function addToCart(sequelize, userId, { productVariantId, productId, quantity = 1 }) {
  const transaction = await sequelize.transaction();
  try {
    const cart = await ensureCartExists(sequelize, userId, transaction);

    let targetVariantId = productVariantId;
    if (!targetVariantId && productId) {
      const v = await sequelize.query(
        `SELECT id FROM "product_variants" WHERE "product_id" = :productId AND "status" = 'active' LIMIT 1;`,
        { replacements: { productId }, type: 'SELECT', transaction }
      );
      targetVariantId = v[0]?.id;
    }

    if (!targetVariantId) {
      throw new Error('Valid Product Variant ID is required');
    }

    // Stock & MOQ validation
    const prodRes = await sequelize.query(
      `SELECT p.minimum_order_quantity, p.id FROM "products" p JOIN "product_variants" pv ON pv.product_id = p.id WHERE pv.id = :targetVariantId LIMIT 1;`,
      { replacements: { targetVariantId }, type: 'SELECT', transaction }
    );
    const moq = prodRes[0]?.minimum_order_quantity ? Math.max(1, parseInt(prodRes[0].minimum_order_quantity, 10)) : 1;

    const stockRes = await sequelize.query(
      `SELECT COALESCE(SUM("available_quantity"), 0)::int as total FROM "warehouse_inventory" WHERE "product_variant_id" = :targetVariantId;`,
      { replacements: { targetVariantId }, type: 'SELECT', transaction }
    );
    const available = stockRes[0] ? stockRes[0].total : 0;

    const existing = await sequelize.query(
      `SELECT quantity FROM "cart_items" WHERE "cart_id" = :cartId AND "product_variant_id" = :targetVariantId LIMIT 1;`,
      { replacements: { cartId: cart.id, targetVariantId }, type: 'SELECT', transaction }
    );
    const currentQty = existing[0] ? existing[0].quantity : 0;

    // When item is NOT in cart, initialize quantity to MOQ (or requested quantity if greater)
    let finalQtyToAdd = quantity;
    if (currentQty === 0) {
      finalQtyToAdd = Math.max(moq, quantity || moq);
    }
    const nextQty = currentQty + finalQtyToAdd;

    if (available > 0 && nextQty > available) {
      throw new Error(`Cannot add quantity. Requested ${nextQty} exceeds available stock (${available})`);
    }

    await sequelize.query(
      `INSERT INTO "cart_items" ("cart_id", "product_variant_id", "quantity", "created_at", "updated_at")
       VALUES (:cartId, :targetVariantId, :finalQtyToAdd, NOW(), NOW())
       ON CONFLICT ("cart_id", "product_variant_id")
       DO UPDATE SET "quantity" = "cart_items"."quantity" + EXCLUDED."quantity", "updated_at" = NOW();`,
      { replacements: { cartId: cart.id, targetVariantId, finalQtyToAdd }, type: 'INSERT', transaction }
    );

    await transaction.commit();
    return await getCart(sequelize, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateCartItem(sequelize, userId, { cartItemId, quantity }) {
  if (quantity <= 0) {
    return await removeCartItem(sequelize, userId, cartItemId);
  }

  const transaction = await sequelize.transaction();
  try {
    const cart = await ensureCartExists(sequelize, userId, transaction);

    const itemRes = await sequelize.query(
      `SELECT product_variant_id FROM "cart_items" WHERE "id" = :cartItemId AND "cart_id" = :cartId LIMIT 1;`,
      { replacements: { cartItemId, cartId: cart.id }, type: 'SELECT', transaction }
    );
    if (!itemRes[0]) throw new Error('Cart item not found');

    const variantId = itemRes[0].product_variant_id;

    // Stock & MOQ validation
    const prodRes = await sequelize.query(
      `SELECT p.minimum_order_quantity, p.id FROM "products" p JOIN "product_variants" pv ON pv.product_id = p.id WHERE pv.id = :variantId LIMIT 1;`,
      { replacements: { variantId }, type: 'SELECT', transaction }
    );
    const moq = prodRes[0]?.minimum_order_quantity ? Math.max(1, parseInt(prodRes[0].minimum_order_quantity, 10)) : 1;

    if (quantity < moq) {
      throw new Error(`Quantity cannot be less than Minimum Order Quantity (${moq})`);
    }

    const stockRes = await sequelize.query(
      `SELECT COALESCE(SUM("available_quantity"), 0)::int as total FROM "warehouse_inventory" WHERE "product_variant_id" = :variantId;`,
      { replacements: { variantId }, type: 'SELECT', transaction }
    );
    const available = stockRes[0] ? stockRes[0].total : 0;

    if (available > 0 && quantity > available) {
      throw new Error(`Requested quantity exceeds available stock (${available})`);
    }

    await sequelize.query(
      `UPDATE "cart_items" SET "quantity" = :quantity, "updated_at" = NOW() WHERE "id" = :cartItemId AND "cart_id" = :cartId;`,
      { replacements: { cartItemId, cartId: cart.id, quantity }, type: 'UPDATE', transaction }
    );

    await transaction.commit();
    return await getCart(sequelize, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function removeCartItem(sequelize, userId, targetId) {
  const cart = await ensureCartExists(sequelize, userId);
  await sequelize.query(
    `DELETE FROM "cart_items"
     WHERE "cart_id" = :cartId
       AND (
         "id" = :targetId
         OR "product_variant_id" = :targetId
         OR "product_variant_id" IN (SELECT "id" FROM "product_variants" WHERE "product_id" = :targetId)
       );`,
    { replacements: { targetId, cartId: cart.id }, type: 'DELETE' }
  );
  return await getCart(sequelize, userId);
}

async function clearCart(sequelize, userId, transaction) {
  const cart = await ensureCartExists(sequelize, userId, transaction);
  await sequelize.query(
    `DELETE FROM "cart_items" WHERE "cart_id" = :cartId;`,
    { replacements: { cartId: cart.id }, type: 'DELETE', transaction }
  );
  return [];
}

// ─── Order Cancellation with Stock Release ───────────────────────────
async function cancelBuyerOrder(sequelize, userId, orderId, remarks, releaseInventoryFn) {
  const transaction = await sequelize.transaction();
  try {
    const orderRes = await sequelize.query(
      `SELECT o.*, os.name as status_name
       FROM "orders" o
       JOIN "order_statuses" os ON o.order_status_id = os.id
       WHERE o.id = :orderId AND o.buyer_id = :userId LIMIT 1 FOR UPDATE;`,
      { replacements: { orderId, userId }, type: 'SELECT', transaction }
    );

    if (!orderRes[0]) throw new Error('Order not found or unauthorized');
    const order = orderRes[0];

    if (!['Pending', 'Accepted'].includes(order.status_name)) {
      throw new Error(`Order cannot be cancelled in status '${order.status_name}'`);
    }

    const cancelledStatusRes = await sequelize.query(
      `SELECT id FROM "order_statuses" WHERE name = 'Cancelled' LIMIT 1;`,
      { type: 'SELECT', transaction }
    );
    if (!cancelledStatusRes[0]) throw new Error('Cancelled status not found in database');
    const cancelledStatusId = cancelledStatusRes[0].id;

    // Update order status to Cancelled
    await sequelize.query(
      `UPDATE "orders" SET "order_status_id" = :cancelledStatusId, "updated_at" = NOW() WHERE "id" = :orderId;`,
      { replacements: { cancelledStatusId, orderId }, type: 'UPDATE', transaction }
    );

    // Record Status History
    await sequelize.query(
      `INSERT INTO "order_status_history" ("order_id", "status_id", "remarks", "changed_by", "changed_at")
       VALUES (:orderId, :cancelledStatusId, :remarks, :userId, NOW());`,
      { replacements: { orderId, cancelledStatusId, remarks: remarks || 'Order cancelled by buyer', userId }, type: 'INSERT', transaction }
    );

    // Release Stock Reservation
    if (releaseInventoryFn) {
      const items = await sequelize.query(
        `SELECT product_variant_id, quantity FROM "order_items" WHERE order_id = :orderId;`,
        { replacements: { orderId }, type: 'SELECT', transaction }
      );
      for (const item of items) {
        await releaseInventoryFn(sequelize, {
          productVariantId: item.product_variant_id,
          quantity: item.quantity,
          orderId,
          supplierId: order.supplier_id,
          transaction
        });
      }
    }

    await transaction.commit();
    return { success: true, message: 'Order cancelled successfully and stock reservation released' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── Reorder Usecase ──────────────────────────────────────────────────
async function reorderBuyerOrder(sequelize, userId, orderId) {
  const items = await sequelize.query(
    `SELECT oi.product_variant_id, oi.quantity, p.id as product_id, p.name as product_name
     FROM "order_items" oi
     JOIN "orders" o ON oi.order_id = o.id
     JOIN "product_variants" pv ON oi.product_variant_id = pv.id
     JOIN "products" p ON pv.product_id = p.id
     WHERE oi.order_id = :orderId AND o.buyer_id = :userId;`,
    { replacements: { orderId, userId }, type: 'SELECT' }
  );

  if (!items || items.length === 0) {
    throw new Error('No items found in past order');
  }

  for (const item of items) {
    await addToCart(sequelize, userId, { productVariantId: item.product_variant_id, quantity: item.quantity });
  }

  return await getCart(sequelize, userId);
}

// ─── Suppliers Listing ──────────────────────────────────────────────
async function getSuppliers(sequelize, { search, limit = 20, offset = 0 }) {
  let where = `WHERE sp."id" IS NOT NULL`;
  const replacements = {};
  if (search) {
    where += ` AND (sp."company_name" ILIKE :search OR sp."company_description" ILIKE :search OR wci."name" ILIKE :search OR wst."name" ILIKE :search)`;
    replacements.search = `%${search}%`;
  }
  replacements.limit = Number(limit);
  replacements.offset = Number(offset);

  // Join the default warehouse -> address -> city -> state for location
  const locationJoin = `
     LEFT JOIN "warehouses" dw ON dw."supplier_id" = sp."id" AND dw."is_default" = TRUE
     LEFT JOIN "addresses" wa ON wa."id" = dw."address_id"
     LEFT JOIN "cities" wci ON wci."id" = wa."city_id"
     LEFT JOIN "states" wst ON wst."id" = wci."state_id"`;

  const countResult = await sequelize.query(
    `SELECT COUNT(DISTINCT sp."id")::int as total
     FROM "supplier_profiles" sp
     ${locationJoin}
     ${where};`,
    { replacements, type: 'SELECT' }
  );

  const total = countResult[0] ? countResult[0].total : 0;

  const rows = await sequelize.query(
    `SELECT sp."id",
            sp."company_name",
            sp."company_description",
            sp."website",
            sp."minimum_order_quantity",
            sp."approval_status",
            sp."created_at",
            NULLIF(TRIM(CONCAT_WS(', ', wci."name", wst."name")), '') as "location",
            (SELECT COUNT(*)::int FROM "products" p WHERE p."supplier_id" = sp."id" AND p."is_deleted" = FALSE AND p."status" IN ('active', 'published')) as "product_count",
            (
              SELECT ARRAY_AGG(DISTINCT c."name")
              FROM "products" p2
              JOIN "categories" c ON p2."category_id" = c."id"
              WHERE p2."supplier_id" = sp."id" AND p2."is_deleted" = FALSE
            ) as "categories"
     FROM "supplier_profiles" sp
     ${locationJoin}
     ${where}
     GROUP BY sp."id", wci."name", wst."name"
     ORDER BY sp."created_at" DESC
     LIMIT :limit OFFSET :offset;`,
    { replacements, type: 'SELECT' }
  );

  return {
    total,
    items: rows,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// ─── Favorites Management ──────────────────────────────────────────
let favoritesTableChecked = false;
async function ensureFavoritesTable(sequelize) {
  if (favoritesTableChecked) return;
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "unique_user_product_favorite" UNIQUE ("user_id", "product_id")
      );
    `);
    favoritesTableChecked = true;
  } catch (err) {
    console.error('Error ensuring favorites table:', err.message);
  }
}

async function getBuyerFavorites(sequelize, userId) {
  await ensureFavoritesTable(sequelize);
  const rows = await sequelize.query(
    `SELECT f."id" as "favorite_id", f."created_at" as "favorited_at", p.*,
            c."name" as "category_name",
            ft."name" as "fabric_type_name",
            u."name" as "unit_name",
            sp."company_name" as "supplier_name",
            (SELECT pi."image_url" FROM "product_images" pi WHERE pi."product_id" = p."id" ORDER BY pi."is_primary" DESC, pi."display_order" ASC LIMIT 1) as "primary_image_url"
     FROM "favorites" f
     JOIN "products" p ON f."product_id" = p."id"
     LEFT JOIN "categories" c ON p."category_id" = c."id"
     LEFT JOIN "fabric_types" ft ON p."fabric_type_id" = ft."id"
     LEFT JOIN "units" u ON p."unit_id" = u."id"
     LEFT JOIN "supplier_profiles" sp ON p."supplier_id" = sp."id"
     WHERE f."user_id" = :userId AND p."is_deleted" = FALSE
     ORDER BY f."created_at" DESC;`,
    { replacements: { userId }, type: 'SELECT' }
  );
  return rows;
}

async function addBuyerFavorite(sequelize, userId, productId) {
  await ensureFavoritesTable(sequelize);
  await sequelize.query(
    `INSERT INTO "favorites" ("id", "user_id", "product_id")
     VALUES (gen_random_uuid(), :userId, :productId)
     ON CONFLICT ("user_id", "product_id") DO NOTHING;`,
    { replacements: { userId, productId }, type: 'INSERT' }
  );
  return await getBuyerFavorites(sequelize, userId);
}

async function removeBuyerFavorite(sequelize, userId, productId) {
  await ensureFavoritesTable(sequelize);
  await sequelize.query(
    `DELETE FROM "favorites" WHERE "user_id" = :userId AND "product_id" = :productId;`,
    { replacements: { userId, productId }, type: 'DELETE' }
  );
  return await getBuyerFavorites(sequelize, userId);
}

module.exports = {
  getBuyerByUserId,
  createBuyerProfile,
  updateBuyerProfile,
  createAddress,
  linkBuyerAddress,
  getBuyerAddresses,
  getPendingOrderStatus,
  createOrder,
  createOrderItem,
  createOrderStatusHistory,
  getBuyerOrders,
  getBuyerOrderById,
  getBuyerOrderItems,
  getMarketplaceProducts,
  getProductDetailsForBuyer,
  getProductRecommendations,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  cancelBuyerOrder,
  reorderBuyerOrder,
  addBuyerAddress,
  deleteBuyerAddress,
  getSuppliers,
  getBuyerFavorites,
  addBuyerFavorite,
  removeBuyerFavorite
};
