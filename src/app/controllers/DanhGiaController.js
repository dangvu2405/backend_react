const DanhGia = require('../models/DanhGia');
const SanPham = require('../models/SanPham');
const mongoose = require('mongoose');
const { HTTP_STATUS, MESSAGES } = require('../../constants');
const { successResponse, errorResponse } = require('../../utils/response');

class DanhGiaController {
    /**
     * Helper: Lấy user ID từ request
     */
    getUserId(req) {
        // ✅ Hỗ trợ nhiều format: req.user.id, req.user._id (ObjectId hoặc string)
        if (req.user?._id) {
            return typeof req.user._id === 'object' && req.user._id.toString 
                ? req.user._id.toString() 
                : req.user._id;
        }
        if (req.user?.id) {
            return typeof req.user.id === 'object' && req.user.id.toString 
                ? req.user.id.toString() 
                : req.user.id;
        }
        return null;
    }

    /**
     * Helper: Validate rating
     */
    validateRating(rating) {
        const numRating = parseInt(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
            return { valid: false, error: 'Số sao phải là số nguyên từ 1 đến 5' };
        }
        return { valid: true, value: numRating };
    }

    /**
     * Tạo đánh giá mới
     * POST /api/reviews
     */
    createReview = async (req, res) => {
        try {
            const { IdSanPham, NoiDung, SoSao } = req.body;
            const IdKhachHang = this.getUserId(req);

            // ✅ Validate input
            if (!IdSanPham || !NoiDung || SoSao === undefined) {
                return errorResponse(res, 'Vui lòng nhập đầy đủ thông tin đánh giá', HTTP_STATUS.BAD_REQUEST);
            }

            if (!IdKhachHang) {
                return errorResponse(res, 'Vui lòng đăng nhập để đánh giá', HTTP_STATUS.UNAUTHORIZED);
            }

            // ✅ Validate SoSao
            const ratingValidation = this.validateRating(SoSao);
            if (!ratingValidation.valid) {
                return errorResponse(res, ratingValidation.error, HTTP_STATUS.BAD_REQUEST);
            }
            const rating = ratingValidation.value;

            // ✅ Validate IdSanPham
            if (!mongoose.Types.ObjectId.isValid(IdSanPham)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Kiểm tra sản phẩm tồn tại
            const product = await SanPham.findById(IdSanPham);
            if (!product) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // ✅ Kiểm tra đã đánh giá chưa
            const existingReview = await DanhGia.findOne({
                IdSanPham,
                IdKhachHang
            });

            if (existingReview) {
                return errorResponse(res, 'Bạn đã đánh giá sản phẩm này rồi. Vui lòng cập nhật đánh giá hiện tại.', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Tạo đánh giá
            const review = await DanhGia.create({
                IdSanPham,
                IdKhachHang,
                NoiDung: NoiDung.trim(),
                SoSao: rating
            });

            await review.populate('IdKhachHang', 'HoTen AvatarUrl');

            return successResponse(res, review, 'Đánh giá thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return errorResponse(res, 'Dữ liệu không hợp lệ: ' + errors.join(', '), HTTP_STATUS.BAD_REQUEST);
            }

            return errorResponse(res, 'Lỗi khi tạo đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };

    /**
     * Lấy danh sách đánh giá của sản phẩm
     * GET /api/reviews/product/:productId
     */
    async getProductReviews(req, res) {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const [reviews, total] = await Promise.all([
                DanhGia.find({ IdSanPham: productId })
                    .populate('IdKhachHang', 'HoTen AvatarUrl Email')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                DanhGia.countDocuments({ IdSanPham: productId })
            ]);

            return successResponse(res, {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }, 'Lấy danh sách đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy thống kê rating của sản phẩm
     * GET /api/reviews/product/:productId/stats
     */
    async getProductRatingStats(req, res) {
        try {
            const { productId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const stats = await DanhGia.getProductRatingStats(productId);

            return successResponse(res, stats, 'Lấy thống kê đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy đánh giá của user hiện tại cho sản phẩm
     * GET /api/reviews/product/:productId/my-review
     */
    getMyReview = async (req, res) => {
        try {
            const { productId } = req.params;
            const IdKhachHang = this.getUserId(req);

            if (!IdKhachHang) {
                return errorResponse(res, 'Vui lòng đăng nhập', HTTP_STATUS.UNAUTHORIZED);
            }

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Convert IdKhachHang sang ObjectId để query đúng
            const userIdObjectId = mongoose.Types.ObjectId.isValid(IdKhachHang) 
                ? new mongoose.Types.ObjectId(IdKhachHang) 
                : IdKhachHang;

            const review = await DanhGia.findOne({
                IdSanPham: new mongoose.Types.ObjectId(productId),
                IdKhachHang: userIdObjectId
            }).populate('IdKhachHang', 'HoTen AvatarUrl Email');

            if (!review) {
                // ✅ Trả về 404 với message rõ ràng - đây là trường hợp bình thường (user chưa đánh giá)
                // Frontend nên handle 404 này như một trường hợp hợp lệ
                return errorResponse(res, 'Bạn chưa đánh giá sản phẩm này', HTTP_STATUS.NOT_FOUND);
            }

            return successResponse(res, review, 'Lấy đánh giá thành công');
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in getMyReview:', error);
                console.error('ProductId:', req.params.productId);
                console.error('UserId:', this.getUserId(req));
            }
            return errorResponse(res, 'Lỗi khi lấy đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };

    /**
     * Cập nhật đánh giá
     * PUT /api/reviews/:id
     */
    updateReview = async (req, res) => {
        try {
            const { id } = req.params;
            const { NoiDung, SoSao } = req.body;
            const IdKhachHang = this.getUserId(req);

            if (!IdKhachHang) {
                return errorResponse(res, 'Vui lòng đăng nhập', HTTP_STATUS.UNAUTHORIZED);
            }

            // ✅ Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID đánh giá không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const review = await DanhGia.findById(id);

            if (!review) {
                return errorResponse(res, 'Không tìm thấy đánh giá', HTTP_STATUS.NOT_FOUND);
            }

            // Kiểm tra quyền sở hữu
            if (review.IdKhachHang.toString() !== IdKhachHang) {
                return errorResponse(res, 'Bạn không có quyền chỉnh sửa đánh giá này', HTTP_STATUS.FORBIDDEN);
            }

            // ✅ Validate và update
            if (NoiDung !== undefined) {
                const trimmedContent = NoiDung.trim();
                if (trimmedContent.length < 10) {
                    return errorResponse(res, 'Nội dung đánh giá phải có ít nhất 10 ký tự', HTTP_STATUS.BAD_REQUEST);
                }
                if (trimmedContent.length > 1000) {
                    return errorResponse(res, 'Nội dung đánh giá không được quá 1000 ký tự', HTTP_STATUS.BAD_REQUEST);
                }
                review.NoiDung = trimmedContent;
            }

            if (SoSao !== undefined) {
                const ratingValidation = this.validateRating(SoSao);
                if (!ratingValidation.valid) {
                    return errorResponse(res, ratingValidation.error, HTTP_STATUS.BAD_REQUEST);
                }
                review.SoSao = ratingValidation.value;
            }

            // ✅ Save với runValidators
            await review.save({ runValidators: true });
            await review.populate('IdKhachHang', 'HoTen AvatarUrl Email');

            return successResponse(res, review, 'Cập nhật đánh giá thành công');
        } catch (error) {
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return errorResponse(res, 'Dữ liệu không hợp lệ: ' + errors.join(', '), HTTP_STATUS.BAD_REQUEST);
            }
            return errorResponse(res, 'Lỗi khi cập nhật đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };

    /**
     * Xóa đánh giá
     * DELETE /api/reviews/:id
     */
    deleteReview = async (req, res) => {
        try {
            const { id } = req.params;
            const IdKhachHang = this.getUserId(req);

            if (!IdKhachHang) {
                return errorResponse(res, 'Vui lòng đăng nhập', HTTP_STATUS.UNAUTHORIZED);
            }

            // ✅ Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID đánh giá không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const review = await DanhGia.findById(id);

            if (!review) {
                return errorResponse(res, 'Không tìm thấy đánh giá', HTTP_STATUS.NOT_FOUND);
            }

            // Kiểm tra quyền sở hữu
            if (review.IdKhachHang.toString() !== IdKhachHang) {
                return errorResponse(res, 'Bạn không có quyền xóa đánh giá này', HTTP_STATUS.FORBIDDEN);
            }

            await review.deleteOne();

            return successResponse(res, null, 'Xóa đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };

    /**
     * Lấy đánh giá của user
     * GET /api/reviews/my-reviews
     */
    getMyReviews = async (req, res) => {
        try {
            const IdKhachHang = this.getUserId(req);
            const { page = 1, limit = 10 } = req.query;

            if (!IdKhachHang) {
                return errorResponse(res, 'Vui lòng đăng nhập', HTTP_STATUS.UNAUTHORIZED);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [reviews, total] = await Promise.all([
                DanhGia.find({ IdKhachHang })
                    .populate('IdSanPham', 'TenSanPham HinhAnhChinh Gia')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                DanhGia.countDocuments({ IdKhachHang })
            ]);

            return successResponse(res, {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }, 'Lấy danh sách đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách đánh giá: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };
}

module.exports = new DanhGiaController();

