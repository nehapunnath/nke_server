// EnquiryController.js
const EnquiryModel = require('../Model/EnquiryModel');

class EnquiryController {
  static async submitEnquiry(req, res) {
    try {
      const { name, email, phone, company, message, product } = req.body;

      if (!name || !email || !phone || !message || !product) {
        console.warn('Missing required fields in enquiry submission');
        return res.status(400).json({
          success: false,
          error: 'Name, email, phone, message, and product are required',
        });
      }

      const enquiryData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company ? company.trim() : '',
        message: message.trim(),
        product: product.trim(),
      };

      if (!/\S+@\S+\.\S+/.test(enquiryData.email)) {
        console.warn(`Invalid email: ${enquiryData.email}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid email address',
        });
      }

      const result = await EnquiryModel.createEnquiry(enquiryData);

      if (!result.success) {
        console.error(`Failed to create enquiry: ${result.error}`);
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      console.log(`Enquiry created: ${result.id}`);
      res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully',
        id: result.id,
      });
    } catch (error) {
      console.error('Submit enquiry error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to submit enquiry',
      });
    }
  }

  static async getEnquiries(req, res) {
    try {
      const result = await EnquiryModel.getAllEnquiries();

      if (!result.success) {
        console.error(`Failed to get enquiries: ${result.error}`);
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        enquiries: result.enquiries,
      });
    } catch (error) {
      console.error('Get enquiries error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get enquiries',
      });
    }
  }

  static async updateEnquiryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        console.warn('Missing ID or status in update enquiry request');
        return res.status(400).json({
          success: false,
          error: 'ID and status are required',
        });
      }

      if (!['pending', 'responded', 'closed'].includes(status)) {
        console.warn(`Invalid status: ${status}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
        });
      }

      const result = await EnquiryModel.updateEnquiryStatus(id, status);

      if (!result.success) {
        console.error(`Failed to update enquiry status: ${result.error}`);
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      console.log(`Enquiry status updated: ${id} to ${status}`);
      res.json({
        success: true,
        message: 'Enquiry status updated successfully',
      });
    } catch (error) {
      console.error('Update enquiry status error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update enquiry status',
      });
    }
  }
}

module.exports = EnquiryController;