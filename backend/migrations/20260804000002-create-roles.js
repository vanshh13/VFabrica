'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "roles" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" VARCHAR(255) UNIQUE NOT NULL,
          "description" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "created_by" UUID,
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_by" UUID,
          "deleted_at" TIMESTAMP WITH TIME ZONE,
          "deleted_by" UUID,
          "is_deleted" BOOLEAN DEFAULT FALSE
        );
      `, { transaction });

      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "roles"("name");`, { transaction });
      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_roles_is_deleted" ON "roles"("is_deleted");`, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "roles" CASCADE;`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
