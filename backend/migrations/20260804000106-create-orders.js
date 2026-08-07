'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create order_statuses table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "order_statuses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) UNIQUE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default statuses
    await queryInterface.sequelize.query(`
      INSERT INTO "order_statuses" ("name") VALUES
      ('Pending'),
      ('Accepted'),
      ('Preparing'),
      ('Ready'),
      ('Dispatched'),
      ('Completed'),
      ('Cancelled')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 2. Create orders table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_number" VARCHAR(100) UNIQUE NOT NULL,
        "buyer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "supplier_id" UUID NOT NULL REFERENCES "supplier_profiles"("id") ON DELETE RESTRICT,
        "billing_address_id" UUID REFERENCES "addresses"("id") ON DELETE SET NULL,
        "shipping_address_id" UUID REFERENCES "addresses"("id") ON DELETE SET NULL,
        "subtotal" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "discount" NUMERIC(12, 2) DEFAULT 0.00,
        "tax" NUMERIC(12, 2) DEFAULT 0.00,
        "shipping_charge" NUMERIC(12, 2) DEFAULT 0.00,
        "grand_total" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "order_status_id" UUID REFERENCES "order_statuses"("id") ON DELETE RESTRICT,
        "placed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create order_items table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "product_variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE RESTRICT,
        "quantity" INTEGER NOT NULL,
        "unit_price" NUMERIC(12, 2) NOT NULL,
        "total_price" NUMERIC(12, 2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create order_status_history table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "order_status_history" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "status_id" UUID NOT NULL REFERENCES "order_statuses"("id") ON DELETE RESTRICT,
        "remarks" TEXT,
        "changed_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "changed_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_orders_buyer" ON "orders" ("buyer_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_orders_supplier" ON "orders" ("supplier_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items" ("order_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_orders_number" ON "orders" ("order_number");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "order_status_history" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "order_items" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "orders" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "order_statuses" CASCADE;');
  }
};
