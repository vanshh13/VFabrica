// Data Access Layer for Categories & Masters
const { logger } = require('../../../utils/logger');

let categoriesCache = null;
let categoriesCacheTime = 0;
let mastersCache = null;
let mastersCacheTime = 0;
let hasSeeded = false;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL

async function seedDefaultCategories(sequelize) {
  if (hasSeeded) return;
  const defaultCategories = [
    { name: 'Cotton Fabrics', slug: 'cotton-fabrics', description: 'Natural cotton weaves, blends, and organic cotton textiles' },
    { name: 'Silk Materials', slug: 'silk-materials', description: 'Premium mulberry silk, charmeuse, and luxury silk fabrics' },
    { name: 'Wool & Cashmere', slug: 'wool-cashmere', description: 'Warm wool, cashmere weaves, and heavy winter textiles' },
    { name: 'Linen Textiles', slug: 'linen-textiles', description: 'Natural flax linen fabrics and breathable summer weaves' },
    { name: 'Synthetic Fibers', slug: 'synthetic-fibers', description: 'Polyester, nylon, rayon, and technical synthetic blends' },
    { name: 'Denim & Jeans', slug: 'denim-jeans', description: 'Heavyweight denim, indigo dyed cotton, and jeans textiles' },
    { name: 'Technical Fabrics', slug: 'technical-fabrics', description: 'Waterproof, fire-resistant, and high-performance textiles' },
    { name: 'Embroidery & Lace', slug: 'embroidery-lace', description: 'Decorative lace, embroidered fabrics, and bridal textiles' }
  ];

  for (const cat of defaultCategories) {
    try {
      await sequelize.query(
        `INSERT INTO "categories" ("id", "name", "slug", "description", "status", "created_at", "updated_at")
         VALUES (uuid_generate_v4(), :name, :slug, :description, 'active', NOW(), NOW())
         ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updated_at" = NOW();`,
        { replacements: cat, type: 'INSERT' }
      );
    } catch (err) {
      logger.warn({ error: err.message, slug: cat.slug }, 'Skipped category seed query');
    }
  }
  hasSeeded = true;
}

async function getAllCategories(sequelize) {
  const now = Date.now();
  if (categoriesCache && (now - categoriesCacheTime < CACHE_TTL_MS)) {
    return categoriesCache;
  }

  logger.info('Database: getAllCategories query invoked (Cache Miss)');
  await seedDefaultCategories(sequelize);
  const result = await sequelize.query(
    `SELECT * FROM "categories" WHERE "is_deleted" = FALSE ORDER BY "name" ASC;`,
    { type: 'SELECT' }
  );

  categoriesCache = result;
  categoriesCacheTime = now;
  return result;
}

async function getAllMasters(sequelize) {
  const now = Date.now();
  if (mastersCache && (now - mastersCacheTime < CACHE_TTL_MS)) {
    return mastersCache;
  }

  logger.info('Database: getAllMasters query invoked (Cache Miss)');
  const [units, sizes, colors, attributes, fabricTypes] = await Promise.all([
    sequelize.query(`SELECT * FROM "units" ORDER BY "name" ASC;`, { type: 'SELECT' }),
    sequelize.query(`SELECT * FROM "product_sizes" ORDER BY "name" ASC;`, { type: 'SELECT' }),
    sequelize.query(`SELECT * FROM "colors" ORDER BY "name" ASC;`, { type: 'SELECT' }),
    sequelize.query(`SELECT * FROM "product_attributes" ORDER BY "name" ASC;`, { type: 'SELECT' }),
    sequelize.query(`SELECT * FROM "fabric_types" ORDER BY "name" ASC;`, { type: 'SELECT' })
  ]);

  const result = {
    units,
    sizes,
    colors,
    attributes,
    fabricTypes
  };

  mastersCache = result;
  mastersCacheTime = now;
  return result;
}

function invalidateCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTime = 0;
  mastersCache = null;
  mastersCacheTime = 0;
}

module.exports = {
  getAllCategories,
  getAllMasters,
  seedDefaultCategories,
  invalidateCategoriesCache
};
