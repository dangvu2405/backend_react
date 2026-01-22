const MMOProduct = require('../models/MMOProduct');
const MMOOrder = require('../models/MMOOrder');
const DonHang = require('../models/DonHang');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../constants');

/**
 * AdminMMOShopController - Controller cho admin endpoints
 */
class AdminMMOShopController {
    /**
     * Tạo sản phẩm MMO mới
     * POST /api/admin/mmo-shop/products
     */
    async createProduct(req, res) {
        try {
            const validated = req.validated || req.body;
            const userId = req.user?.id || req.user?._id;

            // Tạo sản phẩm
            const product = await MMOProduct.create({
                ...validated,
                NguoiTao: userId,
                NguoiCapNhat: userId
            });

            // Format response
            const formattedProduct = {
                id: product._id.toString(),
                name: product.Ten,
                category: product.Loai,
                game: product.Game,
                price: product.Gia,
                stock: product.SoLuong,
                description: product.MoTa,
                image: product.HinhAnh || null,
                status: product.TrangThai,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };

            return successResponse(
                res,
                formattedProduct,
                'Tạo sản phẩm thành công',
                HTTP_STATUS.CREATED
            );
        } catch (error) {
            console.error('Lỗi khi tạo sản phẩm MMO:', error);
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return errorResponse(res, 'Sản phẩm đã tồn tại', HTTP_STATUS.BAD_REQUEST);
            }
            
            return errorResponse(res, 'Lỗi khi tạo sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cập nhật sản phẩm MMO
     * PUT /api/admin/mmo-shop/products/:id
     */
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const validated = req.validated || req.body;
            const userId = req.user?.id || req.user?._id;

            if (!id) {
                return errorResponse(res, 'ID sản phẩm là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }

            const product = await MMOProduct.findById(id);
            if (!product) {
                return errorResponse(res, 'Sản phẩm không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

            // Cập nhật các trường
            Object.keys(validated).forEach(key => {
                if (validated[key] !== undefined) {
                    product[key] = validated[key];
                }
            });

            product.NguoiCapNhat = userId;
            await product.save();

            // Format response
            const formattedProduct = {
                id: product._id.toString(),
                name: product.Ten,
                category: product.Loai,
                game: product.Game,
                price: product.Gia,
                stock: product.SoLuong,
                description: product.MoTa,
                image: product.HinhAnh || null,
                status: product.TrangThai,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };

            return successResponse(res, formattedProduct, 'Cập nhật sản phẩm thành công');
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm MMO:', error);
            return errorResponse(res, 'Lỗi khi cập nhật sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Xóa sản phẩm MMO (soft delete)
     * DELETE /api/admin/mmo-shop/products/:id
     */
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return errorResponse(res, 'ID sản phẩm là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }

            const product = await MMOProduct.findById(id);
            if (!product) {
                return errorResponse(res, 'Sản phẩm không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

            // Soft delete - set status to inactive
            product.TrangThai = 'inactive';
            await product.save();

            return successResponse(res, null, 'Xóa sản phẩm thành công');
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm MMO:', error);
            return errorResponse(res, 'Lỗi khi xóa sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách sản phẩm MMO (Admin - có thể xem tất cả)
     * GET /api/admin/mmo-shop/products
     */
    async getProducts(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                category = 'all',
                game,
                search,
                minPrice,
                maxPrice,
                sortBy = 'newest',
                status = 'all',
                createdBy
            } = req.query;

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const filters = {
                page: pageNum,
                limit: limitNum,
                category,
                game,
                search,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                sortBy,
                inStock: false // Admin có thể xem tất cả
            };

            // Build query for admin (có thể filter theo status và createdBy)
            let query = MMOProduct.find();

            if (category && category !== 'all') {
                query = query.where('Loai').equals(category);
            }

            if (game) {
                query = query.where('Game').equals(game);
            }

            if (status && status !== 'all') {
                query = query.where('TrangThai').equals(status);
            }

            if (createdBy) {
                query = query.where('NguoiTao').equals(createdBy);
            }

            if (search) {
                query = query.find({ $text: { $search: search } });
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                const priceFilter = {};
                if (minPrice !== undefined) priceFilter.$gte = parseFloat(minPrice);
                if (maxPrice !== undefined) priceFilter.$lte = parseFloat(maxPrice);
                query = query.where('Gia', priceFilter);
            }

            // Sort
            let sort = {};
            switch (sortBy) {
                case 'price_asc':
                    sort = { Gia: 1 };
                    break;
                case 'price_desc':
                    sort = { Gia: -1 };
                    break;
                case 'newest':
                    sort = { createdAt: -1 };
                    break;
                case 'name_asc':
                    sort = { Ten: 1 };
                    break;
                default:
                    sort = { createdAt: -1 };
            }

            const skip = (pageNum - 1) * limitNum;

            const [products, total] = await Promise.all([
                query
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .populate('NguoiTao', 'TenDangNhap Email')
                    .populate('NguoiCapNhat', 'TenDangNhap Email'),
                query.model.countDocuments(query.getQuery())
            ]);

            const formattedProducts = products.map(product => ({
                id: product._id.toString(),
                name: product.Ten,
                category: product.Loai,
                game: product.Game,
                price: product.Gia,
                stock: product.SoLuong,
                description: product.MoTa,
                image: product.HinhAnh || null,
                status: product.TrangThai,
                createdBy: product.NguoiTao ? {
                    id: product.NguoiTao._id.toString(),
                    username: product.NguoiTao.TenDangNhap,
                    email: product.NguoiTao.Email
                } : null,
                updatedBy: product.NguoiCapNhat ? {
                    id: product.NguoiCapNhat._id.toString(),
                    username: product.NguoiCapNhat.TenDangNhap,
                    email: product.NguoiCapNhat.Email
                } : null,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }));

            const totalPages = Math.ceil(total / limitNum);

            return paginatedResponse(
                res,
                formattedProducts,
                {
                    currentPage: pageNum,
                    pageSize: limitNum,
                    totalPages,
                    totalItems: total
                },
                'Lấy danh sách sản phẩm thành công'
            );
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm MMO (Admin):', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy thống kê MMO Shop
     * GET /api/admin/mmo-shop/stats
     */
    async getStats(req, res) {
        try {
            // Total products
            const totalProducts = await MMOProduct.countDocuments();

            // Total by category
            const totalByCategory = await MMOProduct.aggregate([
                {
                    $group: {
                        _id: '$Loai',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const categoryMap = {
                gold: 0,
                items: 0,
                accounts: 0,
                services: 0
            };

            totalByCategory.forEach(item => {
                categoryMap[item._id] = item.count;
            });

            // Total by status
            const totalByStatus = await MMOProduct.aggregate([
                {
                    $group: {
                        _id: '$TrangThai',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const statusMap = {
                active: 0,
                inactive: 0,
                out_of_stock: 0
            };

            totalByStatus.forEach(item => {
                statusMap[item._id] = item.count;
            });

            // Low stock products (stock < 10)
            const lowStockProducts = await MMOProduct.countDocuments({
                SoLuong: { $lt: 10 },
                TrangThai: 'active'
            });

            // Total revenue from MMO orders
            const revenueStats = await MMOOrder.aggregate([
                {
                    $match: {
                        TrangThaiGiaoHang: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$ThanhTien' },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]);

            const totalRevenue = revenueStats[0]?.totalRevenue || 0;
            const totalOrders = revenueStats[0]?.totalOrders || 0;

            // Top games by product count and revenue
            const topGamesByProducts = await MMOProduct.aggregate([
                {
                    $group: {
                        _id: '$Game',
                        productCount: { $sum: 1 }
                    }
                },
                { $sort: { productCount: -1 } },
                { $limit: 10 }
            ]);

            const topGamesByRevenue = await MMOOrder.aggregate([
                {
                    $match: {
                        TrangThaiGiaoHang: { $ne: 'cancelled' }
                    }
                },
                {
                    $lookup: {
                        from: 'mmoproducts',
                        localField: 'MaSanPham',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$product.Game',
                        revenue: { $sum: '$ThanhTien' }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 }
            ]);

            // Merge top games
            const topGamesMap = new Map();
            topGamesByProducts.forEach(item => {
                topGamesMap.set(item._id, {
                    game: item._id,
                    productCount: item.productCount,
                    revenue: 0
                });
            });
            topGamesByRevenue.forEach(item => {
                const existing = topGamesMap.get(item._id);
                if (existing) {
                    existing.revenue = item.revenue;
                } else {
                    topGamesMap.set(item._id, {
                        game: item._id,
                        productCount: 0,
                        revenue: item.revenue
                    });
                }
            });

            const topGames = Array.from(topGamesMap.values())
                .sort((a, b) => (b.revenue + b.productCount) - (a.revenue + a.productCount))
                .slice(0, 10);

            return successResponse(res, {
                totalProducts,
                totalByCategory: categoryMap,
                totalByStatus: statusMap,
                totalRevenue,
                totalOrders,
                lowStockProducts,
                topGames
            }, 'Lấy thống kê thành công');
        } catch (error) {
            console.error('Lỗi khi lấy thống kê MMO Shop:', error);
            return errorResponse(res, 'Lỗi khi lấy thống kê', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new AdminMMOShopController();
