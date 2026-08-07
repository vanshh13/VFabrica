/**
 * Factory for user registration usecase.
 * @param {object} dependencies
 * @param {import('sequelize').Sequelize} dependencies.sequelize
 * @param {Function} dependencies.createUser
 * @param {Function} dependencies.getUserByEmail
 * @param {Function} dependencies.getRoleByName
 * @param {Function} dependencies.assignUserRole
 * @param {object} dependencies.bcrypt
 */
module.exports = function makeRegister({
  sequelize,
  createUser,
  getUserByEmail,
  getRoleByName,
  assignUserRole,
  bcrypt
}) {
  return async function register({ email, phone, password, roleName }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await getUserByEmail(sequelize, email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Default role name is SUPPLIER if not specified
    const targetRole = roleName ? roleName.toUpperCase() : 'SUPPLIER';

    // Find role in DB
    let role = await getRoleByName(sequelize, targetRole);
    if (!role) {
      // If role does not exist, auto-create it to prevent registration failure
      const roleResult = await sequelize.query(
        `INSERT INTO "roles" ("name", "description", "created_at", "updated_at")
         VALUES (:name, :description, NOW(), NOW())
         ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description"
         RETURNING *;`,
        {
          replacements: { name: targetRole, description: `${targetRole} role` },
          type: 'INSERT'
        }
      );
      role = roleResult[0][0];
    }

    // Execute user creation and role assignment in a transaction
    const transaction = await sequelize.transaction();
    try {
      const user = await createUser(sequelize, { email, phone, passwordHash });
      await assignUserRole(sequelize, { userId: user.id, roleId: role.id });
      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
};
