'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create supplier_profiles table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "supplier_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "company_name" VARCHAR(255) NOT NULL,
        "company_description" TEXT,
        "website" VARCHAR(255),
        "minimum_order_quantity" INTEGER DEFAULT 1,
        "approval_status" VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
        "approved_by" UUID,
        "approved_at" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_by" UUID,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_by" UUID,
        "deleted_at" TIMESTAMP,
        "deleted_by" UUID,
        "is_deleted" BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Create supplier_addresses table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "supplier_addresses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "supplier_profile_id" UUID NOT NULL REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
        "address_id" UUID NOT NULL REFERENCES "addresses"("id") ON DELETE CASCADE,
        "address_type" VARCHAR(100) DEFAULT 'Warehouse',
        "is_primary" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_user_id" ON "supplier_profiles" ("user_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_supplier_addresses_profile" ON "supplier_addresses" ("supplier_profile_id");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "supplier_addresses" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "supplier_profiles" CASCADE;');
  }
};
