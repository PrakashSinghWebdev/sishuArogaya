// Usage: authorize('admin'), authorize('asha', 'admin'), etc.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized for this resource`,
      });
    }
    next();
  };
};

module.exports = { authorize };
