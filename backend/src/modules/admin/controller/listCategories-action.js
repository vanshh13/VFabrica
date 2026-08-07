module.exports = function makeListCategoriesAction(listCategoriesUsecase) {
  return async function listCategoriesAction(req, res) {
    try {
      const result = await listCategoriesUsecase();
      return res.status(200).json({ success: true, message: 'Categories retrieved successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};