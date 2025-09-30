const partnersModel = require('../Model/PartnersModel');
const { storage } = require('../firebaseAdmin');
const path = require('path');

class PartnersController {
  async addPartners(req, res) {
    try {
      const imageFiles = req.files || [];
      console.log('Received files:', imageFiles.map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      })));

      if (!imageFiles.length) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded',
        });
      }

      const uploadedFiles = []; // Track uploaded file paths for cleanup
      try {
        const uploadedPartners = await Promise.all(
          imageFiles.map(async (file) => {
            console.log('Uploading file:', file.originalname);
            const uploadData = await partnersModel.uploadToStorage(file);
            uploadedFiles.push(uploadData.path); // Track file path
            const partnerData = {
              logoUrl: uploadData.url,
              category: 'Uncategorized',
              path: uploadData.path,
              filename: uploadData.filename,
            };
            return await partnersModel.create(partnerData);
          })
        );

        res.status(201).json({
          success: true,
          message: `${uploadedPartners.length} partner(s) uploaded successfully`,
          partners: uploadedPartners,
        });
      } catch (error) {
        // Cleanup uploaded files on error
        await Promise.all(
          uploadedFiles.map(async (filePath) => {
            await storage.bucket().file(filePath).delete().catch(() => {});
          })
        );
        throw error;
      }
    } catch (error) {
      console.error('Upload error:', error.message, error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getPartners(req, res) {
    try {
      const { search } = req.query;
      const filters = search ? { search } : {};
      const partners = await partnersModel.findAll(filters);
      res.status(200).json({
        success: true,
        partners,
      });
    } catch (error) {
      console.error('Get partners error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async deletePartner(req, res) {
    try {
      const { id } = req.params;
      await partnersModel.delete(id);
      res.status(200).json({
        success: true,
        message: 'Partner deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message.includes('Partner not found')) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found',
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

module.exports = new PartnersController();