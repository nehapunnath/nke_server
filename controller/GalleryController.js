const galleryModel = require('../Model/GalleryModel');
const { storage } = require('../firebaseAdmin');
const path = require('path');

class GalleryController {
  async addImages(req, res) {
    try {
      const imageFiles = req.files || [];
      const names = req.body.names || []; 
      console.log('Received files:', imageFiles, 'Names:', names); 
      if (!imageFiles.length) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded',
        });
      }

      const uploadedImages = await Promise.all(
        imageFiles.map(async (file, index) => {
          console.log('Uploading file:', file.originalname);
          const uploadData = await galleryModel.uploadToStorage(file);
          const imageData = {
            name: names[index] || file.originalname, 
            size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            url: uploadData.url,
            path: uploadData.path,
            filename: uploadData.filename,
          };
          console.log('Image data:', imageData);
          return await galleryModel.create(imageData);
        })
      );

      res.status(201).json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        images: uploadedImages,
      });
    } catch (error) {
      console.error('Upload error:', error.message, error.stack);
      if (req.files) {
        await Promise.all(
          req.files.map(async (file) => {
            const filename = `image-${Date.now()}-${Math.round(
              Math.random() * 1e9
            )}${path.extname(file.originalname)}`;
            await storage.bucket().file(`gallery/${filename}`).delete().catch(() => {});
          })
        );
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getImages(req, res) {
    try {
      const { search } = req.query;
      const filters = search ? { search } : {};
      const images = await galleryModel.findAll(filters);
      res.status(200).json({
        success: true,
        images,
      });
    } catch (error) {
      console.error('Get images error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async updateImage(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const file = req.file;

      const updatedImage = await galleryModel.update(id, updates, file);
      res.status(200).json({
        success: true,
        message: 'Image updated successfully',
        image: updatedImage,
      });
    } catch (error) {
      console.error('Update error:', error);
      if (req.file) {
        const filename = `image-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${path.extname(req.file.originalname)}`;
        await storage.bucket().file(`gallery/${filename}`).delete().catch(() => {});
      }
      if (error.message.includes('Image not found')) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      await galleryModel.delete(id);
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message.includes('Image not found')) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

module.exports = new GalleryController();