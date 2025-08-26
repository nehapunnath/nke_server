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
const { verifyAdmin } = require('../Middleware/AuthMiddleware'); // Destructure verifyAdmin

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

module.exports = router;