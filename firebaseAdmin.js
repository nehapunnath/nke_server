const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase, ServerValue } = require('firebase-admin/database');
// const serviceAccount = require('./config/serviceAccountkKey.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)


const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = getDatabase(app);
const auth = getAuth(app);

console.log('Firebase Admin SDK initialized successfully');

module.exports = { app, auth, db, ServerValue };