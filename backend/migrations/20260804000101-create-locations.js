'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create countries table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "phone_code" VARCHAR(50),
        "currency_code" VARCHAR(50),
        "currency_name" VARCHAR(255),
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

    // 2. Create states table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "states" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "country_id" UUID REFERENCES "countries"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "state_code" VARCHAR(100),
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

    // 3. Create cities table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "cities" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "state_id" UUID REFERENCES "states"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "postal_code" VARCHAR(50),
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

    // 4. Create addresses table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "addresses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "city_id" UUID REFERENCES "cities"("id") ON DELETE SET NULL,
        "address_line_1" TEXT NOT NULL,
        "landmark" VARCHAR(255),
        "zipcode" VARCHAR(50),
        "address_type" VARCHAR(100) DEFAULT 'Home',
        "is_default" BOOLEAN DEFAULT FALSE,
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

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_countries_name" ON "countries" ("name");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_states_country_id" ON "states" ("country_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_cities_state_id" ON "cities" ("state_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_addresses_user_id" ON "addresses" ("user_id");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "addresses" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "cities" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "states" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "countries" CASCADE;');
  }
};
