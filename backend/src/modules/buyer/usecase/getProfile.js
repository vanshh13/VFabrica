/**
 * Factory for getting buyer profile.
 */
module.exports = function makeGetProfile({
  sequelize,
  getBuyerByUserId,
  getBuyerAddresses
}) {
  return async function getProfile(userId) {
    const profile = await getBuyerByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Buyer profile not found');
    }

    const addresses = await getBuyerAddresses(sequelize, profile.id);

    return {
      profile,
      addresses
    };
  };
};
