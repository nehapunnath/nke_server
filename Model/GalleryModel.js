const { db, storage } = require('../firebaseAdmin'); // Adjust path to your Firebase config
const path = require('path');

class GalleryImage {
  constructor(imageData) {
    this.name = imageData.name;
    this.size = imageData.size;
    this.date = imageData.date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.url = imageData.url;
    this.path = imageData.path;
    this.filename = imageData.filename;
    this.createdAt = imageData.createdAt || new Date().toISOString();
    this.updatedAt = imageData.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Image name is required');
    if (!this.size) errors.push('Image size is required');
    if (!this.url) errors.push('Image URL is required');
    if (!this.path) errors.push('Image path is required');
    if (!this.filename) errors.push('Image filename is required');
    return errors;
  }

  toJSON() {
    return {
      name: this.name,
      size: this.size,
      date: this.date,
      url: this.url,
      path: this.path,
      filename: this.filename,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class GalleryModel {
  constructor() {
    this.ref = db.ref('gallery');
  }

  // Create a new image record
  async create(imageData) {
    try {
      const galleryImage = new GalleryImage(imageData);
      const validationErrors = galleryImage.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const newImageRef = this.ref.push();
      const imageRecord = {
        id: newImageRef.key,
        ...galleryImage.toJSON(),
      };

      await newImageRef.set(imageRecord);
      return imageRecord;
    } catch (error) {
      throw new Error(`Error creating image record: ${error.message}`);
    }
  }

  // Upload image to Firebase Storage
  async uploadToStorage(file) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `image-${uniqueSuffix}${path.extname(file.originalname)}`;
      const fileRef = storage.bucket().file(`gallery/${filename}`);
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
        public: true,
      });
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });
      return {
        url,
        path: `gallery/${filename}`,
        filename,
        originalName: file.originalname,
      };
    } catch (error) {
      throw new Error(`Error uploading image to storage: ${error.message}`);
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
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          if (image.name && image.name.toLowerCase().includes(searchTerm)) {
            images.push(image);
          }
        } else {
          images.push(image);
        }
      });

      return images.reverse(); // Newest first
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

  // Update an image record
  async update(id, updates, file) {
    try {
      const existingImage = await this.findById(id);
      if (!existingImage) {
        throw new Error('Image not found');
      }

      let imageData = { ...existingImage, ...updates, updatedAt: new Date().toISOString() };
      if (file) {
        // Delete old image from storage
        if (existingImage.path) {
          await storage.bucket().file(existingImage.path).delete().catch(() => {});
        }
        // Upload new image
        const uploadData = await this.uploadToStorage(file);
        imageData = {
          ...imageData,
          url: uploadData.url,
          path: uploadData.path,
          filename: uploadData.filename,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        };
      }

      const galleryImage = new GalleryImage(imageData);
      const validationErrors = galleryImage.validate();
      if (validationErrors.length > 0) {
        if (file) {
          await storage.bucket().file(imageData.path).delete().catch(() => {});
        }
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      await this.ref.child(id).update(galleryImage.toJSON());
      return { id, ...galleryImage.toJSON() };
    } catch (error) {
      throw new Error(`Error updating image: ${error.message}`);
    }
  }

  // Delete an image record and file
  async delete(id) {
    try {
      const image = await this.findById(id);
      if (!image) {
        throw new Error('Image not found');
      }

      if (image.path) {
        await storage.bucket().file(image.path).delete().catch(() => {});
      }

      await this.ref.child(id).remove();
      return true;
    } catch (error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
  }
}

module.exports = new GalleryModel();