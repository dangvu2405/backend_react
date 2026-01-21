const express = require('express');
const router = express.Router();
const DanhGiaController = require('../app/controllers/DanhGiaController');
const authMiddleware = require('../app/middlewares/auth.middleware');
const { reviewLimiter } = require('../app/middlewares/rateLimit.middleware');

// ============================================
// PUBLIC ROUTES (không cần đăng nhập)
// ============================================

/**
 * @swagger
 * /api/reviews/product/{productId}/stats:
 *   get:
 *     summary: Lấy thống kê đánh giá của sản phẩm
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê đánh giá
 */
router.get('/product/:productId/stats', DanhGiaController.getProductRatingStats);

// ============================================
// PROTECTED ROUTES (cần đăng nhập)
// ============================================

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Tạo đánh giá mới
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *               - comment
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', authMiddleware, reviewLimiter, DanhGiaController.createReview);

/**
 * @swagger
 * /api/reviews/product/{productId}/my-review:
 *   get:
 *     summary: Lấy đánh giá của user cho sản phẩm
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đánh giá của user
 */
router.get('/product/:productId/my-review', authMiddleware, DanhGiaController.getMyReview);

// ============================================
// PUBLIC ROUTES (tiếp tục)
// ============================================

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Lấy danh sách đánh giá của sản phẩm
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
router.get('/product/:productId', DanhGiaController.getProductReviews);

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Lấy tất cả đánh giá của user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đánh giá của user
 */
router.get('/my-reviews', authMiddleware, DanhGiaController.getMyReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật đánh giá thành công
 */
router.put('/:id', authMiddleware, reviewLimiter, DanhGiaController.updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Xóa đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa đánh giá thành công
 */
router.delete('/:id', authMiddleware, DanhGiaController.deleteReview);

module.exports = router;

