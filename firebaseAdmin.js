// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountkKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

console.log('Firebase Admin SDK initialized successfully');
module.exports = admin;