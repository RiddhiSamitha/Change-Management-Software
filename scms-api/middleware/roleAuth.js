// This middleware runs AFTER authMiddleware
const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    // We expect authMiddleware to have already run and attached req.user
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // 403 Forbidden is the correct status for a user who is logged in
      // but does not have the necessary permissions.
      return res.status(403).json({ 
        message: 'Forbidden: Your role does not have permission for this action.' 
      });
    }
    // User has the correct role, proceed
    next();
  };
};

module.exports = roleAuth;