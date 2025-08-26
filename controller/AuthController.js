// controller/AuthController.js
const { auth } = require('../firebase');
const { signInWithEmailAndPassword, signOut } = require('firebase/auth');
const admin = require('../firebaseAdmin');

class AuthController {
  static async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      // Check if the email is the admin email
      if (email !== 'nke_admin@gmail.com') {
        return res.status(403).json({
          success: false,
          error: 'Access restricted to administrators only',
        });
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      res.json({
        success: true,
        token,
        user: {
          uid: user.uid,
          email: user.email,
          isAdmin: true,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);
      let errorMessage = 'Authentication failed';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'User account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        default:
          errorMessage = error.message;
      }
      res.status(401).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  static async logout(req, res) {
    try {
      await signOut(auth);
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async verifyToken(req, res) {
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

      res.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          isAdmin: decodedToken.email === 'nke_admin@gmail.com',
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  }
}

module.exports = AuthController;