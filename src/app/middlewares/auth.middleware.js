const TaiKhoan = require('../models/Taikhoan');
const { verifyToken } = require('../../utils/token');
const { errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../constants');


const authMiddleware = async (req, res, next) => {
    try {
        const publicPaths = [
            '/auth/login',
            '/auth/register',
            '/auth/refresh-token',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/google',
            '/auth/google/callback',
            '/auth/google/error',
            '/api/supply-chain/lookup',
            '/payment/vnpay/return'
        ];
        
        const publicPathPatterns = [
            /^\/uploads\/.*$/,
            /^\/api\/products(?:\/[^\/]+)?$/,
            /^\/api\/categories(?:\/[^\/]+)?$/,
            /^\/api\/reviews\/product\/[^\/]+(?:\/stats)?$/,
            /^\/api\/supply-chain\/products\/[^\/]+\/trace$/,
            /^\/cart\/(add-to-cart|get-cart|update-cart|checkout)$/,
            /^\/payment\/vnpay\/(create-payment-url|create-qr|return|ipn)$/
        ];
        
        if (publicPaths.includes(req.path)) {
            return next();
        }
        
        for (const pattern of publicPathPatterns) {
            if (pattern.test(req.path)) {
                return next();
            }
        }
        
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
        
        // Debug log trong development
        if (process.env.NODE_ENV === 'development' && req.path === '/api/upload') {
            console.log('🔍 Upload request debug:', {
                path: req.path,
                method: req.method,
                authHeader: authHeader ? (authHeader.substring(0, 20) + '...') : 'missing',
                token: token ? (token.substring(0, 20) + '...') : 'missing',
                hasAuthHeader: !!authHeader,
                headerKeys: Object.keys(req.headers).filter(k => k.toLowerCase().includes('auth'))
            });
        }
        
        if (!token) {
            // Debug log trong development
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ No token found in request:', {
                    path: req.path,
                    method: req.method,
                    authHeader: authHeader ? 'present' : 'missing',
                    authHeaderValue: authHeader ? (typeof authHeader === 'string' ? authHeader.substring(0, 50) : 'not string') : null,
                    allHeaders: Object.keys(req.headers),
                    authorizationHeader: req.headers.authorization,
                    AuthorizationHeader: req.headers.Authorization
                });
            }
            return errorResponse(res, 'Không có token', HTTP_STATUS.UNAUTHORIZED);
        }
        
        const decoded = verifyToken(token);
        if (!decoded) {
            if (req.cookies?.refreshToken) {
                res.clearCookie('refreshToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }
            if (req.headers.authorization) {
                delete req.headers.authorization;
            }
            res.setHeader('Authorization', '');
            return errorResponse(res, 'Token không hợp lệ hoặc hết hạn', HTTP_STATUS.UNAUTHORIZED);
        }
        
        const user = await TaiKhoan.findById(decoded.id)
            .select('-MatKhau -DiaChi')
            .populate('MaVaiTro', 'TenVaiTro MoTa');
        if (!user) {
            return errorResponse(res, MESSAGES.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
        }
        
        if (user.TrangThai !== 'active') {
            return errorResponse(res, 'Tài khoản đã bị khóa', HTTP_STATUS.UNAUTHORIZED);
        }
        
        req.user = user;
        if (!req.user.id) {
            req.user.id = req.user._id?.toString() || decoded.id;
        }
        next();
    } catch (error) {
        if (req.cookies?.refreshToken) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }

        if (req.headers.authorization) {
            delete req.headers.authorization;
        }

        res.setHeader('Authorization', '');

        return errorResponse(res, 'Token không hợp lệ hoặc hết hạn', HTTP_STATUS.UNAUTHORIZED);
    }
}

module.exports = authMiddleware;