const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production!

// Generate JWT token for authenticated users
const generateToken = (user) => {
  const payload = {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role || 'user' // Include user role if available
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
};

// Middleware to authenticate requests
const requireAuth = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Attach user information to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication middleware
// Proceeds even if no token is provided, but attaches user info if token exists
const optionalAuth = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Attach user information to request
    req.user = decoded;
  } catch (error) {
    // Continue without setting req.user if token is invalid
  }
  
  next();
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
};

module.exports = {
  generateToken,
  requireAuth,
  optionalAuth,
  requireAdmin
};