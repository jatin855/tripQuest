const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isLoggedIn, isApprovedShopOwner } = require('../middleware/auth');
const {
  getExplore,
  getProductDetail,
  getApplyForm,
  postApply,
  getAddProduct,
  postAddProduct,
  postReview
} = require('../controllers/marketplaceController');

// ── Multer config for product images ─────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'marketplace');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'marketplace-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});


// ── Routes ───────────────────────────────────────────────────────────────────

// Explore marketplace
router.get('/',                    isLoggedIn,                             getExplore);

// Product detail
router.get('/product/:id',        isLoggedIn,                             getProductDetail);

// Shop owner application
router.get('/apply',              isLoggedIn,                             getApplyForm);
router.post('/apply',             isLoggedIn,                             postApply);

// Add product (approved shop owners only)
router.get('/add-product',        isLoggedIn, isApprovedShopOwner,        getAddProduct);
router.post('/add-product',       isLoggedIn, isApprovedShopOwner, upload.array('images', 5), postAddProduct);

// Add review
router.post('/product/:id/review', isLoggedIn,                            postReview);


module.exports = router;
