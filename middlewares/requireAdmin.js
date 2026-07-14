const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Access Forbidden: Admins only." });
  }
  next();
};

module.exports = requireAdmin;
