const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TaiKhoanController = require('../app/controllers/TaiKhoanController');
const authMiddleware = require('../app/middlewares/auth.middleware');
const upload = require('../app/middlewares/upload.middleware');
const DonHangController = require('../app/controllers/DonHangController');
const HeartController = require('../app/controllers/HeartController');
const validate = require('../validations/validate.middleware');
const { cancelOrderSchema } = require('../validations/order.validation');
const { errorResponse } = require('../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../constants');

// ✅ Middleware để validate ObjectId trong params
const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }
    next();
};

// ✅ Tất cả routes đều cần authMiddleware

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/me', authMiddleware, TaiKhoanController.getMe);

/**
 * @swagger
 * /user/uploadAvatar:
 *   post:
 *     summary: Upload avatar cho người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload avatar thành công
 *       400:
 *         description: File không hợp lệ
 */
router.post('/uploadAvatar', authMiddleware, upload.single('avatar'), TaiKhoanController.uploadAvatar);

/**
 * @swagger
 * /user/me:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hoTen:
 *                 type: string
 *               soDienThoai:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.put('/me', authMiddleware, TaiKhoanController.updateUser);

/**
 * @swagger
 * /user/orderUser:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/orderUser', authMiddleware, DonHangController.getDonHang);

/**
 * @swagger
 * /user/orderUser/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng của người dùng
 *     tags: [User]
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
 *         description: Chi tiết đơn hàng
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/orderUser/:id', authMiddleware, validateObjectId, DonHangController.getDetailDonHang);

/**
 * @swagger
 * /user/orderUser/{id}:
 *   delete:
 *     summary: Yêu cầu hủy đơn hàng
 *     tags: [User]
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
 *               lyDo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yêu cầu hủy đơn hàng thành công
 */
router.delete(
    '/orderUser/:id',
    authMiddleware,
    validateObjectId,
    validate(cancelOrderSchema, 'body'),
    DonHangController.requestCancelDonHang
);

/**
 * @swagger
 * /user/changepassword:
 *   post:
 *     summary: Đổi mật khẩu tài khoản
 *     tags: [User]
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
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng
 */
router.post('/changepassword', authMiddleware, TaiKhoanController.changePassword);

/**
 * @swagger
 * /user/address:
 *   get:
 *     summary: Lấy danh sách địa chỉ của người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 */
router.get('/address', authMiddleware, TaiKhoanController.getAddresses);

/**
 * @swagger
 * /user/address:
 *   post:
 *     summary: Thêm địa chỉ mới
 *     tags: [User]
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
 *               - diaChi
 *             properties:
 *               diaChi:
 *                 type: string
 *               tinhThanh:
 *                 type: string
 *               quanHuyen:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 */
router.post('/address', authMiddleware, TaiKhoanController.createAddress);

/**
 * @swagger
 * /user/address/{id}:
 *   patch:
 *     summary: Cập nhật địa chỉ
 *     tags: [User]
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
 *               diaChi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 */
router.patch('/address/:id', authMiddleware, validateObjectId, TaiKhoanController.updateAddress);

/**
 * @swagger
 * /user/address/{id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [User]
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
 *         description: Xóa địa chỉ thành công
 */
router.delete('/address/:id', authMiddleware, validateObjectId, TaiKhoanController.deleteAddress);

/**
 * @swagger
 * /user/me/oauth:
 *   delete:
 *     summary: Xóa dữ liệu OAuth (Google)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Xóa dữ liệu OAuth thành công
 */
router.delete('/me/oauth', authMiddleware, TaiKhoanController.deleteOAuthData);

/**
 * @swagger
 * /user/me/account:
 *   delete:
 *     summary: Xóa toàn bộ tài khoản và dữ liệu
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 */
router.delete('/me/account', authMiddleware, TaiKhoanController.deleteMyAccount);

/**
 * @swagger
 * /user/hearts:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 */
router.get('/hearts', authMiddleware, HeartController.getUserHearts);

/**
 * @swagger
 * /user/hearts/ids:
 *   get:
 *     summary: Lấy danh sách ID sản phẩm đã yêu thích
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách ID sản phẩm
 */
router.get('/hearts/ids', authMiddleware, HeartController.getUserHeartProductIds);

/**
 * @swagger
 * /user/hearts/check/{productId}:
 *   get:
 *     summary: Kiểm tra đã yêu thích sản phẩm chưa
 *     tags: [User]
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
 *         description: Trạng thái yêu thích
 */
router.get('/hearts/check/:productId', authMiddleware, validateObjectId, HeartController.checkHeart);

/**
 * @swagger
 * /user/hearts:
 *   post:
 *     summary: Thêm sản phẩm vào yêu thích
 *     tags: [User]
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
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm vào yêu thích thành công
 */
router.post('/hearts', authMiddleware, HeartController.addHeart);

/**
 * @swagger
 * /user/hearts/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi yêu thích
 *     tags: [User]
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
 *         description: Xóa khỏi yêu thích thành công
 */
router.delete('/hearts/:productId', authMiddleware, validateObjectId, HeartController.removeHeart);

/**
 * @swagger
 * /user/hearts/sync:
 *   post:
 *     summary: Đồng bộ sản phẩm yêu thích từ localStorage
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 */
router.post('/hearts/sync', authMiddleware, HeartController.syncHearts);

module.exports = router;