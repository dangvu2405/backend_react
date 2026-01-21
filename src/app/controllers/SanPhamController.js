const mongoose = require('mongoose');
const SanPham = require('../models/SanPham');
const LoaiSanPham = require('../models/LoaiSanPham');
const { successResponse, errorResponse, paginatedResponse, businessErrorResponse } = require('../../utils/response');
const { transformProduct } = require('../../utils/output.transformer');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../../constants');

const normalizeVolumeOptions = SanPham.normalizeVolumeOptions;

class SanPhamController {
    async createProduct(req, res) {
        try {
            // Dữ liệu đã được validate bởi StoreProductRequest
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
            } = req.validated;
            
            // Kiểm tra loại sản phẩm tồn tại
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
            
            const product = await SanPham.findOne({ 
                _id: id,
                TrangThai: { $ne: 'deleted' } // Không lấy sản phẩm đã xóa
            })
                .populate('MaLoaiSanPham', 'TenLoaiSanPham')
                .lean();
                
            if (!product) {
                return businessErrorResponse(res, 'PRODUCT_NOT_FOUND');
            }
            
            // ✅ Chuẩn hóa response format: transform product để loại bỏ field nhạy cảm
            return successResponse(res, product, 'Lấy sản phẩm thành công', HTTP_STATUS.OK, { transformType: 'product' });
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
            
            // ✅ Chỉ lấy sản phẩm active (không lấy deleted)
            filter.TrangThai = { $ne: 'deleted' };
            
            const [products, total] = await Promise.all([
                SanPham.find(filter)
                    .populate('MaLoaiSanPham', 'TenLoaiSanPham')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                SanPham.countDocuments(filter)
            ]);
            
            return paginatedResponse(res, products, page, limit, total, { transformType: 'product' });
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
            
            // Validate ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Kiểm tra sản phẩm tồn tại và chưa bị xóa
            const existingProduct = await SanPham.findOne({ 
                _id: id,
                TrangThai: { $ne: 'deleted' }
            });
            if (!existingProduct) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            
            // Dữ liệu đã được validate bởi UpdateProductRequest
            const updateData = req.validated;
            
            // Cập nhật các field
            for (const [field, value] of Object.entries(updateData)) {
                if (field === 'TenSanPham') {
                    existingProduct[field] = value.trim();
                } else if (field === 'DungTichOptions') {
                    const normalizedOptions = normalizeVolumeOptions(value, updateData.DungTich ?? existingProduct.DungTich);
                    existingProduct.DungTichOptions = normalizedOptions;
                } else {
                    existingProduct[field] = value;
                }
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
            
            // ✅ Kiểm tra sản phẩm tồn tại và chưa bị xóa
            const product = await SanPham.findOne({ 
                _id: id,
                TrangThai: { $ne: 'deleted' }
            });
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
                // ✅ Soft delete: Chỉ đánh dấu inactive thay vì deleted
                product.TrangThai = 'inactive';
                await product.save();
                return businessErrorResponse(res, 'PRODUCT_IN_USE', { 
                    details: `Sản phẩm đang có trong ${ordersWithProduct.length} đơn hàng chưa hoàn thành. Đã đánh dấu không hoạt động.` 
                });
            }
            
            // ✅ Hard delete chỉ khi chưa từng phát sinh đơn hàng
            // Kiểm tra xem có đơn hàng nào từng có sản phẩm này không
            const hasAnyOrder = await DonHang.exists({
                'SanPham.MaSanPham': id
            });
            
            if (hasAnyOrder) {
                // ✅ Soft delete: Đánh dấu deleted
                product.TrangThai = 'deleted';
                await product.save();
                return successResponse(res, { id }, 'Sản phẩm đã được đánh dấu xóa (soft delete)', HTTP_STATUS.OK);
            }
            
            // ✅ Hard delete chỉ khi chưa từng phát sinh đơn hàng
            // Xóa ảnh trên Cloudinary nếu có
            if (product.HinhAnhChinh) {
                try {
                    const cloudinary = require('cloudinary').v2;
                    const publicId = product.HinhAnhChinh.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`product_images/${publicId}`);
                } catch (cloudinaryError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Lỗi khi xóa ảnh trên Cloudinary:', cloudinaryError);
                    }
                }
            }
            
            // ✅ Hard delete
            await product.deleteOne();
            
            return successResponse(res, { id }, 'Sản phẩm đã được xóa hoàn toàn (hard delete)', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xóa sản phẩm: ', error);
            }
            return errorResponse(res, 'Lỗi khi xóa sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    
}
module.exports = new SanPhamController();