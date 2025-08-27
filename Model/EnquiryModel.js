const { db, ServerValue } = require('../firebaseAdmin');

class EnquiryModel {
  static async createEnquiry(enquiryData) {
    try {
      if (!db.ref) {
        throw new Error('Realtime Database is not properly initialized. db.ref is undefined.');
      }
      const enquiryRef = db.ref('enquiries').push();
      await enquiryRef.set({
        ...enquiryData,
        createdAt: ServerValue.TIMESTAMP,
        status: 'pending',
      });
      console.log('Enquiry created with ID:', enquiryRef.key);
      return { success: true, id: enquiryRef.key };
    } catch (error) {
      console.error('Error creating enquiry:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      if (error.code === 'database/permission-denied') {
        return { success: false, error: 'Permission denied accessing database' };
      }
      return { success: false, error: error.message };
    }
  }

  static async getAllEnquiries() {
    try {
      if (!db.ref) {
        throw new Error('Realtime Database is not properly initialized. db.ref is undefined.');
      }
      const snapshot = await db.ref('enquiries').orderByChild('createdAt').once('value');
      const enquiries = [];
      snapshot.forEach((childSnapshot) => {
        enquiries.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      // Sort in descending order of createdAt
      enquiries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      console.log('Retrieved enquiries:', enquiries.length);
      return { success: true, enquiries };
    } catch (error) {
      console.error('Error getting enquiries:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      if (error.code === 'database/permission-denied') {
        return { success: false, error: 'Permission denied accessing database' };
      }
      return { success: false, error: error.message };
    }
  }

  static async updateEnquiryStatus(id, status) {
    try {
      if (!db.ref) {
        throw new Error('Realtime Database is not properly initialized. db.ref is undefined.');
      }
      await db.ref(`enquiries/${id}`).update({
        status,
        updatedAt: ServerValue.TIMESTAMP,
      });
      console.log('Enquiry status updated:', { id, status });
      return { success: true };
    } catch (error) {
      console.error('Error updating enquiry status:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      if (error.code === 'database/permission-denied') {
        return { success: false, error: 'Permission denied accessing database' };
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = EnquiryModel;