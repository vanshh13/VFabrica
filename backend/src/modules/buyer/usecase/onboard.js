/**
 * Factory for buyer onboarding usecase.
 */
module.exports = function makeOnboard({
  sequelize,
  getBuyerByUserId,
  createBuyerProfile,
  createAddress,
  linkBuyerAddress
}) {
  return async function onboard(userId, {
    companyName,
    buyerType,
    businessType,
    industry,
    preferences,
    addressLine1,
    landmark,
    zipcode,
    cityId
  }) {
    const existing = await getBuyerByUserId(sequelize, userId);
    if (existing) {
      throw new Error('Buyer profile already exists for this user');
    }

    const transaction = await sequelize.transaction();
    try {
      const profile = await createBuyerProfile(sequelize, {
        userId,
        companyName,
        buyerType: buyerType || 'Individual',
        businessType,
        industry,
        preferences
      });

      let address = null;
      if (addressLine1) {
        address = await createAddress(sequelize, {
          userId,
          addressLine1,
          landmark,
          zipcode,
          cityId,
          addressType: 'Shipping'
        });

        await linkBuyerAddress(sequelize, {
          buyerProfileId: profile.id,
          addressId: address.id,
          addressType: 'Shipping',
          isPrimary: true
        });
      }

      await transaction.commit();
      return { profile, address };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
};
