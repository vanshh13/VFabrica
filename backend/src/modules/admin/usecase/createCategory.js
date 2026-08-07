function toSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = function makeCreateCategory({ sequelize, createCategory, getCategoryBySlug }) {
  return async function createCategoryUsecase({ parentId, name, description, createdBy, slug }) {
    if (!name) {
      throw new Error('Category name is required');
    }

    const resolvedSlug = slug || toSlug(name);
    const existing = await getCategoryBySlug(sequelize, resolvedSlug);
    if (existing) {
      throw new Error('Category slug already exists');
    }

    return await createCategory(sequelize, {
      parentId: parentId || null,
      name,
      slug: resolvedSlug,
      description: description || null,
      createdBy: createdBy || null
    });
  };
};