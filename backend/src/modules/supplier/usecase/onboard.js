/**
 * Factory for supplier onboarding usecase.
 */
module.exports = function makeOnboard({
  sequelize,
  getSupplierByUserId,
  createSupplierProfile,
  createAddress,
  linkSupplierAddress,
  createWarehouse
}) {
  return async function onboard(userId, {
    companyName,
    companyDescription,
    website,
    minimumOrderQuantity,
    addressLine1,
    landmark,
    zipcode,
    cityId,
    contactNumber
  }) {
    if (!companyName) {
      throw new Error('Company name is required');
    }

    const existing = await getSupplierByUserId(sequelize, userId);
    if (existing) {
      throw new Error('Supplier profile already exists for this user');
    }

    const transaction = await sequelize.transaction();
    try {
      const profile = await createSupplierProfile(sequelize, {
        userId,
        companyName,
        companyDescription,
        website,
        minimumOrderQuantity: minimumOrderQuantity || 1
      });

      let address = null;
      let warehouse = null;

      if (addressLine1) {
        address = await createAddress(sequelize, {
          userId,
          addressLine1,
          landmark,
          zipcode,
          cityId
        });

        await linkSupplierAddress(sequelize, {
          supplierProfileId: profile.id,
          addressId: address.id,
          isPrimary: true
        });

        // Create default warehouse
        warehouse = await createWarehouse(sequelize, {
          supplierId: profile.id,
          name: `${companyName} Main Warehouse`,
          addressId: address.id,
          contactNumber: contactNumber || null,
          isDefault: true
        });
      }

      await transaction.commit();
      return { profile, address, warehouse };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
};
