const express = require('express');
const router = express.Router();
const GioHangController = require('../app/controllers/GioHangController');
const DonHangController = require('../app/controllers/DonHangController');
const optionalAuthMiddleware = require('../app/middlewares/optionalAuth.middleware');
const { checkoutLimiter } = require('../app/middlewares/rateLimit.middleware');

// ✅ Sử dụng optionalAuthMiddleware để hỗ trợ cả guest và user

/**
 * @swagger
 * /cart/add-to-cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               selectedDungTich:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
 */
router.post('/add-to-cart', optionalAuthMiddleware, GioHangController.addToCart);

/**
 * @swagger
 * /cart/get-cart:
 *   get:
 *     summary: Lấy thông tin giỏ hàng
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 */
router.get('/get-cart', optionalAuthMiddleware, GioHangController.getCart);

/**
 * @swagger
 * /cart/update-cart:
 *   post:
 *     summary: Cập nhật giỏ hàng
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cập nhật giỏ hàng thành công
 */
router.post('/update-cart', optionalAuthMiddleware, GioHangController.updateCart);

/**
 * @swagger
 * /cart/checkout:
 *   post:
 *     summary: Thanh toán đơn hàng
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diaChiGiaoHang
 *             properties:
 *               diaChiGiaoHang:
 *                 type: string
 *               ghiChu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/checkout', optionalAuthMiddleware, checkoutLimiter, DonHangController.checkout);
module.exports = router;