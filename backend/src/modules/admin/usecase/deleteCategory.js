module.exports = function makeDeleteCategory({ sequelize, deleteCategory, getCategoryById }) {
  return async function deleteCategoryUsecase({ categoryId, deletedBy }) {
    if (!categoryId) {
      throw new Error('categoryId is required');
    }

    const existing = await getCategoryById(sequelize, categoryId);
    if (!existing) {
      throw new Error('Category not found');
    }

    return await deleteCategory(sequelize, { categoryId, deletedBy: deletedBy || null });
  };
};