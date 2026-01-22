const express = require('express');
const router = express.Router();
const WalletController = require('../app/controllers/WalletController');
const authMiddleware = require('../app/middlewares/auth.middleware');
const { DepositRequest, PayRequest } = require('../app/requests');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       properties:
 *         balance:
 *           type: number
 *           description: Số dư ví
 *         status:
 *           type: string
 *           enum: [active, frozen, suspended]
 *         walletId:
 *           type: string
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [deposit, withdraw, refund, adjustment]
 *         amount:
 *           type: number
 *         balanceBefore:
 *           type: number
 *         balanceAfter:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         orderId:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Lấy số dư ví của user hiện tại
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *                 message:
 *                   type: string
 */
router.get('/', authMiddleware, WalletController.getBalance);

/**
 * @swagger
 * /api/wallet/deposit:
 *   post:
 *     summary: Nạp tiền vào ví
 *     tags: [Wallet]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10000
 *                 maximum: 100000000
 *                 description: Số tiền nạp (VNĐ)
 *               paymentMethod:
 *                 type: string
 *                 enum: [vnpay, momo, bank, cash]
 *                 default: vnpay
 *               transactionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nạp tiền thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/deposit', authMiddleware, DepositRequest.handle(), WalletController.deposit);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Lấy lịch sử giao dịch
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdraw, refund, adjustment]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 */
router.get('/transactions', authMiddleware, WalletController.getTransactions);

/**
 * @swagger
 * /api/wallet/pay:
 *   post:
 *     summary: Thanh toán đơn hàng bằng số dư ví
 *     tags: [Wallet]
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
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *       400:
 *         description: Số dư không đủ hoặc dữ liệu không hợp lệ
 */
router.post('/pay', authMiddleware, PayRequest.handle(), WalletController.pay);

/**
 * @swagger
 * /api/wallet/statistics:
 *   get:
 *     summary: Lấy thống kê giao dịch
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thống kê giao dịch
 */
router.get('/statistics', authMiddleware, WalletController.getStatistics);

module.exports = router;
