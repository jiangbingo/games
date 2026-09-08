const { query } = require('../db');

/**
 * JWT-free token auth middleware.
 * Tokens are random UUIDs stored in the users table.
 * Resolves to req.authUserId for downstream IDOR checks.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const result = await query('SELECT user_id FROM users WHERE token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.authUserId = result.rows[0].user_id;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
