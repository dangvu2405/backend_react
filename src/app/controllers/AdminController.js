const mongoose = require('mongoose');
const SanPhamController = require('./SanPhamController');
const LoaiSanPhamController = require('./LoaiSanPhamController');
const RoleController = require('./RoleController');
const TaiKhoanController = require('./TaiKhoanController');
const DonHangController = require('./DonHangController');
const GioHangController = require('./GioHangController');
const KhoController = require('./KhoController');
const SanPham = require('../models/SanPham');
const LoaiSanPham = require('../models/LoaiSanPham');
const Role = require('../models/Role');
const TaiKhoan = require('../models/Taikhoan');
const DonHang = require('../models/DonHang');
const DanhGia = require('../models/DanhGia');
const Voucher = require('../models/Voucher');

class AdminController {
    // ==========================
    // PRODUCT MANAGEMENT
    // ==========================
    async createProduct(req, res) {
        return SanPhamController.createProduct(req, res);
    }

    async getProduct(req, res) {
        return SanPhamController.getProduct(req, res);
    }

    async getAllProducts(req, res) {
        return SanPhamController.getAllProducts(req, res);
    }

    async updateProduct(req, res) {
        return SanPhamController.updateProduct(req, res);
    }

    async deleteProduct(req, res) {
        return SanPhamController.deleteProduct(req, res);
    }

    // ==========================
    // CATEGORY MANAGEMENT
    // ==========================
    async createCategory(req, res) {
        return LoaiSanPhamController.createCategory(req, res);
    }

    async getCategory(req, res) {
        return LoaiSanPhamController.getCategoryById(req, res);
    }

    async getAllCategories(req, res) {
        return LoaiSanPhamController.getAllCategories(req, res);
    }

    async updateCategory(req, res) {
        return LoaiSanPhamController.updateCategory(req, res);
    }

    async deleteCategory(req, res) {
        return LoaiSanPhamController.deleteCategory(req, res);
    }

    // ==========================
    // ROLE MANAGEMENT
    // ==========================
    async createRole(req, res) {
        return RoleController.createRole(req, res);
    }

    async getRole(req, res) {
        return RoleController.getRoleById(req, res);
    }

    async getAllRoles(req, res) {
        return RoleController.getAllRoles(req, res);
    }

    async updateRole(req, res) {
        return RoleController.updateRole(req, res);
    }

    async deleteRole(req, res) {
        return RoleController.deleteRole(req, res);
    }

    // ==========================
    // ACCOUNT MANAGEMENT
    // ==========================
    async createUser(req, res) {
        return TaiKhoanController.createUser(req, res);
    }

    async getAllUsers(req, res) {
        return TaiKhoanController.getAllUsers(req, res);
    }

    async getCustomers(req, res) {
        try {
            const { page = 1, limit = 100, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            
            // Lấy Customer role
            const customerRole = await Role.findOne({ TenVaiTro: 'Customer' });
            if (!customerRole) {
                return res.status(404).json({
                    message: 'Không tìm thấy role Customer',
                    data: []
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Lấy tất cả tài khoản có role Customer
            const [customers, total] = await Promise.all([
                TaiKhoan.find({ MaVaiTro: customerRole._id })
                    .populate('MaVaiTro', 'TenVaiTro')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                TaiKhoan.countDocuments({ MaVaiTro: customerRole._id })
            ]);

            // Lấy thông tin đơn hàng cho mỗi customer
            const customersWithOrders = await Promise.all(
                customers.map(async (customer) => {
                    // MaKhachHang có thể là string hoặc ObjectId, cần match cả 2
                    const customerIdStr = customer._id.toString();
                    const orderStats = await DonHang.aggregate([
                        {
                            $match: {
                                $or: [
                                    { MaKhachHang: customerIdStr },
                                    { MaKhachHang: customer._id }
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                orderCount: { $sum: 1 },
                                totalRevenue: { $sum: '$TongTien' }
                            }
                        }
                    ]);

                    const stats = orderStats[0] || { orderCount: 0, totalRevenue: 0 };

                    return {
                        _id: customer._id,
                        HoTen: customer.HoTen,
                        Email: customer.Email,
                        SoDienThoai: customer.SoDienThoai,
                        GioiTinh: customer.GioiTinh,
                        NgaySinh: customer.NgaySinh,
                        TrangThai: customer.TrangThai,
                        orderCount: stats.orderCount,
                        totalRevenue: stats.totalRevenue || 0,
                        MaVaiTro: customer.MaVaiTro,
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    };
                })
            );

            return res.status(200).json({
                message: 'Lấy danh sách khách hàng thành công',
                data: customersWithOrders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách khách hàng:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy danh sách khách hàng',
                error: error.message
            });
        }
    }

    async updateCustomer(req, res) {
        return TaiKhoanController.updateCustomer(req, res);
    }

    async deleteCustomer(req, res) {
        return TaiKhoanController.deleteCustomer(req, res);
    }

    async lockCustomer(req, res) {
        return TaiKhoanController.lockCustomer(req, res);
    }

    async changeCustomerRole(req, res) {
        return TaiKhoanController.changeCustomerRole(req, res);
    }

    async getUser(req, res) {
        return TaiKhoanController.getMe(req, res);
    }

    async updateUser(req, res) {
        return TaiKhoanController.updateUser(req, res);
    }

    async deleteUser(req, res) {
        return TaiKhoanController.deleteUser(req, res);
    }

    // ==========================
    // ORDER MANAGEMENT
    // ==========================
    async createOrder(req, res) {
        return DonHangController.createDonHang(req, res);
    }

    async getAllOrders(req, res) {
        return DonHangController.getAllOrders(req, res);
    }

    async getOrder(req, res) {
        return DonHangController.getOrderDetail(req, res);
    }

    async getUserOrders(req, res) {
        return DonHangController.getDonHang(req, res);
    }

    async updateOrder(req, res) {
        return DonHangController.updateDonHang(req, res);
    }

    async deleteOrder(req, res) {
        return DonHangController.deleteDonHang(req, res);
    }

    async cancelOrder(req, res) {
        return DonHangController.cancelDonHang(req, res);
    }

    async checkout(req, res) {
        return DonHangController.checkout(req, res);
    }

    // ==========================
    // CART MANAGEMENT
    // ==========================
    async addToCart(req, res) {
        return GioHangController.addToCart(req, res);
    }

    async getCart(req, res) {
        return GioHangController.getCart(req, res);
    }

    async updateCart(req, res) {
        return GioHangController.updateCart(req, res);
    }

    async deleteCartItem(req, res) {
        return GioHangController.deleteCart(req, res);
    }

    async clearCart(req, res) {
        return GioHangController.deleteAllCart(req, res);
    }

    // ==========================
    // INVENTORY MANAGEMENT
    // ==========================
    async getInventory(req, res) {
        return KhoController.getInventory(req, res);
    }

    async getInventoryItem(req, res) {
        return KhoController.getInventoryItem(req, res);
    }

    async increaseStock(req, res) {
        return KhoController.increaseStock(req, res);
    }

    async decreaseStock(req, res) {
        return KhoController.decreaseStock(req, res);
    }

    async setStock(req, res) {
        return KhoController.setStock(req, res);
    }

    async clearStock(req, res) {
        return KhoController.clearStock(req, res);
    }

    // ==========================
    // STATISTICS / DASHBOARD
    // ==========================
    async getSummaryStats(req, res) {
        try {
            const [totalProducts, totalCategories, totalRoles, totalUsers, ordersStats] = await Promise.all([
                SanPham.countDocuments(),
                LoaiSanPham.countDocuments(),
                Role.countDocuments(),
                TaiKhoan.countDocuments(),
                DonHang.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalRevenue: { $sum: '$TongTien' }
                        }
                    }
                ])
            ]);

            const stats = ordersStats[0] || { totalOrders: 0, totalRevenue: 0 };

            return res.status(200).json({
                message: 'Thống kê tổng quan',
                data: {
                    totalProducts,
                    totalCategories,
                    totalRoles,
                    totalUsers,
                    totalOrders: stats.totalOrders,
                    totalRevenue: stats.totalRevenue
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy thống kê tổng quan:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy thống kê tổng quan',
                error: error.message
            });
        }
    }

    async getRevenueStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const match = {};

            if (startDate || endDate) {
                match.createdAt = {};
                if (startDate) {
                    match.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    match.createdAt.$lte = new Date(endDate);
                }
            }

            const stats = await DonHang.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$TongTien' },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]);

            const { totalRevenue = 0, totalOrders = 0 } = stats[0] || {};

            return res.status(200).json({
                message: 'Thống kê doanh thu',
                data: {
                    totalRevenue,
                    totalOrders
                }
            });
        } catch (error) {
            console.error('Lỗi khi thống kê doanh thu:', error);
            return res.status(500).json({
                message: 'Lỗi khi thống kê doanh thu',
                error: error.message
            });
        }
    }

    async getTopSellingProducts(req, res) {
        try {
            const { limit = 5 } = req.query;
            const topProducts = await SanPham.find({})
                .sort({ DaBan: -1 })
                .limit(Number(limit) || 5)
                .select('TenSanPham DaBan Gia')
                .populate('MaLoaiSanPham', 'TenLoaiSanPham');

            return res.status(200).json({
                message: 'Top sản phẩm bán chạy',
                data: topProducts
            });
        } catch (error) {
            console.error('Lỗi khi lấy top sản phẩm:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy top sản phẩm',
                error: error.message
            });
        }
    }

    async getLowStockProducts(req, res) {
        try {
            const { threshold = 5 } = req.query;
            const lowStockProducts = await SanPham.find({
                SoLuong: { $lte: Number(threshold) || 5 }
            })
            .sort({ SoLuong: 1 })
            .select('TenSanPham SoLuong Gia')
            .populate('MaLoaiSanPham', 'TenLoaiSanPham');

            return res.status(200).json({
                message: 'Sản phẩm sắp hết hàng',
                data: lowStockProducts
            });
        } catch (error) {
            console.error('Lỗi khi lấy sản phẩm sắp hết hàng:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy sản phẩm sắp hết hàng',
                error: error.message
            });
        }
    }

    async getMonthlyOrdersStats(req, res) {
        try {
            const months = Math.max(1, Math.min(parseInt(req.query.months, 10) || 6, 24));
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

            const stats = await DonHang.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDate
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$TongTien' }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                }
            ]);

            const formatted = stats.map((item) => ({
                year: item._id.year,
                month: item._id.month,
                totalOrders: item.totalOrders,
                totalRevenue: item.totalRevenue
            }));

            return res.status(200).json({
                message: 'Thống kê đơn hàng theo tháng',
                data: formatted
            });
        } catch (error) {
            console.error('Lỗi khi thống kê đơn hàng theo tháng:', error);
            return res.status(500).json({
                message: 'Lỗi khi thống kê đơn hàng theo tháng',
                error: error.message
            });
        }
    }

    async getTopCustomersByOrders(req, res) {
        try {
            const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 20));

            const topCustomers = await DonHang.aggregate([
                {
                    $match: {
                        MaKhachHang: { $ne: null }
                    }
                },
                {
                    $addFields: {
                        customerObjectId: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: [{ $type: '$MaKhachHang' }, 'objectId'] },
                                        then: '$MaKhachHang'
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $eq: [{ $type: '$MaKhachHang' }, 'string'] },
                                                {
                                                    $regexMatch: {
                                                        input: '$MaKhachHang',
                                                        regex: /^[a-fA-F0-9]{24}$/
                                                    }
                                                }
                                            ]
                                        },
                                        then: { $toObjectId: '$MaKhachHang' }
                                    }
                                ],
                                default: null
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$MaKhachHang',
                        customerObjectId: { $first: '$customerObjectId' },
                        orderCount: { $sum: 1 },
                        totalRevenue: { $sum: '$TongTien' }
                    }
                },
                {
                    $lookup: {
                        from: 'Taikhoan',
                        localField: 'customerObjectId',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                {
                    $addFields: {
                        customer: { $first: '$customer' }
                    }
                },
                {
                    $project: {
                        customerId: '$_id',
                        orderCount: 1,
                        totalRevenue: 1,
                        name: {
                            $ifNull: [
                                '$customer.HoTen',
                                {
                                    $ifNull: [
                                        '$customer.TenDangNhap',
                                        '$customer.username'
                                    ]
                                }
                            ]
                        },
                        email: '$customer.Email'
                    }
                },
                {
                    $sort: { orderCount: -1, totalRevenue: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return res.status(200).json({
                message: 'Top khách hàng theo số lượng đơn hàng',
                data: topCustomers
            });
        } catch (error) {
            console.error('Lỗi khi lấy top khách hàng:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy top khách hàng',
                error: error.message
            });
        }
    }

    // ==========================
    // REVIEW MANAGEMENT
    // ==========================
    
    /**
     * Lấy tất cả đánh giá (admin)
     * GET /admin/reviews
     */
    async getAllReviews(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                productId,
                customerId,
                minRating,
                maxRating
            } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Build filter
            const filter = {};
            if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                filter.IdSanPham = new mongoose.Types.ObjectId(productId);
            }
            if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
                filter.IdKhachHang = new mongoose.Types.ObjectId(customerId);
            }
            if (minRating || maxRating) {
                filter.SoSao = {};
                if (minRating) filter.SoSao.$gte = parseInt(minRating);
                if (maxRating) filter.SoSao.$lte = parseInt(maxRating);
            }

            const [reviews, total] = await Promise.all([
                DanhGia.find(filter)
                    .populate('IdSanPham', 'TenSanPham HinhAnhChinh Gia')
                    .populate('IdKhachHang', 'HoTen Email AvatarUrl')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                DanhGia.countDocuments(filter)
            ]);

            return res.status(200).json({
                message: 'Lấy danh sách đánh giá thành công',
                data: reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đánh giá:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy danh sách đánh giá',
                error: error.message
            });
        }
    }

    /**
     * Lấy chi tiết đánh giá (admin)
     * GET /admin/reviews/:id
     */
    async getReview(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'ID đánh giá không hợp lệ'
                });
            }

            const review = await DanhGia.findById(id)
                .populate('IdSanPham', 'TenSanPham HinhAnhChinh Gia MaLoaiSanPham')
                .populate('IdKhachHang', 'HoTen Email SoDienThoai AvatarUrl')
                .lean();

            if (!review) {
                return res.status(404).json({
                    message: 'Không tìm thấy đánh giá'
                });
            }

            return res.status(200).json({
                message: 'Lấy chi tiết đánh giá thành công',
                data: review
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đánh giá:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy chi tiết đánh giá',
                error: error.message
            });
        }
    }

    /**
     * Xóa đánh giá (admin)
     * DELETE /admin/reviews/:id
     */
    async deleteReview(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'ID đánh giá không hợp lệ'
                });
            }

            const review = await DanhGia.findById(id);

            if (!review) {
                return res.status(404).json({
                    message: 'Không tìm thấy đánh giá'
                });
            }

            await review.deleteOne();

            return res.status(200).json({
                message: 'Xóa đánh giá thành công'
            });
        } catch (error) {
            console.error('Lỗi khi xóa đánh giá:', error);
            return res.status(500).json({
                message: 'Lỗi khi xóa đánh giá',
                error: error.message
            });
        }
    }

    /**
     * Xóa nhiều đánh giá (admin)
     * DELETE /admin/reviews
     */
    async deleteMultipleReviews(req, res) {
        try {
            const { reviewIds } = req.body;

            if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
                return res.status(400).json({
                    message: 'Vui lòng cung cấp danh sách ID đánh giá'
                });
            }

            // Validate all IDs
            const validIds = reviewIds.filter(id => mongoose.Types.ObjectId.isValid(id));
            if (validIds.length === 0) {
                return res.status(400).json({
                    message: 'Không có ID đánh giá hợp lệ'
                });
            }

            const result = await DanhGia.deleteMany({
                _id: { $in: validIds }
            });

            return res.status(200).json({
                message: `Đã xóa ${result.deletedCount} đánh giá thành công`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error('Lỗi khi xóa nhiều đánh giá:', error);
            return res.status(500).json({
                message: 'Lỗi khi xóa nhiều đánh giá',
                error: error.message
            });
        }
    }

    /**
     * Thống kê đánh giá tổng quan (admin)
     * GET /admin/reviews/stats
     */
    async getReviewStats(req, res) {
        try {
            const stats = await DanhGia.aggregate([
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        avgRating: { $avg: '$SoSao' },
                        star5: { $sum: { $cond: [{ $eq: ['$SoSao', 5] }, 1, 0] } },
                        star4: { $sum: { $cond: [{ $eq: ['$SoSao', 4] }, 1, 0] } },
                        star3: { $sum: { $cond: [{ $eq: ['$SoSao', 3] }, 1, 0] } },
                        star2: { $sum: { $cond: [{ $eq: ['$SoSao', 2] }, 1, 0] } },
                        star1: { $sum: { $cond: [{ $eq: ['$SoSao', 1] }, 1, 0] } }
                    }
                }
            ]);

            // Thống kê đánh giá theo sản phẩm (top sản phẩm có nhiều đánh giá nhất)
            const topReviewedProducts = await DanhGia.aggregate([
                {
                    $group: {
                        _id: '$IdSanPham',
                        reviewCount: { $sum: 1 },
                        avgRating: { $avg: '$SoSao' }
                    }
                },
                { $sort: { reviewCount: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'SanPham',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        productId: '$_id',
                        productName: '$product.TenSanPham',
                        reviewCount: 1,
                        avgRating: { $round: ['$avgRating', 2] }
                    }
                }
            ]);

            // Thống kê đánh giá theo tháng (6 tháng gần nhất)
            const monthlyStats = await DanhGia.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        reviewCount: { $sum: 1 },
                        avgRating: { $avg: '$SoSao' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            const formattedMonthlyStats = monthlyStats.map(item => ({
                year: item._id.year,
                month: item._id.month,
                reviewCount: item.reviewCount,
                avgRating: Math.round(item.avgRating * 100) / 100
            }));

            const result = stats[0] || {
                totalReviews: 0,
                avgRating: 0,
                star5: 0,
                star4: 0,
                star3: 0,
                star2: 0,
                star1: 0
            };

            return res.status(200).json({
                message: 'Thống kê đánh giá thành công',
                data: {
                    summary: {
                        totalReviews: result.totalReviews,
                        avgRating: Math.round(result.avgRating * 100) / 100,
                        distribution: {
                            star5: result.star5,
                            star4: result.star4,
                            star3: result.star3,
                            star2: result.star2,
                            star1: result.star1
                        }
                    },
                    topReviewedProducts,
                    monthlyStats: formattedMonthlyStats
                }
            });
        } catch (error) {
            console.error('Lỗi khi thống kê đánh giá:', error);
            return res.status(500).json({
                message: 'Lỗi khi thống kê đánh giá',
                error: error.message
            });
        }
    }

    // ==========================
    // VOUCHER MANAGEMENT
    // ==========================

    /**
     * Tạo voucher mới
     * POST /admin/vouchers
     */
    async createVoucher(req, res) {
        try {
            const { MaVoucher, NoiDung, GiaTri, SoLuong, NgayTao } = req.body;

            // Validation
            if (!MaVoucher || !NoiDung || GiaTri === undefined || SoLuong === undefined) {
                return res.status(400).json({
                    message: 'Vui lòng điền đầy đủ thông tin: MaVoucher, NoiDung, GiaTri, SoLuong'
                });
            }

            // Kiểm tra mã voucher đã tồn tại chưa
            const existingVoucher = await Voucher.findByCode(MaVoucher);
            if (existingVoucher) {
                return res.status(400).json({
                    message: 'Mã voucher đã tồn tại'
                });
            }

            // Validate giá trị
            if (GiaTri < 0 || GiaTri > 100) {
                return res.status(400).json({
                    message: 'Giá trị voucher phải từ 0 đến 100'
                });
            }

            if (SoLuong < 0) {
                return res.status(400).json({
                    message: 'Số lượng voucher không được âm'
                });
            }

            // Tạo voucher mới
            const voucher = new Voucher({
                MaVoucher: MaVoucher.toUpperCase().trim(),
                NoiDung: NoiDung.trim(),
                GiaTri: Number(GiaTri),
                SoLuong: Number(SoLuong),
                NgayTao: NgayTao ? new Date(NgayTao) : new Date()
            });

            await voucher.save();

            return res.status(201).json({
                message: 'Tạo voucher thành công',
                data: voucher
            });
        } catch (error) {
            console.error('Lỗi khi tạo voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi tạo voucher',
                error: error.message
            });
        }
    }

    /**
     * Lấy tất cả vouchers
     * GET /admin/vouchers
     */
    async getAllVouchers(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                sortBy = 'NgayTao',
                sortOrder = 'desc',
                search,
                minGiaTri,
                maxGiaTri,
                minSoLuong,
                maxSoLuong
            } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Build filter
            const filter = {};
            if (search) {
                filter.$or = [
                    { MaVoucher: { $regex: search, $options: 'i' } },
                    { NoiDung: { $regex: search, $options: 'i' } }
                ];
            }
            if (minGiaTri || maxGiaTri) {
                filter.GiaTri = {};
                if (minGiaTri) filter.GiaTri.$gte = Number(minGiaTri);
                if (maxGiaTri) filter.GiaTri.$lte = Number(maxGiaTri);
            }
            if (minSoLuong || maxSoLuong) {
                filter.SoLuong = {};
                if (minSoLuong) filter.SoLuong.$gte = Number(minSoLuong);
                if (maxSoLuong) filter.SoLuong.$lte = Number(maxSoLuong);
            }

            const [vouchers, total] = await Promise.all([
                Voucher.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Voucher.countDocuments(filter)
            ]);

            return res.status(200).json({
                message: 'Lấy danh sách voucher thành công',
                data: vouchers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy danh sách voucher',
                error: error.message
            });
        }
    }

    /**
     * Lấy chi tiết voucher
     * GET /admin/vouchers/:id
     */
    async getVoucher(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'ID voucher không hợp lệ'
                });
            }

            const voucher = await Voucher.findById(id).lean();

            if (!voucher) {
                return res.status(404).json({
                    message: 'Không tìm thấy voucher'
                });
            }

            return res.status(200).json({
                message: 'Lấy chi tiết voucher thành công',
                data: voucher
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi lấy chi tiết voucher',
                error: error.message
            });
        }
    }

    /**
     * Cập nhật voucher
     * PUT /admin/vouchers/:id
     */
    async updateVoucher(req, res) {
        try {
            const { id } = req.params;
            const { MaVoucher, NoiDung, GiaTri, SoLuong, NgayTao } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'ID voucher không hợp lệ'
                });
            }

            const voucher = await Voucher.findById(id);
            if (!voucher) {
                return res.status(404).json({
                    message: 'Không tìm thấy voucher'
                });
            }

            // Kiểm tra mã voucher nếu có thay đổi
            if (MaVoucher && MaVoucher.toUpperCase() !== voucher.MaVoucher) {
                const codeExists = await Voucher.isCodeExist(MaVoucher, id);
                if (codeExists) {
                    return res.status(400).json({
                        message: 'Mã voucher đã tồn tại'
                    });
                }
                voucher.MaVoucher = MaVoucher.toUpperCase().trim();
            }

            // Cập nhật các trường khác
            if (NoiDung !== undefined) voucher.NoiDung = NoiDung.trim();
            if (GiaTri !== undefined) {
                if (GiaTri < 0 || GiaTri > 100) {
                    return res.status(400).json({
                        message: 'Giá trị voucher phải từ 0 đến 100'
                    });
                }
                voucher.GiaTri = Number(GiaTri);
            }
            if (SoLuong !== undefined) {
                if (SoLuong < 0) {
                    return res.status(400).json({
                        message: 'Số lượng voucher không được âm'
                    });
                }
                voucher.SoLuong = Number(SoLuong);
            }
            if (NgayTao !== undefined) voucher.NgayTao = new Date(NgayTao);

            await voucher.save();

            return res.status(200).json({
                message: 'Cập nhật voucher thành công',
                data: voucher
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi cập nhật voucher',
                error: error.message
            });
        }
    }

    /**
     * Xóa voucher
     * DELETE /admin/vouchers/:id
     */
    async deleteVoucher(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'ID voucher không hợp lệ'
                });
            }

            const voucher = await Voucher.findById(id);
            if (!voucher) {
                return res.status(404).json({
                    message: 'Không tìm thấy voucher'
                });
            }

            await voucher.deleteOne();

            return res.status(200).json({
                message: 'Xóa voucher thành công'
            });
        } catch (error) {
            console.error('Lỗi khi xóa voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi xóa voucher',
                error: error.message
            });
        }
    }

    /**
     * Thống kê voucher
     * GET /admin/vouchers/stats
     */
    async getVoucherStats(req, res) {
        try {
            const stats = await Voucher.aggregate([
                {
                    $group: {
                        _id: null,
                        totalVouchers: { $sum: 1 },
                        totalQuantity: { $sum: '$SoLuong' },
                        avgGiaTri: { $avg: '$GiaTri' },
                        minGiaTri: { $min: '$GiaTri' },
                        maxGiaTri: { $max: '$GiaTri' },
                        lowStock: {
                            $sum: {
                                $cond: [{ $lte: ['$SoLuong', 10] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            // Thống kê voucher theo giá trị (phân loại)
            const giaTriDistribution = await Voucher.aggregate([
                {
                    $group: {
                        _id: {
                            $switch: {
                                branches: [
                                    { case: { $lte: ['$GiaTri', 10] }, then: '0-10%' },
                                    { case: { $lte: ['$GiaTri', 25] }, then: '11-25%' },
                                    { case: { $lte: ['$GiaTri', 50] }, then: '26-50%' },
                                    { case: { $lte: ['$GiaTri', 75] }, then: '51-75%' },
                                    { case: { $lte: ['$GiaTri', 100] }, then: '76-100%' }
                                ],
                                default: 'Unknown'
                            }
                        },
                        count: { $sum: 1 },
                        totalQuantity: { $sum: '$SoLuong' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const result = stats[0] || {
                totalVouchers: 0,
                totalQuantity: 0,
                avgGiaTri: 0,
                minGiaTri: 0,
                maxGiaTri: 0,
                lowStock: 0
            };

            return res.status(200).json({
                message: 'Thống kê voucher thành công',
                data: {
                    summary: {
                        totalVouchers: result.totalVouchers,
                        totalQuantity: result.totalQuantity,
                        avgGiaTri: Math.round(result.avgGiaTri * 100) / 100,
                        minGiaTri: result.minGiaTri,
                        maxGiaTri: result.maxGiaTri,
                        lowStock: result.lowStock
                    },
                    giaTriDistribution
                }
            });
        } catch (error) {
            console.error('Lỗi khi thống kê voucher:', error);
            return res.status(500).json({
                message: 'Lỗi khi thống kê voucher',
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();
