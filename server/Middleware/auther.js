const jwt = require("jsonwebtoken");
const User = require("../model/User");

module.exports = async (req, res, next) => {
  // Skip preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth token received:', token); // Debug token
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug decoded payload
    
    const user = await User.findById(decoded.userId);
    console.log('User lookup result:', user ? user._id : 'No user found'); // Debug user
    
    if (!user) {
      console.log('User not found for userId:', decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    
    if (error.name === 'TokenExpiredError') {
      console.log('Token expired');
      return res.status(401).json({ error: "Session expired. Please login again." });
    }
    if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token');
      return res.status(401).json({ error: "Invalid token. Please login again." });
    }
    
    console.log('Other auth error:', error.message);
    res.status(401).json({ error: "Please authenticate" });
  }
};