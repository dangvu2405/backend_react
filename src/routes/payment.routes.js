const express = require('express');
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const authMiddleware = require('../app/middlewares/auth.middleware');
const adminMiddleware = require('../app/middlewares/admin.middleware');

const paymentController = require('../app/controllers/payment.controller');

/**
 * @swagger
 * /payment/create:
 *   post:
 *     summary: Tạo thanh toán
 *     tags: [Payment]
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
 *               - orderId
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [vnpay, momo]
 *     responses:
 *       200:
 *         description: Tạo thanh toán thành công
 */
router.post('/create', authMiddleware, asyncHandler(paymentController.createPayment));

/**
 * @swagger
 * /payment/vnpay-callback:
 *   get:
 *     summary: Callback từ VNPay sau khi thanh toán
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xử lý callback thành công
 */
router.get('/vnpay-callback', asyncHandler(paymentController.vnpayCallback));

/**
 * @swagger
 * /payment/momo-callback:
 *   get:
 *     summary: Callback từ MoMo sau khi thanh toán
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: resultCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xử lý callback thành công
 */
router.get('/momo-callback', asyncHandler(paymentController.momoCallback));

/**
 * @swagger
 * /payment/admin/list:
 *   get:
 *     summary: Lấy danh sách thanh toán (Admin only)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thanh toán
 */
router.get('/admin/list', authMiddleware, adminMiddleware, asyncHandler(paymentController.getPaymentsAdmin));

/**
 * @swagger
 * /payment/admin/update/{orderId}:
 *   put:
 *     summary: Cập nhật trạng thái thanh toán (Admin only)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/admin/update/:orderId', authMiddleware, adminMiddleware, asyncHandler(paymentController.updatePayment));

module.exports = router;
