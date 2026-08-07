/**
 * Factory for login usecase.
 * @param {object} dependencies
 * @param {import('sequelize').Sequelize} dependencies.sequelize
 * @param {Function} dependencies.getUserByEmail
 * @param {Function} dependencies.getUserRoles
 * @param {Function} dependencies.getUserPermissions
 * @param {Function} dependencies.createRefreshToken
 * @param {object} dependencies.bcrypt
 * @param {object} dependencies.jwt
 * @param {string} dependencies.jwtSecret
 * @param {string} dependencies.jwtRefreshSecret
 */
module.exports = function makeLogin({
  sequelize,
  getUserByEmail,
  getUserRoles,
  getUserPermissions,
  createRefreshToken,
  bcrypt,
  jwt,
  jwtSecret,
  jwtRefreshSecret
}) {
  return async function login({ email, password, device, ipAddress }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await getUserByEmail(sequelize, email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status && user.status !== 'active') {
      throw new Error('Account is inactive or suspended');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Retrieve roles and permissions
    const roles = await getUserRoles(sequelize, user.id);
    const permissions = await getUserPermissions(sequelize, user.id);

    const roleNames = roles.map(r => r.name);
    const permissionNames = permissions.map(p => `${p.module}:${p.action}`);

    // Generate JWT access token (short lived: 15 minutes)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: roleNames,
        permissions: permissionNames
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Generate JWT refresh token (long lived: 7 days)
    const refreshToken = jwt.sign(
      { id: user.id },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token to db
    await createRefreshToken(sequelize, {
      userId: user.id,
      token: refreshToken,
      device,
      ipAddress,
      expiresAt
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      roles: roleNames,
      permissions: permissionNames,
      accessToken,
      refreshToken
    };
  };
};
