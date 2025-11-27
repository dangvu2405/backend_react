const mongoose = require('mongoose');
const SanPham = require('../models/SanPham');
const LoaiSanPham = require('../models/LoaiSanPham');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../../constants');

const normalizeVolumeOptions = SanPham.normalizeVolumeOptions;

class SanPhamController {
    async createProduct(req, res) {
        try {
            const { 
                TenSanPham, 
                MaLoaiSanPham, 
                Gia, 
                SoLuong, 
                KhuyenMai, 
                MoTa, 
                HinhAnhChinh, 
                HinhAnhPhu,
                DungTich,
                DungTichOptions
            } = req.body;
            
            // ✅ Kiểm tra các trường bắt buộc
            if (!TenSanPham || !MaLoaiSanPham || Gia === undefined || SoLuong === undefined) {
                return errorResponse(res, 'Thiếu thông tin bắt buộc: TenSanPham, MaLoaiSanPham, Gia, SoLuong', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(MaLoaiSanPham)) {
                return errorResponse(res, 'MaLoaiSanPham không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate giá trị số
            if (typeof Gia !== 'number' || Gia < 0) {
                return errorResponse(res, 'Giá phải là số dương', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (typeof SoLuong !== 'number' || SoLuong < 0 || !Number.isInteger(SoLuong)) {
                return errorResponse(res, 'Số lượng phải là số nguyên dương', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (KhuyenMai !== undefined && (typeof KhuyenMai !== 'number' || KhuyenMai < 0 || KhuyenMai > 100)) {
                return errorResponse(res, 'Khuyến mãi phải là số từ 0-100', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (DungTich !== undefined && (typeof DungTich !== 'number' || DungTich < 0)) {
                return errorResponse(res, 'Dung tích phải là số không âm (đơn vị ml)', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Kiểm tra loại sản phẩm tồn tại
            const category = await LoaiSanPham.findById(MaLoaiSanPham);
            if (!category) {
                return errorResponse(res, 'Loại sản phẩm không tồn tại', HTTP_STATUS.BAD_REQUEST);
            }
            
            const volumeOptions = normalizeVolumeOptions(DungTichOptions, DungTich);

            if (!volumeOptions.length) {
                return errorResponse(res, 'Vui lòng cung cấp ít nhất một dung tích hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Tạo sản phẩm
            const product = await SanPham.create({
                TenSanPham: TenSanPham.trim(),
                MaLoaiSanPham,
                Gia,
                SoLuong,
                KhuyenMai: KhuyenMai || 0,
                MoTa: MoTa || '',
                HinhAnhChinh: HinhAnhChinh || '',
                HinhAnhPhu: Array.isArray(HinhAnhPhu) ? HinhAnhPhu : [],
                DungTich: DungTich ?? null,
                DungTichOptions: volumeOptions
            });
            
            return successResponse(res, product, 'Sản phẩm đã được tạo', HTTP_STATUS.CREATED);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi tạo sản phẩm: ', error);
            }
            
            // ✅ Xử lý lỗi validation của Mongoose
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return errorResponse(res, 'Dữ liệu không hợp lệ: ' + errors.join(', '), HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Xử lý lỗi duplicate key
            if (error.code === 11000) {
                return errorResponse(res, 'Sản phẩm đã tồn tại', HTTP_STATUS.BAD_REQUEST);
            }
            
            return errorResponse(res, 'Lỗi khi tạo sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    
    async getProduct(req, res) {
        try {
            const { id } = req.params;
            
            // ✅ Validate ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            const product = await SanPham.findById(id)
                .populate('MaLoaiSanPham', 'TenLoaiSanPham')
                .lean();
                
            if (!product) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            
            // ✅ Chuẩn hóa response format: dùng successResponse
            return successResponse(res, product, 'Lấy sản phẩm thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy sản phẩm: ', error);
            }
            return errorResponse(res, 'Lỗi khi lấy sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    
    async getAllProducts(req, res) {
        try {
            let { 
                page = PAGINATION.DEFAULT_PAGE, 
                limit = PAGINATION.DEFAULT_LIMIT, 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                category,
                minPrice,
                maxPrice,
                search,
                inStock
            } = req.query;
            
            // ✅ Validate và normalize
            page = Math.max(1, parseInt(page) || 1);
            limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT));
            sortOrder = sortOrder === 'asc' ? 1 : -1;
            
            // ✅ Build filter
            const filter = {};
            if (category && mongoose.Types.ObjectId.isValid(category)) {
                filter.MaLoaiSanPham = category;
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.Gia = {};
                if (minPrice !== undefined) filter.Gia.$gte = parseFloat(minPrice);
                if (maxPrice !== undefined) filter.Gia.$lte = parseFloat(maxPrice);
            }
            if (search) {
                filter.$or = [
                    { TenSanPham: { $regex: search, $options: 'i' } },
                    { MoTa: { $regex: search, $options: 'i' } }
                ];
            }
            if (inStock === 'true') {
                filter.SoLuong = { $gt: 0 };
            }
            
            // ✅ Validate sortBy
            const allowedSortFields = ['createdAt', 'updatedAt', 'Gia', 'TenSanPham', 'DaBan', 'SoLuong'];
            if (!allowedSortFields.includes(sortBy)) {
                sortBy = 'createdAt';
            }
            
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder;
            
            const skip = (page - 1) * limit;
            
            const [products, total] = await Promise.all([
                SanPham.find(filter)
                    .populate('MaLoaiSanPham', 'TenLoaiSanPham')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                SanPham.countDocuments(filter)
            ]);
            
            return paginatedResponse(res, products, page, limit, total);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy danh sách sản phẩm: ', error);
            }
            return errorResponse(res, 'Lỗi khi lấy danh sách sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            
            // ✅ Validate ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Kiểm tra sản phẩm tồn tại
            const existingProduct = await SanPham.findById(id);
            if (!existingProduct) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            
            // ✅ Chỉ cho phép update các field được phép
            const allowedFields = [
                'TenSanPham', 
                'MaLoaiSanPham', 
                'Gia', 
                'KhuyenMai', 
                'MoTa', 
                'SoLuong', 
                'HinhAnhChinh', 
                'HinhAnhPhu',
                'DungTich',
                'DungTichOptions'
            ];
            let hasUpdates = false;
            
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    const value = req.body[field];
                    // ✅ Validate từng field
                    if (field === 'Gia' && (typeof value !== 'number' || value < 0)) {
                        return errorResponse(res, 'Giá phải là số dương', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'SoLuong' && (typeof value !== 'number' || value < 0 || !Number.isInteger(value))) {
                        return errorResponse(res, 'Số lượng phải là số nguyên dương', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'KhuyenMai' && (typeof value !== 'number' || value < 0 || value > 100)) {
                        return errorResponse(res, 'Khuyến mãi phải là số từ 0-100', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'MaLoaiSanPham' && !mongoose.Types.ObjectId.isValid(value)) {
                        return errorResponse(res, 'MaLoaiSanPham không hợp lệ', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'TenSanPham' && (!value || value.trim().length < 2)) {
                        return errorResponse(res, 'Tên sản phẩm phải có ít nhất 2 ký tự', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'DungTich' && (typeof value !== 'number' || value < 0)) {
                        return errorResponse(res, 'Dung tích phải là số không âm (đơn vị ml)', HTTP_STATUS.BAD_REQUEST);
                    }
                    if (field === 'DungTichOptions') {
                        const normalizedOptions = normalizeVolumeOptions(value, req.body.DungTich ?? existingProduct.DungTich);
                        if (!normalizedOptions.length) {
                            return errorResponse(res, 'Vui lòng cung cấp ít nhất một dung tích hợp lệ', HTTP_STATUS.BAD_REQUEST);
                        }
                        existingProduct.DungTichOptions = normalizedOptions;
                        hasUpdates = true;
                        continue;
                    }
                    
                    existingProduct[field] = field === 'TenSanPham' ? value.trim() : value;
                    hasUpdates = true;
                }
            }
            
            if (!hasUpdates) {
                return errorResponse(res, 'Không có dữ liệu để cập nhật', HTTP_STATUS.BAD_REQUEST);
            }
            
            const product = await existingProduct.save();
            await product.populate('MaLoaiSanPham', 'TenLoaiSanPham');
            
            return successResponse(res, product, 'Sản phẩm đã được cập nhật', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi cập nhật sản phẩm: ', error);
            }
            
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return errorResponse(res, 'Dữ liệu không hợp lệ: ' + errors.join(', '), HTTP_STATUS.BAD_REQUEST);
            }
            
            return errorResponse(res, 'Lỗi khi cập nhật sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            
            // ✅ Validate ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Kiểm tra sản phẩm tồn tại
            const product = await SanPham.findById(id);
            if (!product) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            
            // ✅ Kiểm tra sản phẩm có trong đơn hàng chưa hoàn thành không
            const DonHang = require('../models/DonHang');
            const ordersWithProduct = await DonHang.find({
                'SanPham.MaSanPham': id,
                TrangThai: { $nin: ['delivered', 'cancelled'] }
            });
            
            if (ordersWithProduct.length > 0) {
                return errorResponse(
                    res,
                    `Không thể xóa sản phẩm. Sản phẩm đang có trong ${ordersWithProduct.length} đơn hàng chưa hoàn thành.`,
                    HTTP_STATUS.BAD_REQUEST
                );
            }
            
            // ✅ Xóa ảnh trên Cloudinary nếu có
            if (product.HinhAnhChinh) {
                try {
                    const cloudinary = require('cloudinary').v2;
                    // Extract public_id từ URL nếu có
                    const publicId = product.HinhAnhChinh.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`product_images/${publicId}`);
                } catch (cloudinaryError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Lỗi khi xóa ảnh trên Cloudinary:', cloudinaryError);
                    }
                    // Không fail nếu xóa ảnh lỗi, vẫn tiếp tục xóa sản phẩm
                }
            }
            
            // ✅ Xóa sản phẩm
            await product.deleteOne();
            
            return successResponse(res, { id }, 'Sản phẩm đã được xóa', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xóa sản phẩm: ', error);
            }
            return errorResponse(res, 'Lỗi khi xóa sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    
}
module.exports = new SanPhamController();