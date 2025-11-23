/**
 * Admin Authorization Middleware
 * Kiểm tra xem user có quyền admin không
 * 
 * Phải đặt SAU authMiddleware để có req.user
 */

const { errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../constants');

const adminMiddleware = async (req, res, next) => {
    try {
        // Kiểm tra user đã được authenticate chưa
        if (!req.user) {
            return errorResponse(res, 'Vui lòng đăng nhập để tiếp tục', HTTP_STATUS.UNAUTHORIZED);
        }

        const userRole = req.user.MaVaiTro?.TenVaiTro || 
                        req.user.role || 
                        req.user.VaiTro;

        if (!userRole) {
            return errorResponse(res, 'Không thể xác định vai trò của bạn', HTTP_STATUS.FORBIDDEN);
        }

        const normalizedRole = userRole.toLowerCase().trim();
        const isAdmin = normalizedRole === 'admin' || 
                       normalizedRole === 'quản trị viên' ||
                       normalizedRole === 'administrator';

        if (!isAdmin) {
            return errorResponse(res, 'Bạn không có quyền truy cập. Yêu cầu quyền Admin.', HTTP_STATUS.FORBIDDEN);
        }

        next();
    } catch (error) {
        console.error('❌ Admin middleware error:', error);
        return errorResponse(res, 'Lỗi kiểm tra quyền truy cập', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

module.exports = adminMiddleware;

