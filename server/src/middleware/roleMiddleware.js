export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        error: 'Unauthorized: No user session found'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to perform this action'
      });
    }
    next();
  };
};
