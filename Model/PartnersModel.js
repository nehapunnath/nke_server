const { db, storage } = require('../firebaseAdmin');
const path = require('path');

class Partner {
  constructor(partnerData) {
    this.logoUrl = partnerData.logoUrl;
    this.category = partnerData.category || 'Uncategorized';
    this.createdAt = partnerData.createdAt || new Date().toISOString();
    this.updatedAt = partnerData.updatedAt || new Date().toISOString();
    this.path = partnerData.path;
    this.filename = partnerData.filename;
  }

  validate() {
    const errors = [];
    if (!this.logoUrl) errors.push('Logo URL is required');
    if (!this.category) errors.push('Category is required');
    return errors;
  }

  toJSON() {
    return {
      logoUrl: this.logoUrl,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      path: this.path,
      filename: this.filename,
    };
  }
}

class PartnersModel {
  constructor() {
    this.partnersRef = db.ref('partners');
  }

  async create(partnerData) {
    try {
      const partner = new Partner(partnerData);
      const validationErrors = partner.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const newPartnerRef = this.partnersRef.push();
      const partnerRecord = {
        id: newPartnerRef.key,
        ...partner.toJSON(),
      };

      await newPartnerRef.set(partnerRecord);
      return partnerRecord;
    } catch (error) {
      throw new Error(`Error creating partner record: ${error.message}`);
    }
  }

  async uploadToStorage(file) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `partner-logo-${uniqueSuffix}${path.extname(file.originalname)}`;
      const fileRef = storage.bucket().file(`partners/${filename}`);
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
        path: `partners/${filename}`,
        filename,
      };
    } catch (error) {
      throw new Error(`Error uploading image to storage: ${error.message}`);
    }
  }

  async findAll(filters = {}) {
    try {
      const snapshot = await this.partnersRef.orderByChild('createdAt').once('value');
      if (!snapshot.exists()) {
        return [];
      }

      const partners = [];
      snapshot.forEach((childSnapshot) => {
        const partner = childSnapshot.val();
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          if (
            (partner.filename && partner.filename.toLowerCase().includes(searchTerm)) ||
            (partner.category && partner.category.toLowerCase().includes(searchTerm))
          ) {
            partners.push(partner);
          }
        } else {
          partners.push(partner);
        }
      });

      return partners.reverse(); // Latest first
    } catch (error) {
      throw new Error(`Error retrieving partners: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const partner = await this.findById(id);
      if (!partner) {
        throw new Error('Partner not found');
      }

      if (partner.path) {
        await storage.bucket().file(partner.path).delete().catch(() => {});
      }

      await this.partnersRef.child(id).remove();
      return true;
    } catch (error) {
      throw new Error(`Error deleting partner: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const snapshot = await this.partnersRef.child(id).once('value');
      if (!snapshot.exists()) {
        return null;
      }
      return snapshot.val();
    } catch (error) {
      throw new Error(`Error retrieving partner: ${error.message}`);
    }
  }
}

module.exports = new PartnersModel();