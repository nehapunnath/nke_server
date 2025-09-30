const clientsModel = require('../Model/ClientsModel');
const { storage } = require('../firebaseAdmin');
const path = require('path');

class ClientsController {
  async addClients(req, res) {
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
        const uploadedClients = await Promise.all(
          imageFiles.map(async (file) => {
            console.log('Uploading file:', file.originalname);
            const uploadData = await clientsModel.uploadToStorage(file);
            uploadedFiles.push(uploadData.path); // Track file path
            const clientData = {
              logoUrl: uploadData.url,
              category: 'Uncategorized',
              path: uploadData.path,
              filename: uploadData.filename,
            };
            return await clientsModel.create(clientData);
          })
        );

        res.status(201).json({
          success: true,
          message: `${uploadedClients.length} client(s) uploaded successfully`,
          clients: uploadedClients,
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

  async getClients(req, res) {
    try {
      const { search } = req.query;
      const filters = search ? { search } : {};
      const clients = await clientsModel.findAll(filters);
      res.status(200).json({
        success: true,
        clients,
      });
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      await clientsModel.delete(id);
      res.status(200).json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message.includes('Client not found')) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
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

module.exports = new ClientsController();