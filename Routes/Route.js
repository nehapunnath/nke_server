const express = require('express');
const router = express.Router();
const AuthController = require('../controller/AuthController');
const { verifyAdmin } = require('../Middleware/AuthMiddleware');
const EnquiryController = require('../controller/EnquiryController');
const GalleryController = require('../controller/GalleryController');
const { uploadImages, uploadCategoryCatalogue, handleUploadError } = require('../Middleware/MulterMiddleware');
const ProductController = require('../controller/ProductController');
const clientsController = require('../controller/ClientsController');
const partnersController=require('../controller/PartnersController')

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

router.post('/admin/gallery', 
  verifyAdmin,
  uploadImages,
  handleUploadError,
  GalleryController.addImages
);

router.get('/admin/gallery', 
  
  GalleryController.getImages
);

router.put('/admin/gallery/:id', 
  verifyAdmin,
  uploadImages,
  handleUploadError,
  GalleryController.updateImage
);

router.delete('/admin/gallery/:id', 
  verifyAdmin,
  GalleryController.deleteImage
);
router.post('/admin/clients', uploadImages, handleUploadError, clientsController.addClients);
router.get('/admin/clients',  clientsController.getClients);
router.delete('/admin/clients/:id',  clientsController.deleteClient);
router.post('/admin/partners',  uploadImages, handleUploadError, partnersController.addPartners);
router.get('/admin/partners',  partnersController.getPartners);
router.delete('/admin/partners/:id',  partnersController.deletePartner);
router.get('/partners',  partnersController.getPartners);


module.exports = router;
