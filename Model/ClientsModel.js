const { db, storage } = require('../firebaseAdmin');
const path = require('path');

class Client {
  constructor(clientData) {
    this.logoUrl = clientData.logoUrl;
    this.category = clientData.category || 'Uncategorized';
    this.createdAt = clientData.createdAt || new Date().toISOString();
    this.updatedAt = clientData.updatedAt || new Date().toISOString();
    this.path = clientData.path;
    this.filename = clientData.filename;
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

class ClientsModel {
  constructor() {
    this.clientsRef = db.ref('clients');
  }

  async create(clientData) {
    try {
      const client = new Client(clientData);
      const validationErrors = client.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const newClientRef = this.clientsRef.push();
      const clientRecord = {
        id: newClientRef.key,
        ...client.toJSON(),
      };

      await newClientRef.set(clientRecord);
      return clientRecord;
    } catch (error) {
      throw new Error(`Error creating client record: ${error.message}`);
    }
  }

  async uploadToStorage(file) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `client-logo-${uniqueSuffix}${path.extname(file.originalname)}`;
      const fileRef = storage.bucket().file(`clients/${filename}`);
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
        path: `clients/${filename}`,
        filename,
      };
    } catch (error) {
      throw new Error(`Error uploading image to storage: ${error.message}`);
    }
  }

  async findAll(filters = {}) {
    try {
      const snapshot = await this.clientsRef.orderByChild('createdAt').once('value');
      if (!snapshot.exists()) {
        return [];
      }

      const clients = [];
      snapshot.forEach((childSnapshot) => {
        const client = childSnapshot.val();
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          if (
            (client.filename && client.filename.toLowerCase().includes(searchTerm)) ||
            (client.category && client.category.toLowerCase().includes(searchTerm))
          ) {
            clients.push(client);
          }
        } else {
          clients.push(client);
        }
      });

      return clients.reverse(); // Latest first
    } catch (error) {
      throw new Error(`Error retrieving clients: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const client = await this.findById(id);
      if (!client) {
        throw new Error('Client not found');
      }

      if (client.path) {
        await storage.bucket().file(client.path).delete().catch(() => {});
      }

      await this.clientsRef.child(id).remove();
      return true;
    } catch (error) {
      throw new Error(`Error deleting client: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const snapshot = await this.clientsRef.child(id).once('value');
      if (!snapshot.exists()) {
        return null;
      }
      return snapshot.val();
    } catch (error) {
      throw new Error(`Error retrieving client: ${error.message}`);
    }
  }
}

module.exports = new ClientsModel();