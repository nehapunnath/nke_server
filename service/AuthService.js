// import { doc, getDoc } from 'firebase/firestore';
// import { db } from './firebase'; // You'll need to set up Firestore

// // Alternatively, you can use a hardcoded list of admin emails
// const ADMIN_EMAILS = ['admin@example.com']; // Replace with your admin email

// export const isAdminEmail = (email) => {
//   return ADMIN_EMAILS.includes(email);
// };

// // If using Firestore to store admin users
// export const verifyAdmin = async (uid) => {
//   try {
//     const adminDoc = await getDoc(doc(db, 'admins', uid));
//     return adminDoc.exists();
//   } catch (error) {
//     console.error('Error verifying admin status:', error);
//     return false;
//   }
// };