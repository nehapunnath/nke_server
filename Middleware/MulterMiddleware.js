// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure upload directories exist
// const createUploadDirs = () => {
//   const directories = [
//     path.join(__dirname, '../uploads/images'),
//     path.join(__dirname, '../uploads/catalogues')
//   ];
  
//   directories.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//   });
// };

// createUploadDirs();

// // Configure storage for images
// const imageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../uploads/images'));
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // Configure storage for catalogues
// const catalogueStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../uploads/catalogues'));
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'catalogue-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter for images
// const imageFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// // File filter for catalogues
// const catalogueFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only PDF files are allowed for catalogues!'), false);
//   }
// };

// // Create upload instances
// const uploadImages = multer({ 
//   storage: imageStorage, 
//   fileFilter: imageFilter,
//   limits: { 
//     fileSize: 5 * 1024 * 1024 // 5MB limit per image
//   }
// }).array('images', 10);

// const uploadCategoryCatalogue = multer({ 
//   storage: catalogueStorage, 
//   fileFilter: catalogueFilter,
//   limits: { 
//     fileSize: 10 * 1024 * 1024 // 10MB limit for catalogue
//   }
// }).single('categoryCatalogue');

// // Middleware to handle upload errors
// const handleUploadError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Please check the size limits.'
//       });
//     }
//     if (error.code === 'LIMIT_UNEXPECTED_FILE') {
//       return res.status(400).json({
//         success: false,
//         message: 'Unexpected file field. Please check your file inputs.'
//       });
//     }
//     if (error.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({
//         success: false,
//         message: 'Too many files uploaded. Maximum is 10 images.'
//       });
//     }
//   }
  
//   if (error.message.includes('Only image files')) {
//     return res.status(400).json({
//       success: false,
//       message: 'Only image files are allowed for product images.'
//     });
//   }
  
//   if (error.message.includes('Only PDF files')) {
//     return res.status(400).json({
//       success: false,
//       message: 'Only PDF files are allowed for catalogues.'
//     });
//   }
  
//   next(error);
// };

// module.exports = { 
//   uploadImages, 
//   uploadCategoryCatalogue, 
//   handleUploadError 
// };

const multer = require('multer');

// Configure storage to use memory instead of disk
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter for catalogues
const catalogueFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for catalogues!'), false);
  }
};

// Create upload instances
const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
}).array('images', 10);

const uploadCategoryCatalogue = multer({
  storage,
  fileFilter: catalogueFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for catalogue
  },
}).single('categoryCatalogue');

// Middleware to handle upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please check the size limits.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please check your file inputs.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum is 10 images.',
      });
    }
  }

  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed for product images.',
    });
  }

  if (error.message.includes('Only PDF files')) {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed for catalogues.',
    });
  }

  next(error);
};

module.exports = {
  uploadImages,
  uploadCategoryCatalogue,
  handleUploadError,
};