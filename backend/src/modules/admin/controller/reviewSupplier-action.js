module.exports = function makeReviewSupplierAction(reviewSupplierUsecase) {
  return async function reviewSupplierAction(req, res) {
    try {
      const { supplierProfileId, approvalStatus } = req.body;
      const approvedBy = req.user?.id || null;
      const result = await reviewSupplierUsecase({ supplierProfileId, approvalStatus, approvedBy });
      return res.status(200).json({ success: true, message: 'Supplier review updated successfully', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };
};