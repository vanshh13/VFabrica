module.exports = function makeDeleteCategoryAction(deleteCategoryUsecase) {
  return async function deleteCategoryAction(req, res) {
    try {
      const { categoryId } = req.params;
      const deletedBy = req.user?.id || null;
      const result = await deleteCategoryUsecase({ categoryId, deletedBy });
      return res.status(200).json({ success: true, message: 'Category deleted successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};