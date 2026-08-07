'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create products table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "supplier_id" UUID NOT NULL REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
        "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "fabric_type_id" UUID REFERENCES "fabric_types"("id") ON DELETE SET NULL,
        "brand" VARCHAR(255),
        "unit_id" UUID REFERENCES "units"("id") ON DELETE SET NULL,
        "base_price" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "minimum_order_quantity" INTEGER DEFAULT 1,
        "lead_time_days" INTEGER DEFAULT 3,
        "status" VARCHAR(50) DEFAULT 'active', -- active, draft, out_of_stock, inactive
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_by" UUID,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_by" UUID,
        "deleted_at" TIMESTAMP,
        "deleted_by" UUID,
        "is_deleted" BOOLEAN DEFAULT FALSE
      );
    `);

    // 2. Create product_images table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "image_url" TEXT NOT NULL,
        "display_order" INTEGER DEFAULT 0,
        "is_primary" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create product_variants table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "size_id" UUID REFERENCES "product_sizes"("id") ON DELETE SET NULL,
        "color_id" UUID REFERENCES "colors"("id") ON DELETE SET NULL,
        "sku" VARCHAR(255) UNIQUE,
        "price" NUMERIC(12, 2),
        "status" VARCHAR(50) DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create product_attributes table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "product_attributes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "datatype" VARCHAR(50) DEFAULT 'string',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Create product_attribute_values table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "product_attribute_values" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "attribute_id" UUID NOT NULL REFERENCES "product_attributes"("id") ON DELETE CASCADE,
        "value" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_products_supplier" ON "products" ("supplier_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_product_images_product" ON "product_images" ("product_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_product_variants_product" ON "product_variants" ("product_id");');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "product_attribute_values" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "product_attributes" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "product_variants" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "product_images" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "products" CASCADE;');
  }
};
