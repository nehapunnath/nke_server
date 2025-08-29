require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase, ServerValue } = require('firebase-admin/database');
const { getStorage } = require('firebase-admin/storage');
// const serviceAccount = require('./config/serviceAccountkKey.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)


const app = initializeApp({
  credential: cert(serviceAccount),
  // databaseURL: 'https://nke-infinity-tech-solutions-default-rtdb.asia-southeast1.firebasedatabase.app',
  // storageBucket: 'nke-infinity-tech-solutions.firebasestorage.app'
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket:process.env.FIREBASE_STORAGE_BUCKET
  
});

const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('Firebase Admin SDK initialized successfully');

module.exports = { app, auth, db, ServerValue,storage };