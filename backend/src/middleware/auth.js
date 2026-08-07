const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: JWT secret is missing'
    });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header with Bearer token is required'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // decoded contains: id, email, roles, permissions
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token'
    });
  }
}

/**
 * Middleware to check if user has a specific permission.
 * Format: "module:action" (e.g. "products:create")
 */
function requirePermission(moduleName, actionName) {
  return function (req, res, next) {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: No permissions assigned'
      });
    }

    const requiredPermission = `${moduleName}:${actionName}`;
    const hasPermission =
      req.user.permissions.includes(requiredPermission) ||
      req.user.permissions.includes('*:*') ||
      req.user.roles.includes('ADMIN'); // Admin has access to everything

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires permission '${requiredPermission}'`
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has a specific role.
 */
function requireRole(roleName) {
  return function (req, res, next) {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: No roles assigned'
      });
    }

    const targetRole = roleName.toUpperCase();
    const hasRole = req.user.roles.includes(targetRole) || req.user.roles.includes('ADMIN');

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires role '${targetRole}'`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requirePermission,
  requireRole
};
