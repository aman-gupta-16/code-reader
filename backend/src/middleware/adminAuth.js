export function adminAuth(req, res, next) {
  const providedKey = req.header('x-admin-key');
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      message: 'ADMIN_API_KEY is not configured on the server.',
    });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      message: 'Unauthorized admin request.',
    });
  }

  return next();
}
