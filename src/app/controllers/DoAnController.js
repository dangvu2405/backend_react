const DoAn = require('../models/DoAn');
const LoaiDoAn = require('../models/LoaiDoAn');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../../constants');

class DoAnController {
    /**
     * Lấy danh sách đồ án với filter, search, pagination
     * GET /api/projects
     */
    async getProjects(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                category, // MaLoaiDoAn
                subject, // MonHoc
                level, // CapDo
                techStack, // CongNghe
                tags,
                minPrice,
                maxPrice,
                sortBy = 'newest', // newest, price_asc, price_desc, popular, rating, downloads
                featured,
                status = 'available'
            } = req.query;

            // Build filter
            const filter = { TrangThai: status };

            // Search
            if (search) {
                filter.$or = [
                    { TieuDe: { $regex: search, $options: 'i' } },
                    { MoTa: { $regex: search, $options: 'i' } },
                    { Tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            // Category filter
            if (category) {
                filter.MaLoaiDoAn = category;
            }

            // Subject filter
            if (subject) {
                filter.MonHoc = subject;
            }

            // Level filter
            if (level) {
                filter.CapDo = level;
            }

            // Tech stack filter
            if (techStack) {
                filter.CongNghe = { $in: [techStack] };
            }

            // Tags filter
            if (tags) {
                const tagArray = Array.isArray(tags) ? tags : tags.split(',');
                filter.Tags = { $in: tagArray };
            }

            // Price range
            if (minPrice || maxPrice) {
                filter.Gia = {};
                if (minPrice) filter.Gia.$gte = Number(minPrice);
                if (maxPrice) filter.Gia.$lte = Number(maxPrice);
            }

            // Featured filter
            if (featured === 'true' || featured === true) {
                filter.IsFeatured = true;
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
                case 'popular':
                    sort = { SoLuotTai: -1 };
                    break;
                case 'rating':
                    sort = { DanhGia: -1, SoLuongDanhGia: -1 };
                    break;
                case 'downloads':
                    sort = { SoLuotTai: -1 };
                    break;
                case 'newest':
                default:
                    sort = { createdAt: -1 };
                    break;
            }

            // Pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pageNum - 1) * limitNum;

            // Execute query
            const [projects, total] = await Promise.all([
                DoAn.find(filter)
                    .populate('MaLoaiDoAn', 'TenLoaiDoAn Loai')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                DoAn.countDocuments(filter)
            ]);

            // Calculate final price with discount
            const projectsWithPrice = projects.map(project => {
                const finalPrice = project.KhuyenMai > 0
                    ? project.Gia * (1 - project.KhuyenMai / 100)
                    : project.Gia;

                return {
                    ...project,
                    finalPrice: Math.round(finalPrice)
                };
            });

            return paginatedResponse(
                res,
                projectsWithPrice,
                pageNum,
                limitNum,
                total,
                { message: 'Lấy danh sách đồ án thành công' }
            );
        } catch (error) {
            console.error('Error getting projects:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách đồ án', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy chi tiết đồ án
     * GET /api/projects/:id
     */
    async getProject(req, res) {
        try {
            const { id } = req.params;

            const project = await DoAn.findById(id)
                .populate('MaLoaiDoAn', 'TenLoaiDoAn Loai MoTa')
                .lean();

            if (!project) {
                return errorResponse(res, 'Đồ án không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

            // Calculate final price
            const finalPrice = project.KhuyenMai > 0
                ? project.Gia * (1 - project.KhuyenMai / 100)
                : project.Gia;

            return successResponse(res, {
                ...project,
                finalPrice: Math.round(finalPrice)
            }, 'Lấy chi tiết đồ án thành công');
        } catch (error) {
            console.error('Error getting project:', error);
            return errorResponse(res, 'Lỗi khi lấy chi tiết đồ án', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách categories (LoaiDoAn)
     * GET /api/project-categories
     */
    async getCategories(req, res) {
        try {
            const { type } = req.query; // subject, level, format

            let categories;
            if (type) {
                categories = await LoaiDoAn.findByType(type);
            } else {
                categories = await LoaiDoAn.find({ TrangThai: 'active' })
                    .sort({ ThuTu: 1, TenLoaiDoAn: 1 });
            }

            // Get count for each category
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const count = await DoAn.countDocuments({
                        MaLoaiDoAn: category._id,
                        TrangThai: 'available'
                    });
                    return {
                        ...category.toObject(),
                        count
                    };
                })
            );

            return successResponse(res, categoriesWithCount, 'Lấy danh sách danh mục thành công');
        } catch (error) {
            console.error('Error getting categories:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách danh mục', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách đồ án tương tự
     * GET /api/projects/:id/similar
     */
    async getSimilarProjects(req, res) {
        try {
            const { id } = req.params;
            const { limit = 5 } = req.query;

            const project = await DoAn.findById(id);
            if (!project) {
                return errorResponse(res, 'Đồ án không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

            // Find similar projects by category, subject, or tech stack
            const similarProjects = await DoAn.find({
                _id: { $ne: id },
                TrangThai: 'available',
                $or: [
                    { MaLoaiDoAn: project.MaLoaiDoAn },
                    { MonHoc: project.MonHoc },
                    { CongNghe: { $in: project.CongNghe } }
                ]
            })
                .limit(parseInt(limit))
                .sort({ DanhGia: -1, SoLuotTai: -1 })
                .lean();

            return successResponse(res, similarProjects, 'Lấy danh sách đồ án tương tự thành công');
        } catch (error) {
            console.error('Error getting similar projects:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách đồ án tương tự', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy top đồ án (theo lượt tải, đánh giá)
     * GET /api/projects/top?type=downloads|rating
     */
    async getTopProjects(req, res) {
        try {
            const { type = 'downloads', limit = 10 } = req.query;

            let sort = {};
            if (type === 'rating') {
                sort = { DanhGia: -1, SoLuongDanhGia: -1 };
            } else {
                sort = { SoLuotTai: -1 };
            }

            const projects = await DoAn.find({ TrangThai: 'available' })
                .sort(sort)
                .limit(parseInt(limit))
                .populate('MaLoaiDoAn', 'TenLoaiDoAn')
                .lean();

            return successResponse(res, projects, 'Lấy top đồ án thành công');
        } catch (error) {
            console.error('Error getting top projects:', error);
            return errorResponse(res, 'Lỗi khi lấy top đồ án', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new DoAnController();
