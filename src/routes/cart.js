const express = require('express');
const router = express.Router();
const GioHangController = require('../app/controllers/GioHangController');
const DonHangController = require('../app/controllers/DonHangController');
const optionalAuthMiddleware = require('../app/middlewares/optionalAuth.middleware');
const { checkoutLimiter } = require('../app/middlewares/rateLimit.middleware');

// ✅ Sử dụng optionalAuthMiddleware để hỗ trợ cả guest và user
router.post('/add-to-cart', optionalAuthMiddleware, GioHangController.addToCart);
router.get('/get-cart', optionalAuthMiddleware, GioHangController.getCart);
router.post('/update-cart', optionalAuthMiddleware, GioHangController.updateCart);
router.post('/checkout', optionalAuthMiddleware, checkoutLimiter, DonHangController.checkout);
module.exports = router;