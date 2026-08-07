/**
 * Factory for getting supplier profile.
 */
module.exports = function makeGetProfile({
    sequelize,
    getSupplierByUserId,
    getSupplierAddresses,
    getSupplierWarehouses
}) {
    return async function getProfile(userId) {
        const profile = await getSupplierByUserId(sequelize, userId);
        if (!profile) {
            throw new Error('Supplier profile not found');
        }

        const addresses = await getSupplierAddresses(sequelize, profile.id);
        const warehouses = await getSupplierWarehouses(sequelize, profile.id);

        return {
            profile,
            addresses,
            warehouses
        };
    };
};
