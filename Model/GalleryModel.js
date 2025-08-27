const { db } = require('../firebaseAdmin');

class GalleryModel {
  constructor() {
    this.ref = db.ref('gallery');
  }

  // Create a new image record
  async create(imageData) {
    try {
      const newImageRef = this.ref.push();
      const timestamp = Date.now();
      
      const imageRecord = {
        id: newImageRef.key,
        ...imageData,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await newImageRef.set(imageRecord);
      return imageRecord;
    } catch (error) {
      throw new Error(`Error creating image record: ${error.message}`);
    }
  }

  // Get all images with optional filtering
  async findAll(filters = {}) {
    try {
      const snapshot = await this.ref.orderByChild('createdAt').once('value');
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const images = [];
      snapshot.forEach(childSnapshot => {
        const image = childSnapshot.val();
        
        // Apply search filter if provided
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          if (image.name && image.name.toLowerCase().includes(searchTerm)) {
            images.push(image);
          }
        } else {
          images.push(image);
        }
      });
      
      // Reverse to get newest first
      return images.reverse();
    } catch (error) {
      throw new Error(`Error retrieving images: ${error.message}`);
    }
  }

  // Get a single image by ID
  async findById(id) {
    try {
      const snapshot = await this.ref.child(id).once('value');
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return snapshot.val();
    } catch (error) {
      throw new Error(`Error retrieving image: ${error.message}`);
    }
  }

  // Delete an image record
  async delete(id) {
    try {
      await this.ref.child(id).remove();
      return true;
    } catch (error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
  }
}

module.exports = new GalleryModel();