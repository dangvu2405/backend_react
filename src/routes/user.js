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
// GET /me - Lấy thông tin người dùng sau khi login
router.get('/me', authMiddleware, TaiKhoanController.getMe);

// POST /uploadAvatar - Upload avatar file, xong save vô database
router.post('/uploadAvatar', authMiddleware, upload.single('avatar'), TaiKhoanController.uploadAvatar);

// PUT /me - Update user's profile
router.put('/me', authMiddleware, TaiKhoanController.updateUser);

// GET /orderUser - Tất cả đơn hàng của người dùng
router.get('/orderUser', authMiddleware, DonHangController.getDonHang);

// GET /orderUser/:id - Xem chi tiết đơn hàng của người dùng
router.get('/orderUser/:id', authMiddleware, validateObjectId, DonHangController.getDetailDonHang);

// DELETE /orderUser/:id - Hủy đơn hàng
router.delete('/orderUser/:id', authMiddleware, validateObjectId, validate(cancelOrderSchema, 'body'), DonHangController.cancelDonHang);

// POST /changepassword - Đổi mật khẩu tài khoản
router.post('/changepassword', authMiddleware, TaiKhoanController.changePassword);

// ✅ Sửa typo: addess → address
// GET /address - Lấy địa chỉ người dùng
router.get('/address', authMiddleware, TaiKhoanController.getAddresses);

// POST /address - Thêm địa chỉ
router.post('/address', authMiddleware, TaiKhoanController.createAddress);

// PATCH /address/:id - Cập nhật địa chỉ người dùng
router.patch('/address/:id', authMiddleware, validateObjectId, TaiKhoanController.updateAddress);

// DELETE /address/:id - Xóa địa chỉ của người dùng
router.delete('/address/:id', authMiddleware, validateObjectId, TaiKhoanController.deleteAddress);

// DELETE /me/oauth - Xóa dữ liệu OAuth (Google)
router.delete('/me/oauth', authMiddleware, TaiKhoanController.deleteOAuthData);

// DELETE /me/account - Xóa toàn bộ tài khoản và dữ liệu
router.delete('/me/account', authMiddleware, TaiKhoanController.deleteMyAccount);

// Heart (Favorite) Routes
// GET /hearts - Lấy danh sách sản phẩm yêu thích
router.get('/hearts', authMiddleware, HeartController.getUserHearts);

// GET /hearts/ids - Lấy danh sách product IDs đã yêu thích
router.get('/hearts/ids', authMiddleware, HeartController.getUserHeartProductIds);

// GET /hearts/check/:productId - Kiểm tra đã yêu thích sản phẩm chưa
router.get('/hearts/check/:productId', authMiddleware, validateObjectId, HeartController.checkHeart);

// POST /hearts - Thêm sản phẩm vào yêu thích
router.post('/hearts', authMiddleware, HeartController.addHeart);

// DELETE /hearts/:productId - Xóa sản phẩm khỏi yêu thích
router.delete('/hearts/:productId', authMiddleware, validateObjectId, HeartController.removeHeart);

// POST /hearts/sync - Đồng bộ hearts từ localStorage (khi logout)
router.post('/hearts/sync', authMiddleware, HeartController.syncHearts);

module.exports = router;