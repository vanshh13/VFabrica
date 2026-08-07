module.exports = function makeUpdateCategoryAction(updateCategoryUsecase) {
  return async function updateCategoryAction(req, res) {
    try {
      const { categoryId } = req.params;
      const { parentId, name, description, status, slug } = req.body;
      const updatedBy = req.user?.id || null;
      const result = await updateCategoryUsecase({ categoryId, parentId, name, description, status, updatedBy, slug });
      return res.status(200).json({ success: true, message: 'Category updated successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};