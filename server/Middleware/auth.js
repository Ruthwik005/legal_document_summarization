const jwt = require('jsonwebtoken');
const User = require('../model/User');

// Regular authentication middleware (for all users)
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with valid token
    const user = await User.findOne({
       email: decoded.email,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Attach user and token to request
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: error.message || 'Please authenticate'
    });
  }
};

// Admin-specific middleware (extends regular auth)
const verifyAdmin = async (req, res, next) => {
  try {
    // First verify regular authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
       email: decoded.email,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Additional admin check
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: error.message || 'Please authenticate as admin'
    });
  }
};

module.exports = { auth, verifyAdmin };