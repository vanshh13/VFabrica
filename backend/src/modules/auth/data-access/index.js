// Data Access Layer for Authentication & RBAC

async function createUser(sequelize, { email, phone, passwordHash }) {
  const result = await sequelize.query(
    `INSERT INTO "users" ("email", "phone", "password_hash", "status", "created_at", "updated_at")
     VALUES (:email, :phone, :passwordHash, 'active', NOW(), NOW())
     RETURNING "id", "email", "phone", "status", "created_at", "updated_at";`,
    {
      replacements: { email, phone, passwordHash },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

async function getUserByEmail(sequelize, email) {
  const result = await sequelize.query(
    `SELECT * FROM "users" WHERE "email" = :email AND "is_deleted" = FALSE LIMIT 1;`,
    {
      replacements: { email },
      type: 'SELECT'
    }
  );
  return result[0] || null;
}

async function getUserById(sequelize, id) {
  const result = await sequelize.query(
    `SELECT "id", "email", "phone", "status", "is_email_verified", "is_phone_verified", "created_at"
     FROM "users"
     WHERE "id" = :id AND "is_deleted" = FALSE LIMIT 1;`,
    {
      replacements: { id },
      type: 'SELECT'
    }
  );
  return result[0] || null;
}

async function updateUserPassword(sequelize, { userId, passwordHash }) {
  const result = await sequelize.query(
    `UPDATE "users" SET "password_hash" = :passwordHash, "updated_at" = NOW() WHERE "id" = :userId AND "is_deleted" = FALSE RETURNING "id", "email";`,
    {
      replacements: { userId, passwordHash },
      type: 'UPDATE'
    }
  );
  return result[0][0] || null;
}

async function getRoleByName(sequelize, name) {
  const result = await sequelize.query(
    `SELECT * FROM "roles" WHERE "name" = :name AND "is_deleted" = FALSE LIMIT 1;`,
    {
      replacements: { name },
      type: 'SELECT'
    }
  );
  return result[0] || null;
}

async function assignUserRole(sequelize, { userId, roleId }) {
  const result = await sequelize.query(
    `INSERT INTO "user_roles" ("user_id", "role_id", "created_at")
     VALUES (:userId, :roleId, NOW())
     ON CONFLICT ("user_id", "role_id") DO NOTHING
     RETURNING *;`,
    {
      replacements: { userId, roleId },
      type: 'INSERT'
    }
  );
  return result[0][0] || null;
}

async function getUserRoles(sequelize, userId) {
  const result = await sequelize.query(
    `SELECT r."id", r."name", r."description"
     FROM "roles" r
     JOIN "user_roles" ur ON r."id" = ur."role_id"
     WHERE ur."user_id" = :userId AND r."is_deleted" = FALSE;`,
    {
      replacements: { userId },
      type: 'SELECT'
    }
  );
  return result;
}

async function getUserPermissions(sequelize, userId) {
  const result = await sequelize.query(
    `SELECT DISTINCT p."id", p."module", p."action", p."description"
     FROM "permissions" p
     JOIN "role_permissions" rp ON p."id" = rp."permission_id"
     JOIN "user_roles" ur ON rp."role_id" = ur."role_id"
     WHERE ur."user_id" = :userId AND p."is_deleted" = FALSE;`,
    {
      replacements: { userId },
      type: 'SELECT'
    }
  );
  return result;
}

async function createRefreshToken(sequelize, { userId, token, device, ipAddress, expiresAt }) {
  const result = await sequelize.query(
    `INSERT INTO "refresh_tokens" ("user_id", "token", "device", "ip_address", "expires_at", "created_at")
     VALUES (:userId, :token, :device, :ipAddress, :expiresAt, NOW())
     RETURNING *;`,
    {
      replacements: { userId, token, device, ipAddress, expiresAt },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

async function getRefreshToken(sequelize, token) {
  const result = await sequelize.query(
    `SELECT * FROM "refresh_tokens" WHERE "token" = :token LIMIT 1;`,
    {
      replacements: { token },
      type: 'SELECT'
    }
  );
  return result[0] || null;
}

async function revokeRefreshToken(sequelize, token) {
  const result = await sequelize.query(
    `UPDATE "refresh_tokens" SET "revoked_at" = NOW() WHERE "token" = :token RETURNING *;`,
    {
      replacements: { token },
      type: 'UPDATE'
    }
  );
  return result[0][0] || null;
}

async function createPasswordResetToken(sequelize, { userId, token, expiresAt }) {
  const result = await sequelize.query(
    `INSERT INTO "password_reset_tokens" ("user_id", "token", "expires_at", "created_at")
     VALUES (:userId, :token, :expiresAt, NOW())
     RETURNING *;`,
    {
      replacements: { userId, token, expiresAt },
      type: 'INSERT'
    }
  );
  return result[0][0];
}

async function getPasswordResetToken(sequelize, token) {
  const result = await sequelize.query(
    `SELECT * FROM "password_reset_tokens" WHERE "token" = :token LIMIT 1;`,
    {
      replacements: { token },
      type: 'SELECT'
    }
  );
  return result[0] || null;
}

async function usePasswordResetToken(sequelize, token) {
  const result = await sequelize.query(
    `UPDATE "password_reset_tokens" SET "used_at" = NOW() WHERE "token" = :token RETURNING *;`,
    {
      replacements: { token },
      type: 'UPDATE'
    }
  );
  return result[0][0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserPassword,
  getRoleByName,
  assignUserRole,
  getUserRoles,
  getUserPermissions,
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  createPasswordResetToken,
  getPasswordResetToken,
  usePasswordResetToken
};
