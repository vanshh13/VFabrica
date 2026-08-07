'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "token" VARCHAR(255) UNIQUE NOT NULL,
          "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
          "used_at" TIMESTAMP WITH TIME ZONE,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `, { transaction });

      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_token" ON "password_reset_tokens"("token");`, { transaction });
      await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");`, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
