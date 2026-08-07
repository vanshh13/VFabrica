module.exports = function makeCreateCategoryAction(createCategoryUsecase) {
  return async function createCategoryAction(req, res) {
    try {
      const { parentId, name, description, slug } = req.body;
      const createdBy = req.user?.id || null;
      const result = await createCategoryUsecase({ parentId, name, description, createdBy, slug });
      return res.status(201).json({ success: true, message: 'Category created successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};