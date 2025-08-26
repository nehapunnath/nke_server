// Middleware/AuthMiddleware.js
const admin = require('../firebaseAdmin');

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // For now, assume nke_admin@gmail.com is the admin
    if (decodedToken.email !== 'nke_admin@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: true,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

module.exports = { verifyAdmin };