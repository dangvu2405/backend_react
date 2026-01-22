const MMOProduct = require('../models/MMOProduct');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../constants');

/**
 * MMOShopController - Controller cho customer endpoints
 */
class MMOShopController {
    /**
     * Lấy danh sách sản phẩm MMO
     * GET /api/mmo-shop/products
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
                inStock = false
            } = req.query;

            // Validate pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            // Validate price filters
            const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
            const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

            if (minPriceNum !== undefined && minPriceNum < 0) {
                return errorResponse(res, 'Giá tối thiểu không được âm', HTTP_STATUS.BAD_REQUEST);
            }
            if (maxPriceNum !== undefined && maxPriceNum < 0) {
                return errorResponse(res, 'Giá tối đa không được âm', HTTP_STATUS.BAD_REQUEST);
            }
            if (minPriceNum !== undefined && maxPriceNum !== undefined && minPriceNum > maxPriceNum) {
                return errorResponse(res, 'Giá tối thiểu không được lớn hơn giá tối đa', HTTP_STATUS.BAD_REQUEST);
            }

            // Build filters
            const filters = {
                page: pageNum,
                limit: limitNum,
                category,
                game,
                search,
                minPrice: minPriceNum,
                maxPrice: maxPriceNum,
                sortBy,
                inStock: inStock === 'true' || inStock === true
            };

            // Get products and total count
            const [products, total] = await Promise.all([
                MMOProduct.search(filters),
                MMOProduct.countWithFilter(filters)
            ]);

            // Format response
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
            console.error('Lỗi khi lấy danh sách sản phẩm MMO:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy chi tiết sản phẩm MMO
     * GET /api/mmo-shop/products/:id
     */
    async getProduct(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return errorResponse(res, 'ID sản phẩm là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }

            const product = await MMOProduct.findById(id)
                .populate('NguoiTao', 'TenDangNhap Email')
                .populate('NguoiCapNhat', 'TenDangNhap Email');

            if (!product) {
                return errorResponse(res, 'Sản phẩm không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

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

            return successResponse(res, formattedProduct, 'Lấy chi tiết sản phẩm thành công');
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết sản phẩm MMO:', error);
            return errorResponse(res, 'Lỗi khi lấy chi tiết sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách games
     * GET /api/mmo-shop/games
     */
    async getGames(req, res) {
        try {
            const games = await MMOProduct.getGames();
            return successResponse(res, games.sort(), 'Lấy danh sách games thành công');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách games:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách games', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách categories với số lượng sản phẩm
     * GET /api/mmo-shop/categories
     */
    async getCategories(req, res) {
        try {
            const categories = await MMOProduct.getCategoryStats();
            return successResponse(res, categories, 'Lấy danh sách categories thành công');
        } catch (error) {
            console.error('Lỗi khi lấy danh sách categories:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách categories', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new MMOShopController();
