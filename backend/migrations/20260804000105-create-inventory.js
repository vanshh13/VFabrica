'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create warehouses table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "warehouses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "supplier_id" UUID NOT NULL REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "address_id" UUID REFERENCES "addresses"("id") ON DELETE SET NULL,
        "contact_number" VARCHAR(50),
        "is_default" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create warehouse_inventory table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "warehouse_inventory" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "warehouse_id" UUID NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
        "product_variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "quantity" INTEGER DEFAULT 0,
        "reserved_quantity" INTEGER DEFAULT 0,
        "available_quantity" INTEGER DEFAULT 0,
        "reorder_level" INTEGER DEFAULT 5,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "unique_warehouse_variant" UNIQUE ("warehouse_id", "product_variant_id")
      );
    `);

    // 3. Create inventory_transactions table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "inventory_transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "warehouse_inventory_id" UUID NOT NULL REFERENCES "warehouse_inventory"("id") ON DELETE CASCADE,
        "transaction_type" VARCHAR(50) NOT NULL, -- IN, OUT, RESERVED, RELEASED, ADJUSTMENT
        "reference_type" VARCHAR(100),
        "reference_id" UUID,
        "quantity" INTEGER NOT NULL,
        "remarks" TEXT,
        "performed_by" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_warehouses_supplier" ON "warehouses" ("supplier_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_inventory_warehouse" ON "warehouse_inventory" ("warehouse_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_inventory_variant" ON "warehouse_inventory" ("product_variant_id");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "inventory_transactions" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "warehouse_inventory" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "warehouses" CASCADE;');
  }
};
