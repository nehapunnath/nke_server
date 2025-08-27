// const express = require('express');
// const router = express.Router();
// const AuthController = require('../controller/AuthController');
// const verifyAdmin = require('../Middleware/AuthMiddleware'); 

// // Admin login route
// router.post('/login', AuthController.loginAdmin);

// router.post('/verify', AuthController.verifyToken)

// router.get('/admin/dashboard', verifyAdmin);




// // Add more protected routes as needed
// module.exports = router;

// Routes/Route.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controller/AuthController');
const { verifyAdmin } = require('../Middleware/AuthMiddleware'); 
const EnquiryController=require('../controller/EnquiryController')
const GalleryController=require('../controller/GalleryController')
const upload=require('../Middleware/MulterMiddleware')

// Admin login route
router.post('/login', AuthController.loginAdmin);
router.post('/verify', AuthController.verifyToken);
router.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard',
    user: req.user,
  });
});

router.post('/enquiry', EnquiryController.submitEnquiry); // Public route for users
router.get('/admin/enquiries', verifyAdmin, EnquiryController.getEnquiries); // Protected route for admins
router.put('/admin/enquiries/:id/status', verifyAdmin, EnquiryController.updateEnquiryStatus)

router.post('/admin/gallery',upload.single('image'), verifyAdmin, GalleryController.uploadImage);
router.get('/admin/gallery', verifyAdmin, GalleryController.getImages);
router.delete('/admin/gallery/:id', verifyAdmin, GalleryController.deleteImage);
router.get('/uploads/:filename', GalleryController.serveImage)

module.exports = router;