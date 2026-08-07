/**
 * Factory for updating supplier profile.
 */
module.exports = function makeUpdateProfile({
  sequelize,
  getSupplierByUserId,
  updateSupplierProfile
}) {
  return async function updateProfile(userId, data) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const updated = await updateSupplierProfile(sequelize, {
      profileId: profile.id,
      companyName: data.companyName || profile.company_name,
      companyDescription: data.companyDescription !== undefined ? data.companyDescription : profile.company_description,
      website: data.website !== undefined ? data.website : profile.website,
      minimumOrderQuantity: data.minimumOrderQuantity !== undefined ? data.minimumOrderQuantity : profile.minimum_order_quantity
    });

    return updated;
  };
};
