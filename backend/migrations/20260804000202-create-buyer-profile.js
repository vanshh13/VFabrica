'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create buyer_profiles table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "buyer_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "company_name" VARCHAR(255),
        "buyer_type" VARCHAR(100), -- Business, Individual
        "business_type" VARCHAR(100), -- Retailer, Wholesaler, Manufacturer, Designer
        "industry" VARCHAR(100), -- Apparel, Home Decor, etc.
        "preferences" JSONB, -- Storing preferred categories, fabric types, typical order qty, budget range
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_by" UUID,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_by" UUID,
        "deleted_at" TIMESTAMP,
        "deleted_by" UUID,
        "is_deleted" BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Create buyer_addresses table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "buyer_addresses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "buyer_profile_id" UUID NOT NULL REFERENCES "buyer_profiles"("id") ON DELETE CASCADE,
        "address_id" UUID NOT NULL REFERENCES "addresses"("id") ON DELETE CASCADE,
        "address_type" VARCHAR(100) DEFAULT 'Shipping',
        "is_primary" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_buyer_profiles_user" ON "buyer_profiles" ("user_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_buyer_addresses_profile" ON "buyer_addresses" ("buyer_profile_id");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "buyer_addresses" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "buyer_profiles" CASCADE;');
  }
};
