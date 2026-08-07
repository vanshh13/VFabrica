/**
 * Factory for updating buyer profile.
 */
module.exports = function makeUpdateProfile({
  sequelize,
  getBuyerByUserId,
  updateBuyerProfile
}) {
  return async function updateProfile(userId, data) {
    const profile = await getBuyerByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Buyer profile not found');
    }

    const updated = await updateBuyerProfile(sequelize, {
      profileId: profile.id,
      companyName: data.companyName !== undefined ? data.companyName : profile.company_name,
      buyerType: data.buyerType || profile.buyer_type,
      businessType: data.businessType !== undefined ? data.businessType : profile.business_type,
      industry: data.industry !== undefined ? data.industry : profile.industry,
      preferences: data.preferences !== undefined ? data.preferences : profile.preferences
    });

    return updated;
  };
};
