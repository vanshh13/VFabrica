'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Units
    await queryInterface.sequelize.query(`
      INSERT INTO "units" ("id", "name", "symbol", "created_at", "updated_at") VALUES
      ('1a111111-1111-1111-1111-111111111111', 'Meter', 'm', NOW(), NOW()),
      ('1b111111-1111-1111-1111-111111111111', 'Kg', 'kg', NOW(), NOW()),
      ('1c111111-1111-1111-1111-111111111111', 'Roll', 'roll', NOW(), NOW()),
      ('1d111111-1111-1111-1111-111111111111', 'Piece', 'pc', NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 2. Seed Product Sizes (referencing the units)
    await queryInterface.sequelize.query(`
      INSERT INTO "product_sizes" ("id", "name", "width", "length", "unit_id", "created_at", "updated_at") VALUES
      ('2a222222-2222-2222-2222-222222222222', '60 inches', 60.00, 1.00, '1a111111-1111-1111-1111-111111111111', NOW(), NOW()),
      ('2b222222-2222-2222-2222-222222222222', '44 inches', 44.00, 1.00, '1a111111-1111-1111-1111-111111111111', NOW(), NOW()),
      ('2c222222-2222-2222-2222-222222222222', '100 meters', 1.00, 100.00, '1a111111-1111-1111-1111-111111111111', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);

    // 3. Seed Categories
    await queryInterface.sequelize.query(`
      INSERT INTO "categories" ("id", "name", "slug", "description", "status", "created_at", "updated_at") VALUES
      ('3b333333-3333-3333-3333-333333333333', 'Cotton Fabrics', 'cotton-fabrics', 'Natural cotton weaves, blends, and organic cotton textiles', 'active', NOW(), NOW()),
      ('3c333333-3333-3333-3333-333333333333', 'Silk Materials', 'silk-materials', 'Premium mulberry silk, charmeuse, and luxury silk fabrics', 'active', NOW(), NOW()),
      ('3d333333-3333-3333-3333-333333333333', 'Wool & Cashmere', 'wool-cashmere', 'Warm wool, cashmere weaves, and heavy winter textiles', 'active', NOW(), NOW()),
      ('3e333333-3333-3333-3333-333333333333', 'Linen Textiles', 'linen-textiles', 'Natural flax linen fabrics and breathable summer weaves', 'active', NOW(), NOW()),
      ('3f333333-3333-3333-3333-333333333333', 'Synthetic Fibers', 'synthetic-fibers', 'Polyester, nylon, rayon, and technical synthetic blends', 'active', NOW(), NOW()),
      ('3g333333-3333-3333-3333-333333333333', 'Denim & Jeans', 'denim-jeans', 'Heavyweight denim, indigo dyed cotton, and jeans textiles', 'active', NOW(), NOW()),
      ('3h333333-3333-3333-3333-333333333333', 'Technical Fabrics', 'technical-fabrics', 'Waterproof, fire-resistant, and high-performance textiles', 'active', NOW(), NOW()),
      ('3i333333-3333-3333-3333-333333333333', 'Embroidery & Lace', 'embroidery-lace', 'Decorative lace, embroidered fabrics, and bridal textiles', 'active', NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updated_at" = NOW();
    `);

    // 4. Seed Product Attributes
    await queryInterface.sequelize.query(`
      INSERT INTO "product_attributes" ("id", "name", "datatype", "created_at", "updated_at") VALUES
      ('4a444444-4444-4444-4444-444444444444', 'GSM', 'number', NOW(), NOW()),
      ('4b444444-4444-4444-4444-444444444444', 'Composition', 'string', NOW(), NOW()),
      ('4c444444-4444-4444-4444-444444444444', 'Width', 'string', NOW(), NOW()),
      ('4d444444-4444-4444-4444-444444444444', 'Shrinkage', 'string', NOW(), NOW()),
      ('4e444444-4444-4444-4444-444444444444', 'Finish', 'string', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);

    // 5. Seed Fabric Types
    await queryInterface.sequelize.query(`
      INSERT INTO "fabric_types" ("id", "name", "description", "created_at", "updated_at") VALUES
      ('5a555555-5555-5555-5555-555555555555', 'Cotton', 'Cotton fabric', NOW(), NOW()),
      ('5b555555-5555-5555-5555-555555555555', 'Silk', 'Silk fabric', NOW(), NOW()),
      ('5c555555-5555-5555-5555-555555555555', 'Linen', 'Linen fabric', NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 6. Seed Colors
    await queryInterface.sequelize.query(`
      INSERT INTO "colors" ("id", "name", "hex_code", "created_at", "updated_at") VALUES
      ('6a666666-6666-6666-6666-666666666666', 'Off-White', '#FDFBF7', NOW(), NOW()),
      ('6b666666-6666-6666-6666-666666666666', 'Indigo Blue', '#4B0082', NOW(), NOW()),
      ('6c666666-6666-6666-6666-666666666666', 'Olive Green', '#808000', NOW(), NOW()),
      ('6d666666-6666-6666-6666-666666666666', 'Crimson Red', '#DC143C', NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DELETE FROM "colors";');
    await queryInterface.sequelize.query('DELETE FROM "fabric_types";');
    await queryInterface.sequelize.query('DELETE FROM "product_attributes";');
    await queryInterface.sequelize.query('DELETE FROM "categories";');
    await queryInterface.sequelize.query('DELETE FROM "product_sizes";');
    await queryInterface.sequelize.query('DELETE FROM "units";');
  }
};
