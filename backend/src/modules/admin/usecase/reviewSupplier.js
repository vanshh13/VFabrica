module.exports = function makeReviewSupplier({ sequelize, reviewSupplier }) {
  return async function reviewSupplierUsecase({ supplierProfileId, approvalStatus, approvedBy }) {
    if (!supplierProfileId || !approvalStatus) {
      throw new Error('supplierProfileId and approvalStatus are required');
    }

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      throw new Error('approvalStatus must be approved or rejected');
    }

    return await reviewSupplier(sequelize, { supplierProfileId, approvalStatus, approvedBy });
  };
};