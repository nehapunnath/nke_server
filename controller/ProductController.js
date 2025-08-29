const { Product, CategoryCatalogue } = require('../Model/ProductModel');
const { db, storage } = require('../firebaseAdmin');
const path = require('path'); // Only needed for path.extname

class ProductController {
  static async addProduct(req, res) {
    try {
      const imageFiles = req.files || [];
      const { name, brand, category, price, modelNo, warranty, stockStatus, description, specs } = req.body;

      let parsedSpecs = [];
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
      } catch (error) {
        parsedSpecs = Array.isArray(specs) ? specs : [specs];
      }

      const filteredSpecs = parsedSpecs.filter(spec => spec && spec.trim() !== '');

      // Upload images to Firebase Storage
      const images = await Promise.all(imageFiles.map(async (img) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `image-${uniqueSuffix}${path.extname(img.originalname)}`;
        const fileRef = storage.bucket().file(`images/${filename}`);
        await fileRef.save(img.buffer, {
          metadata: { contentType: img.mimetype },
          public: true,
        });
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-09-2491', // Long-term URL
        });
        return {
          filename,
          originalName: img.originalname,
          path: `images/${filename}`,
          url,
        };
      }));

      const productData = {
        name,
        brand,
        category,
        price: parseFloat(price) || 0,
        modelNo,
        warranty,
        stockStatus,
        description,
        specs: filteredSpecs,
        images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const product = new Product(productData);
      const validationErrors = product.validate();
      if (validationErrors.length > 0) {
        // Clean up uploaded images if validation fails
        await Promise.all(images.map(async (img) => {
          await storage.bucket().file(img.path).delete().catch(() => {});
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      const productsRef = db.ref('products');
      const newProductRef = productsRef.push();
      await newProductRef.set(product.toJSON());
      const productId = newProductRef.key;

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        productId: productId,
        product: product.toJSON(),
      });
    } catch (error) {
      console.error('Error adding product:', error);
      if (req.files) {
        await Promise.all(req.files.map(async (img) => {
          const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(img.originalname)}`;
          await storage.bucket().file(`images/${filename}`).delete().catch(() => {});
        }));
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async uploadCategoryCatalogue(req, res) {
    try {
      const { category } = req.body;
      const catalogueFile = req.file || null;

      if (!category) {
        if (catalogueFile) {
          const filename = `catalogue-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(catalogueFile.originalname)}`;
          await storage.bucket().file(`catalogues/${filename}`).delete().catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }

      if (!catalogueFile) {
        return res.status(400).json({
          success: false,
          message: 'Catalogue file is required',
        });
      }

      // Upload catalogue to Firebase Storage
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `catalogue-${uniqueSuffix}${path.extname(catalogueFile.originalname)}`;
      const fileRef = storage.bucket().file(`catalogues/${filename}`);
      await fileRef.save(catalogueFile.buffer, {
        metadata: { contentType: catalogueFile.mimetype },
        public: true,
      });
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Long-term URL
      });

      const catalogueData = {
        category,
        catalogue: {
          filename,
          originalName: catalogueFile.originalname,
          path: `catalogues/${filename}`,
          url,
        },
      };

      const categoryCatalogue = new CategoryCatalogue(catalogueData);
      const validationErrors = categoryCatalogue.validate();
      if (validationErrors.length > 0) {
        await fileRef.delete().catch(() => {});
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      const cataloguesRef = db.ref('categoryCatalogues');
      const snapshot = await cataloguesRef.orderByChild('category').equalTo(category).once('value');
      const existingCatalogues = snapshot.val();

      if (existingCatalogues) {
        const existingCatalogue = Object.values(existingCatalogues)[0];
        if (existingCatalogue.catalogue && existingCatalogue.catalogue.path) {
          await storage.bucket().file(existingCatalogue.catalogue.path).delete().catch(() => {});
        }
        const catalogueKey = Object.keys(existingCatalogues)[0];
        await cataloguesRef.child(catalogueKey).remove();
      }

      const newCatalogueRef = cataloguesRef.push();
      await newCatalogueRef.set(categoryCatalogue.toJSON());

      res.status(201).json({
        success: true,
        message: 'Category catalogue uploaded successfully',
        catalogueId: newCatalogueRef.key,
        catalogue: categoryCatalogue.toJSON(),
      });
    } catch (error) {
      console.error('Error uploading category catalogue:', error);
      if (req.file) {
        const filename = `catalogue-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        await storage.bucket().file(`catalogues/${filename}`).delete().catch(() => {});
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getCategoryCatalogue(req, res) {
    try {
      const { category } = req.params;
      const cataloguesRef = db.ref('categoryCatalogues');

      cataloguesRef.orderByChild('category').equalTo(category).once('value', (snapshot) => {
        const catalogue = snapshot.val();
        if (!catalogue) {
          return res.status(404).json({
            success: false,
            message: 'Catalogue not found for this category',
          });
        }
        res.status(200).json({
          success: true,
          catalogue: Object.values(catalogue)[0],
        });
      });
    } catch (error) {
      console.error('Error fetching category catalogue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async deleteCategoryCatalogue(req, res) {
    try {
      const { category } = req.params;
      const cataloguesRef = db.ref('categoryCatalogues');

      const snapshot = await cataloguesRef.orderByChild('category').equalTo(category).once('value');
      const catalogue = snapshot.val();

      if (!catalogue) {
        return res.status(404).json({
          success: false,
          message: 'Catalogue not found for this category',
        });
      }

      const catalogueKey = Object.keys(catalogue)[0];
      const catalogueData = Object.values(catalogue)[0];

      if (catalogueData.catalogue && catalogueData.catalogue.path) {
        await storage.bucket().file(catalogueData.catalogue.path).delete().catch(() => {});
      }

      await cataloguesRef.child(catalogueKey).remove();

      res.status(200).json({
        success: true,
        message: 'Category catalogue deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category catalogue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const productsRef = db.ref('products');
      productsRef.once('value', (snapshot) => {
        const products = snapshot.val();
        res.status(200).json({
          success: true,
          products: products || {},
        });
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const productRef = db.ref(`products/${id}`);
      productRef.once('value', (snapshot) => {
        const product = snapshot.val();
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
        res.status(200).json({
          success: true,
          product: product,
        });
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const imageFiles = req.files || [];
      const { name, brand, category, price, modelNo, warranty, stockStatus, description, specs, existingImages } = req.body;

      const productRef = db.ref(`products/${id}`);
      const snapshot = await productRef.once('value');
      if (!snapshot.exists()) {
        if (imageFiles) {
          await Promise.all(imageFiles.map(async (img) => {
            const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(img.originalname)}`;
            await storage.bucket().file(`images/${filename}`).delete().catch(() => {});
          }));
        }
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      let parsedExistingImages = [];
      try {
        parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (error) {
        parsedExistingImages = Array.isArray(existingImages) ? existingImages : [];
      }

      let parsedSpecs = [];
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
      } catch (error) {
        parsedSpecs = Array.isArray(specs) ? specs : [specs];
      }

      const filteredSpecs = parsedSpecs.filter(spec => spec && spec.trim() !== '');

      // Upload new images to Firebase Storage
      const newImages = await Promise.all(imageFiles.map(async (img) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `image-${uniqueSuffix}${path.extname(img.originalname)}`;
        const fileRef = storage.bucket().file(`images/${filename}`);
        await fileRef.save(img.buffer, {
          metadata: { contentType: img.mimetype },
          public: true,
        });
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        return {
          filename,
          originalName: img.originalname,
          path: `images/${filename}`,
          url,
        };
      }));

      const allImages = [...parsedExistingImages, ...newImages];

      const updates = {
        name,
        brand,
        category,
        price: parseFloat(price) || 0,
        modelNo,
        warranty,
        stockStatus,
        description,
        specs: filteredSpecs,
        images: allImages,
        updatedAt: new Date().toISOString(),
      };

      const product = new Product(updates);
      const validationErrors = product.validate();
      if (validationErrors.length > 0) {
        if (imageFiles) {
          await Promise.all(imageFiles.map(async (img) => {
            const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(img.originalname)}`;
            await storage.bucket().file(`images/${filename}`).delete().catch(() => {});
          }));
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // Delete old images that were removed
      const existingProduct = snapshot.val();
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        const imagesToDelete = existingProduct.images.filter(
          oldImg => !parsedExistingImages.some(newImg => newImg.filename === oldImg.filename)
        );
        await Promise.all(imagesToDelete.map(async (img) => {
          await storage.bucket().file(img.path).delete().catch(() => {});
        }));
      }

      await productRef.update(updates);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      if (req.files) {
        await Promise.all(req.files.map(async (img) => {
          const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(img.originalname)}`;
          await storage.bucket().file(`images/${filename}`).delete().catch(() => {});
        }));
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const productRef = db.ref(`products/${id}`);

      const snapshot = await productRef.once('value');
      if (!snapshot.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const product = snapshot.val();
      if (product.images && Array.isArray(product.images)) {
        await Promise.all(product.images.map(async (image) => {
          if (image.path) {
            await storage.bucket().file(image.path).delete().catch(() => {});
          }
        }));
      }

      await productRef.remove();

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const productsRef = db.ref('products');

      productsRef.orderByChild('category').equalTo(category).once('value', (snapshot) => {
        const products = snapshot.val();
        res.status(200).json({
          success: true,
          products: products || {},
        });
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getProductsForUsers(req, res) {
    try {
      const productsRef = db.ref('products');
      const cataloguesRef = db.ref('categoryCatalogues');

      const productsSnapshot = await productsRef.once('value');
      const productsData = productsSnapshot.val() || {};

      const cataloguesSnapshot = await cataloguesRef.once('value');
      const cataloguesData = cataloguesSnapshot.val() || {};

      const categories = [
        'Desktops',
        'Laptops',
        'Printers',
        'Projectors',
        'Interactive Panels',
        'Scanners',
        'CCTV Systems',
        'UPS Systems',
        'Accessories',
      ];

      const productCategories = categories.map((category, index) => {
        const categoryProducts = Object.keys(productsData)
          .filter(id => productsData[id].category === category)
          .map(id => ({
            id,
            name: productsData[id].name,
            image: productsData[id].images && productsData[id].images[0]?.url,
            specs: productsData[id].specs?.join(', ') || '',
          }));

        const catalogueEntry = Object.values(cataloguesData).find(cat => cat.category === category);
        const catalogueUrl = catalogueEntry ? catalogueEntry.catalogue?.url : null;

        return {
          id: index + 1,
          name: category,
          catalogue: catalogueUrl,
          items: categoryProducts,
        };
      }).filter(category => category.items.length > 0);

      res.status(200).json({
        success: true,
        productCategories,
      });
    } catch (error) {
      console.error('Error fetching products for users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

module.exports = ProductController;