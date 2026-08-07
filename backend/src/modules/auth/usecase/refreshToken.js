/**
 * Factory for refreshToken usecase.
 * @param {object} dependencies
 * @param {import('sequelize').Sequelize} dependencies.sequelize
 * @param {Function} dependencies.getRefreshToken
 * @param {Function} dependencies.getUserById
 * @param {Function} dependencies.getUserRoles
 * @param {Function} dependencies.getUserPermissions
 * @param {object} dependencies.jwt
 * @param {string} dependencies.jwtSecret
 * @param {string} dependencies.jwtRefreshSecret
 */
module.exports = function makeRefreshToken({
  sequelize,
  getRefreshToken,
  getUserById,
  getUserRoles,
  getUserPermissions,
  jwt,
  jwtSecret,
  jwtRefreshSecret
}) {
  return async function refreshToken(token) {
    if (!token) {
      throw new Error('Refresh token is required');
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtRefreshSecret);
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }

    const storedToken = await getRefreshToken(sequelize, token);
    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    if (storedToken.revoked_at) {
      throw new Error('Refresh token has been revoked');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new Error('Refresh token has expired');
    }

    const user = await getUserById(sequelize, payload.id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status && user.status !== 'active') {
      throw new Error('Account is inactive or suspended');
    }

    // Retrieve roles and permissions
    const roles = await getUserRoles(sequelize, user.id);
    const permissions = await getUserPermissions(sequelize, user.id);

    const roleNames = roles.map(r => r.name);
    const permissionNames = permissions.map(p => `${p.module}:${p.action}`);

    // Generate new access token
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

    return {
      accessToken
    };
  };
};
