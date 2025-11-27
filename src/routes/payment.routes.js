const express = require('express');
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const authMiddleware = require('../app/middlewares/auth.middleware');
const adminMiddleware = require('../app/middlewares/admin.middleware');

const paymentController = require('../app/controllers/payment.controller');

router.post('/create', authMiddleware, asyncHandler(paymentController.createPayment));
router.get('/vnpay-callback', asyncHandler(paymentController.vnpayCallback));
router.get('/momo-callback', asyncHandler(paymentController.momoCallback));

router.get('/admin/list', authMiddleware, adminMiddleware, asyncHandler(paymentController.getPaymentsAdmin));
router.put('/admin/update/:orderId', authMiddleware, adminMiddleware, asyncHandler(paymentController.updatePayment));

module.exports = router;
