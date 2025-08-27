const galleryModel = require('../Model/GalleryModel');
const fs = require('fs');
const path = require('path');

class GalleryController {
  // Upload image and create record
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, filename, size } = req.file;
      
      // Create image data for database
      const imageData = {
        name: originalname,
        filename: filename,
        size: `${(size / 1024 / 1024).toFixed(1)} MB`,
        url: `/uploads/${filename}`,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };

      // Save to database
      const image = await galleryModel.create(imageData);
      
      res.status(201).json({
        message: 'Image uploaded successfully',
        image
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all images
  async getImages(req, res) {
    try {
      const { search } = req.query;
      const filters = search ? { search } : {};
      
      const images = await galleryModel.findAll(filters);
      res.json(images);
    } catch (error) {
      console.error('Get images error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete an image
  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      
      // Get image record first to delete the file
      const image = await galleryModel.findById(id);
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file from server
      const filePath = path.join(__dirname, '../uploads', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete the record from database
      await galleryModel.delete(id);
      
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Serve uploaded images
  serveImage(req, res) {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  }
}

module.exports = new GalleryController();