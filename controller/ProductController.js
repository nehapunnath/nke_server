const { Product, CategoryCatalogue } = require('../Model/ProductModel');
const { db } = require('../firebaseAdmin');
const fs = require('fs');
const path = require('path');

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
        images: imageFiles.map(img => ({
          filename: img.filename,
          originalName: img.originalname,
          path: `/Uploads/images/${img.filename}`,
          url: `${process.env.BASE_URL || 'http://localhost:5000'}/Uploads/images/${img.filename}`
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const product = new Product(productData);
      const validationErrors = product.validate();
      if (validationErrors.length > 0) {
        imageFiles.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
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
        product: product.toJSON()
      });
    } catch (error) {
      console.error('Error adding product:', error);
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async uploadCategoryCatalogue(req, res) {
    try {
      const { category } = req.body;
      const catalogueFile = req.file || null;

      if (!category) {
        if (catalogueFile && fs.existsSync(catalogueFile.path)) {
          fs.unlinkSync(catalogueFile.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }

      if (!catalogueFile) {
        return res.status(400).json({
          success: false,
          message: 'Catalogue file is required'
        });
      }

      const catalogueData = {
        category,
        catalogue: {
          filename: catalogueFile.filename,
          originalName: catalogueFile.originalname,
          path: `/Uploads/catalogues/${catalogueFile.filename}`,
          url: `${process.env.BASE_URL || 'http://localhost:5000'}/Uploads/catalogues/${catalogueFile.filename}`
        }
      };

      const categoryCatalogue = new CategoryCatalogue(catalogueData);
      const validationErrors = categoryCatalogue.validate();
      if (validationErrors.length > 0) {
        if (catalogueFile && fs.existsSync(catalogueFile.path)) {
          fs.unlinkSync(catalogueFile.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      const cataloguesRef = db.ref('categoryCatalogues');
      const snapshot = await cataloguesRef.orderByChild('category').equalTo(category).once('value');
      const existingCatalogues = snapshot.val();

      if (existingCatalogues) {
        const existingCatalogue = Object.values(existingCatalogues)[0];
        if (existingCatalogue.catalogue && existingCatalogue.catalogue.path) {
          const fullPath = path.join(__dirname, '..', existingCatalogue.catalogue.path);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
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
        catalogue: categoryCatalogue.toJSON()
      });
    } catch (error) {
      console.error('Error uploading category catalogue:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
            message: 'Catalogue not found for this category'
          });
        }
        res.status(200).json({
          success: true,
          catalogue: Object.values(catalogue)[0]
        });
      });
    } catch (error) {
      console.error('Error fetching category catalogue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
          message: 'Catalogue not found for this category'
        });
      }

      const catalogueKey = Object.keys(catalogue)[0];
      const catalogueData = Object.values(catalogue)[0];

      if (catalogueData.catalogue && catalogueData.catalogue.path) {
        const fullPath = path.join(__dirname, '..', catalogueData.catalogue.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      await cataloguesRef.child(catalogueKey).remove();

      res.status(200).json({
        success: true,
        message: 'Category catalogue deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category catalogue:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
          products: products || {}
        });
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
            message: 'Product not found'
          });
        }
        res.status(200).json({
          success: true,
          product: product
        });
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const imageFiles = req.files || [];
      const { name, brand, category, price, modelNo, warranty, stockStatus, description, specs, existingImages } = req.body;

      console.log('req.body:', req.body);
      console.log('req.files:', req.files);

      const productRef = db.ref(`products/${id}`);
      const snapshot = await productRef.once('value');
      if (!snapshot.exists()) {
        if (imageFiles) {
          imageFiles.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
        return res.status(404).json({
          success: false,
          message: 'Product not found'
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

      const newImages = imageFiles.map(img => ({
        filename: img.filename,
        originalName: img.originalname,
        path: `/Uploads/images/${img.filename}`,
        url: `${process.env.BASE_URL || 'http://localhost:5000'}/Uploads/images/${img.filename}`
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
        updatedAt: new Date().toISOString()
      };

      const product = new Product(updates);
      const validationErrors = product.validate();
      if (validationErrors.length > 0) {
        if (imageFiles) {
          imageFiles.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Delete old images that were removed
      const existingProduct = snapshot.val();
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        const imagesToDelete = existingProduct.images.filter(
          oldImg => !parsedExistingImages.some(newImg => newImg.filename === oldImg.filename)
        );
        imagesToDelete.forEach(img => {
          const fullPath = path.join(__dirname, '..', img.path);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }

      await productRef.update(updates);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Error updating product:', error);
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
          message: 'Product not found'
        });
      }
      
      const product = snapshot.val();
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(image => {
          if (image.path) {
            const fullPath = path.join(__dirname, '..', image.path);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        });
      }
      
      await productRef.remove();
      
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
          products: products || {}
        });
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  

  static async getProductsForUsers(req, res) {
    try {
      const productsRef = db.ref('products');
      const cataloguesRef = db.ref('categoryCatalogues');

      // Fetch all products
      const productsSnapshot = await productsRef.once('value');
      const productsData = productsSnapshot.val() || {};

      // Fetch all category catalogues
      const cataloguesSnapshot = await cataloguesRef.once('value');
      const cataloguesData = cataloguesSnapshot.val() || {};

      // Define categories (matching frontend)
      const categories = [
        'Desktops',
        'Laptops',
        'Printers',
        'Projectors',
        'Interactive Panels',
        'Scanners',
        'CCTV Systems',
        'UPS Systems',
        'Accessories'
      ];

      // Group products by category
      const productCategories = categories.map((category, index) => {
        const categoryProducts = Object.keys(productsData)
          .filter(id => productsData[id].category === category)
          .map(id => ({
            id,
            name: productsData[id].name,
            image: productsData[id].images && productsData[id].images[0]?.url,
            specs: productsData[id].specs?.join(', ') || ''
          }));

        // Find catalogue for this category
        const catalogueEntry = Object.values(cataloguesData).find(cat => cat.category === category);
        const catalogueUrl = catalogueEntry ? catalogueEntry.catalogue?.url : null;

        return {
          id: index + 1,
          name: category,
          catalogue: catalogueUrl,
          items: categoryProducts
        };
      }).filter(category => category.items.length > 0);

      res.status(200).json({
        success: true,
        productCategories
      });
    } catch (error) {
      console.error('Error fetching products for users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

}

module.exports = ProductController;