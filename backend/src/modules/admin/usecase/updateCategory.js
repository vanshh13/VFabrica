function toSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = function makeUpdateCategory({ sequelize, updateCategory, getCategoryById, getCategoryBySlug }) {
  return async function updateCategoryUsecase({ categoryId, parentId, name, description, status, updatedBy, slug }) {
    if (!categoryId) {
      throw new Error('categoryId is required');
    }

    const existing = await getCategoryById(sequelize, categoryId);
    if (!existing) {
      throw new Error('Category not found');
    }

    const resolvedSlug = slug || toSlug(name || existing.name);
    const conflict = await getCategoryBySlug(sequelize, resolvedSlug);
    if (conflict && conflict.id !== categoryId) {
      throw new Error('Category slug already exists');
    }

    return await updateCategory(sequelize, {
      categoryId,
      parentId: parentId === undefined ? existing.parent_id : parentId,
      name: name || existing.name,
      slug: resolvedSlug,
      description: description === undefined ? existing.description : description,
      status: status || existing.status,
      updatedBy: updatedBy || null
    });
  };
};