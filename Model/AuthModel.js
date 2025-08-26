// models/AuthModel.js
const admin = require('../firebaseAdmin');
const { auth } = require('../firebase');
const { signInWithEmailAndPassword } = require('firebase/auth');

class AuthModel {
  static async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return { success: true, decodedToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async isAdmin(uid) {
    try {
      const user = await admin.auth().getUser(uid);
      // Check if the user is the admin based on email
      return user.email === 'nke_admin@gmail.com';
    } catch (error) {
      return false;
    }
  }

  static async adminLogin(email, password) {
    try {
      // Check if the email is the admin email
      if (email !== 'nke_admin@gmail.com') {
        return { success: false, error: 'Access restricted to administrators only' };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth success!');
      const token = await userCredential.user.getIdToken();
      const isAdmin = await this.isAdmin(userCredential.user.uid);

      if (!isAdmin) {
        console.log('❌ User is not an admin');
        await auth.signOut();
        return { success: false, error: 'Not an admin user' };
      }

      return { success: true, token };
    } catch (error) {
      console.error('🔥 Firebase Error:', error.message);
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
      return { success: false, error: errorMessage };
    }
  }

  static async setAdminClaim(uid) {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AuthModel;