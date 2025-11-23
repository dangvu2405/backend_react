const TaiKhoan = require('../models/Taikhoan');
const { verifyToken } = require('../../utils/token');

/**
 * Optional Auth Middleware
 * Nếu có token thì verify và set req.user, nếu không có thì vẫn tiếp tục
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers.authorization || req.headers.Authorization;
        let token = null;
        
        if (authHeader) {
            // Hỗ trợ cả "Bearer token" và "token" trực tiếp
            if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (typeof authHeader === 'string') {
                token = authHeader;
            }
        }
        
        if (!token) {
            // Không có token, tiếp tục mà không set req.user
            return next();
        }
        
        // Verify token sử dụng utils/token.js (nhất quán với auth.middleware)
        const decoded = verifyToken(token);
        
        if (!decoded) {
            // Token không hợp lệ, nhưng vẫn tiếp tục (optional auth)
            return next();
        }
        
        // Tìm user theo ID
        const user = await TaiKhoan.findById(decoded.id)
            .select('-MatKhau -DiaChi')
            .populate('MaVaiTro', 'TenVaiTro MoTa');
        
        if (user && user.TrangThai === 'active') {
            req.user = user;
            if (!req.user.id) {
                req.user.id = req.user._id?.toString() || decoded.id;
            }
        }
        
        next();
    } catch (error) {
        // Lỗi khác, vẫn tiếp tục (optional auth)
        next();
    }
}

module.exports = optionalAuthMiddleware;

