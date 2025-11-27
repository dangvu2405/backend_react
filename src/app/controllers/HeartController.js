const Heart = require('../models/Heart');
const SanPham = require('../models/SanPham');
const { successResponse, errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../constants');

/**
 * Thêm sản phẩm vào danh sách yêu thích
 * POST /api/hearts
 */
const addHeart = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.body;

        if (!userId) {
            return errorResponse(res, 'Bạn cần đăng nhập để thêm vào yêu thích', HTTP_STATUS.UNAUTHORIZED);
        }

        if (!productId) {
            return errorResponse(res, 'Mã sản phẩm là bắt buộc', HTTP_STATUS.BAD_REQUEST);
        }

        // Kiểm tra sản phẩm có tồn tại không
        const product = await SanPham.findById(productId);
        if (!product) {
            return errorResponse(res, 'Sản phẩm không tồn tại', HTTP_STATUS.NOT_FOUND);
        }

        // Kiểm tra đã yêu thích chưa
        const existingHeart = await Heart.findOne({
            MaKhachHang: userId,
            MaSanPham: productId
        });

        if (existingHeart) {
            return successResponse(res, { heart: existingHeart }, 'Sản phẩm đã có trong danh sách yêu thích', HTTP_STATUS.OK);
        }

        // Tạo heart mới
        const heart = await Heart.create({
            MaKhachHang: userId,
            MaSanPham: productId
        });

        await heart.populate('MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh DungTich DungTichOptions');

        return successResponse(res, { heart }, 'Đã thêm vào danh sách yêu thích', HTTP_STATUS.CREATED);
    } catch (error) {
        console.error('Lỗi khi thêm vào yêu thích:', error);
        return errorResponse(res, 'Lỗi khi thêm vào yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Xóa sản phẩm khỏi danh sách yêu thích
 * DELETE /api/hearts/:productId
 */
const removeHeart = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.params;

        if (!userId) {
            return errorResponse(res, 'Bạn cần đăng nhập để xóa khỏi yêu thích', HTTP_STATUS.UNAUTHORIZED);
        }

        if (!productId) {
            return errorResponse(res, 'Mã sản phẩm là bắt buộc', HTTP_STATUS.BAD_REQUEST);
        }

        const heart = await Heart.findOneAndDelete({
            MaKhachHang: userId,
            MaSanPham: productId
        });

        if (!heart) {
            return errorResponse(res, 'Sản phẩm không có trong danh sách yêu thích', HTTP_STATUS.NOT_FOUND);
        }

        return successResponse(res, null, 'Đã xóa khỏi danh sách yêu thích', HTTP_STATUS.OK);
    } catch (error) {
        console.error('Lỗi khi xóa khỏi yêu thích:', error);
        return errorResponse(res, 'Lỗi khi xóa khỏi yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Lấy danh sách sản phẩm yêu thích của user
 * GET /api/hearts
 */
const getUserHearts = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return errorResponse(res, 'Bạn cần đăng nhập để xem danh sách yêu thích', HTTP_STATUS.UNAUTHORIZED);
        }

        const hearts = await Heart.getUserHearts(userId);

        return successResponse(res, { hearts }, 'Lấy danh sách yêu thích thành công', HTTP_STATUS.OK);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu thích:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Lấy danh sách product IDs mà user đã yêu thích
 * GET /api/hearts/ids
 */
const getUserHeartProductIds = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return successResponse(res, { productIds: [] }, 'Chưa đăng nhập', HTTP_STATUS.OK);
        }

        const productIds = await Heart.getUserHeartProductIds(userId);

        return successResponse(res, { productIds }, 'Lấy danh sách ID sản phẩm yêu thích thành công', HTTP_STATUS.OK);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ID yêu thích:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách ID yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Đồng bộ hearts từ localStorage (khi logout)
 * POST /api/hearts/sync
 */
const syncHearts = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productIds } = req.body;

        if (!userId) {
            return errorResponse(res, 'Bạn cần đăng nhập để đồng bộ yêu thích', HTTP_STATUS.UNAUTHORIZED);
        }

        if (!Array.isArray(productIds)) {
            return errorResponse(res, 'Danh sách sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
        }

        // Lấy danh sách hearts hiện tại của user
        const existingHearts = await Heart.find({ MaKhachHang: userId });
        const existingProductIds = existingHearts.map(h => h.MaSanPham.toString());

        // Tìm các sản phẩm cần thêm (có trong productIds nhưng chưa có trong database)
        const productIdsToAdd = productIds.filter(
            id => !existingProductIds.includes(id.toString())
        );

        // Tìm các sản phẩm cần xóa (có trong database nhưng không có trong productIds)
        const productIdsToRemove = existingProductIds.filter(
            id => !productIds.includes(id.toString())
        );

        // Thêm các hearts mới
        if (productIdsToAdd.length > 0) {
            const newHearts = productIdsToAdd.map(productId => ({
                MaKhachHang: userId,
                MaSanPham: productId
            }));
            await Heart.insertMany(newHearts);
        }

        // Xóa các hearts không còn trong localStorage
        if (productIdsToRemove.length > 0) {
            await Heart.deleteMany({
                MaKhachHang: userId,
                MaSanPham: { $in: productIdsToRemove }
            });
        }

        // Lấy lại danh sách hearts sau khi sync
        const hearts = await Heart.getUserHearts(userId);

        return successResponse(
            res,
            { hearts },
            `Đã đồng bộ ${productIdsToAdd.length} sản phẩm mới, xóa ${productIdsToRemove.length} sản phẩm`,
            HTTP_STATUS.OK
        );
    } catch (error) {
        console.error('Lỗi khi đồng bộ yêu thích:', error);
        return errorResponse(res, 'Lỗi khi đồng bộ yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

/**
 * Kiểm tra user đã yêu thích sản phẩm chưa
 * GET /api/hearts/check/:productId
 */
const checkHeart = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.params;

        if (!userId) {
            return successResponse(res, { isHeart: false }, 'Chưa đăng nhập', HTTP_STATUS.OK);
        }

        const isHeart = await Heart.isHeartExists(userId, productId);

        return successResponse(res, { isHeart }, 'Kiểm tra yêu thích thành công', HTTP_STATUS.OK);
    } catch (error) {
        console.error('Lỗi khi kiểm tra yêu thích:', error);
        return errorResponse(res, 'Lỗi khi kiểm tra yêu thích', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

module.exports = {
    addHeart,
    removeHeart,
    getUserHearts,
    getUserHeartProductIds,
    syncHearts,
    checkHeart
};

