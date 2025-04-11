/**
 * Authentication Middleware
 */

/**
 * Verify admin authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const requireAdminAuth = (req, res, next) => {
  try {
    // Get token from request header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      // Check if request is an API request
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized, please login', redirect: '/html/admin/login.html' });
      } else {
        return res.redirect('/html/admin/login.html');
      }
    }

    // Use verifyAdminToken function from server.js to verify token
    try {
      const payload = Buffer.from(token, 'base64').toString('utf-8');
      const [adminId, username, timestamp] = payload.split(':');
      
      // Simple check if token is valid (24-hour expiration)
      const now = Date.now();
      const issued = parseInt(timestamp, 10);
      if (now - issued > 24 * 60 * 60 * 1000) {
        throw new Error('Token has expired');
      }
      
      // Add admin information to request object
      req.admin = { id: parseInt(adminId, 10), username };
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      // Check if request is an API request
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication failed, please login again', redirect: '/html/admin/login.html' });
      } else {
        return res.redirect('/html/admin/login.html');
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    // Check if request is an API request
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication failed, please login again', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
};

/**
 * Verify user authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const requireUserAuth = (req, res, next) => {
  try {
    // Get token from request header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized, please login' });
    }

    // Simple token verification
    try {
      // Add user information to request object
      // Note: This should be parsed according to your token structure
      // If you implement JWT or similar, please modify this accordingly
      req.user = { token };
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Authentication failed, please login again' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed, please login again' });
  }
};

/**
 * Verify admin token
 * @param {Object} req - Request object
 * @returns {Object|null} Admin information or null
 */
const verifyAdminToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return null;
    }

    // Parse token
    const payload = Buffer.from(token, 'base64').toString('utf-8');
    const [adminId, username, timestamp] = payload.split(':');
    
    // Check if token is expired (24 hours)
    const now = Date.now();
    const issued = parseInt(timestamp, 10);
    if (now - issued > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return { 
      adminId: parseInt(adminId, 10), 
      username 
    };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
};

module.exports = {
  requireAdminAuth,
  requireUserAuth,
  verifyAdminToken
}; 