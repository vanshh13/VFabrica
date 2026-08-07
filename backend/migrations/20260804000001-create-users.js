'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`, { transaction });
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "phone" VARCHAR(50),
          "password_hash" VARCHAR(255) NOT NULL,
          "is_email_verified" BOOLEAN DEFAULT FALSE,
          "is_phone_verified" BOOLEAN DEFAULT FALSE,
          "status" VARCHAR(50) DEFAULT 'active',
          "last_active" TIMESTAMP WITH TIME ZONE,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "created_by" UUID,
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_by" UUID,
          "deleted_at" TIMESTAMP WITH TIME ZONE,
          "deleted_by" UUID,
          "is_deleted" BOOLEAN DEFAULT FALSE
        );
      `, { transaction });

      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");`, { transaction });
      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_users_is_deleted" ON "users"("is_deleted");`, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "users" CASCADE;`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
