const express = require('express');
const router = express.Router();
const AuthController = require('../controller/AuthController');
const { verifyAdmin } = require('../Middleware/AuthMiddleware');
const EnquiryController = require('../controller/EnquiryController');
const GalleryController = require('../controller/GalleryController');
const { uploadImages, uploadCategoryCatalogue, handleUploadError } = require('../Middleware/MulterMiddleware');
const ProductController = require('../controller/ProductController');

// Auth Routes
router.post('/login', AuthController.loginAdmin);
router.post('/verify', AuthController.verifyToken);
router.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard',
    user: req.user,
  });
});

// Enquiry Routes
router.post('/enquiry', EnquiryController.submitEnquiry);
router.get('/admin/enquiries', verifyAdmin, EnquiryController.getEnquiries);
router.put('/admin/enquiries/:id/status', verifyAdmin, EnquiryController.updateEnquiryStatus);

// Product Routes
router.post('/admin/products/add', 
  verifyAdmin,
  uploadImages,
  handleUploadError,
  ProductController.addProduct
);

// Category Catalogue Routes
router.post('/admin/category-catalogue/upload', 
  verifyAdmin,
  uploadCategoryCatalogue,
  handleUploadError,
  ProductController.uploadCategoryCatalogue
);

router.get('/category-catalogue/:category', 
  ProductController.getCategoryCatalogue
);

router.delete('/admin/category-catalogue/:category', 
  verifyAdmin,
  ProductController.deleteCategoryCatalogue
);

router.get('/admin/products/all', ProductController.getAllProducts);
router.get('/admin/products/:id', ProductController.getProductById);
router.put('/admin/products-edit/:id', 
  verifyAdmin,
  uploadImages,
  handleUploadError,
  ProductController.updateProduct
);
router.delete('/admin/products-del/:id', verifyAdmin, ProductController.deleteProduct);
router.get('/category/:category', ProductController.getProductsByCategory);

router.get('/products', ProductController.getProductsForUsers);





module.exports = router;