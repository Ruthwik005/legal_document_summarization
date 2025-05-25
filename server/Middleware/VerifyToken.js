const jwt = require("jsonwebtoken");
const User = require("../model/User");

module.exports.verifyToken = async (req, res, next) => {
  // Skip preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token ? `${token.slice(0, 10)}...` : 'None'); // Debug token

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ success: false, error: "Authentication required - no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug full payload

    // Look up user by email
    const user = await User.findOne({ email: decoded.email }).select('_id email username isVerified');
    console.log('User lookup result:', user ? { id: user._id, email: user.email, isVerified: user.isVerified } : 'No user found'); // Debug user

    if (!user) {
      console.log('User not found for email:', decoded.email);
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = user; // Set req.user with _id for NoteController
    next();
  } catch (error) {
    console.error("Error in verifyToken:", error);

    if (error.name === 'TokenExpiredError') {
      console.log('Token expired');
      return res.status(401).json({ success: false, error: "Session expired. Please login again." });
    }
    if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token');
      return res.status(401).json({ success: false, error: "Invalid token. Please login again." });
    }

    console.log('Other auth error:', error.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};