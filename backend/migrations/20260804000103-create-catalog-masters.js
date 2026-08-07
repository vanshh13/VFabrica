'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create categories table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "parent_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) UNIQUE NOT NULL,
        "description" TEXT,
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

    // 2. Create fabric_types table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "fabric_types" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create units table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "units" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "symbol" VARCHAR(50) UNIQUE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create colors table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "colors" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "hex_code" VARCHAR(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Create product_sizes table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "product_sizes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "width" NUMERIC(10, 2),
        "length" NUMERIC(10, 2),
        "unit_id" UUID REFERENCES "units"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_categories_parent" ON "categories" ("parent_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories" ("slug");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "product_sizes" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "colors" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "units" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "fabric_types" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "categories" CASCADE;');
  }
};
