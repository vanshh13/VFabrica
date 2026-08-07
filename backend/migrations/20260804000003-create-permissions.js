'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "permissions" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "module" VARCHAR(255) NOT NULL,
          "action" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "created_by" UUID,
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_by" UUID,
          "deleted_at" TIMESTAMP WITH TIME ZONE,
          "deleted_by" UUID,
          "is_deleted" BOOLEAN DEFAULT FALSE,
          UNIQUE("module", "action")
        );
      `, { transaction });

      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_permissions_module_action" ON "permissions"("module", "action");`, { transaction });
      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_permissions_is_deleted" ON "permissions"("is_deleted");`, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "permissions" CASCADE;`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
