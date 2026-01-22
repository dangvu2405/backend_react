const TaiKhoan = require('../models/Taikhoan');
const { verifyToken } = require('../../utils/token');
const { errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../constants');


const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Danh sách các paths công khai (không cần token)
        const publicPaths = [
            '/',
            '/auth/login',
            '/auth/register',
            '/auth/refresh-token',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/google',
            '/auth/google/callback',
            '/auth/google/exchange',
            '/auth/google/error',
            '/api/health',
            '/api/docs',  // Swagger UI
            '/api/supply-chain/lookup',
            '/payment/vnpay/return'
        ];
        
        // ✅ Kiểm tra exact path match trước
        if (publicPaths.includes(req.path)) {
            return next();
        }
        
        // ✅ Exclude patterns - các routes này KHÔNG được public (cần auth)
        // Kiểm tra exclude patterns TRƯỚC public patterns
        const excludePatterns = [
            /^\/api\/reviews\/product\/[^\/]+\/my-review$/,  // Reviews của user - cần auth
            /^\/api\/reviews\/my-reviews$/,  // My reviews - cần auth
            /^\/api\/wallet\/pay$/,  // Wallet pay - cần auth
            /^\/admin\/.*$/,  // Tất cả admin routes - cần auth + admin role (trừ /admin/categories đã được handle ở publicGetOnlyPaths)
            /^\/user\/.*$/,  // Tất cả user routes - cần auth
            /^\/chat\/.*$/,  // Chat routes - cần auth
        ];
        
        // Nếu match exclude pattern, không cho phép public (cần auth)
        let isExcluded = false;
        for (const pattern of excludePatterns) {
            if (pattern.test(req.path)) {
                isExcluded = true;
                break;
            }
        }
        
        // ✅ Routes công khai chỉ cho GET requests (xem dữ liệu)
        const publicGetOnlyPaths = [
            // Products & Categories
            /^\/api\/products(?:\/[^\/]+)?$/,  // GET products - /api/products và /api/products/:id
            /^\/api\/categories(?:\/[^\/]+)?$/,  // GET categories - /api/categories và /api/categories/:id
            
            // Projects (DoAn) - Đồ án
            /^\/api\/projects(?:\/[^\/]+)?$/,  // GET projects - /api/projects và /api/projects/:id
            /^\/api\/project-categories(?:\/[^\/]+)?$/,  // GET project categories
            /^\/api\/projects\/.*$/,  // Tất cả routes đồ án (detail, search, filter, etc.)
            
            // Documents (Tài liệu)
            /^\/api\/documents(?:\/[^\/]+)?$/,  // GET documents - /api/documents và /api/documents/:id
            /^\/api\/documents\/.*$/,  // Tất cả routes tài liệu
            /^\/api\/files(?:\/[^\/]+)?$/,  // GET files - /api/files và /api/files/:id
            /^\/api\/files\/.*$/,  // Tất cả routes files
            /^\/api\/downloads\/.*$/,  // Download files (nếu có)
            
            // Academic Support (Hỗ trợ môn học)
            /^\/api\/support(?:\/[^\/]+)?$/,  // GET support - /api/support và /api/support/:id
            /^\/api\/support\/.*$/,  // Tất cả routes hỗ trợ
            /^\/api\/academic-support(?:\/[^\/]+)?$/,  // GET academic support
            /^\/api\/academic-support\/.*$/,  // Tất cả routes academic support
            /^\/api\/subjects(?:\/[^\/]+)?$/,  // GET subjects (môn học)
            /^\/api\/subjects\/.*$/,  // Tất cả routes subjects
            
            // MMO Shop
            /^\/api\/mmo-shop\/products(?:\/[^\/]+)?$/,  // GET MMO products - /api/mmo-shop/products và /api/mmo-shop/products/:id
            /^\/api\/mmo-shop\/games$/,  // GET MMO games
            /^\/api\/mmo-shop\/categories$/,  // GET MMO categories
            
            // Reviews (public - chỉ xem, không cần đăng nhập)
            // Lưu ý: /my-review cần auth nên không thêm vào đây
            /^\/api\/reviews\/product\/[^\/]+\/stats$/,  // GET product reviews stats
            /^\/api\/reviews\/product\/[^\/]+$/,  // GET product reviews list (không match /my-review vì có pattern khác trước)
            /^\/api\/reviews\/project\/[^\/]+\/stats$/,  // GET project reviews stats
            /^\/api\/reviews\/project\/[^\/]+$/,  // GET project reviews list
            
            // Admin public categories
            /^\/admin\/categories(?:\/[^\/]+)?$/,  // GET admin categories (public)
        ];
        
        // Nếu là GET request và match publicGetOnlyPaths, cho phép (không cần token)
        // NHƯNG phải check exclude patterns trước
        if (req.method === 'GET' && !isExcluded) {
            for (const pattern of publicGetOnlyPaths) {
                if (pattern.test(req.path)) {
                    return next();
                }
            }
        }
        
        // Nếu không bị exclude, kiểm tra public patterns
        if (!isExcluded) {
            // ✅ Patterns cho các routes công khai khác (không phụ thuộc method)
            const publicPathPatterns = [
                /^\/uploads\/.*$/,  // Static files - /uploads/*
                /^\/api\/docs/,  // Swagger UI và assets - /api/docs và /api/docs/*
                /^\/api\/health$/,  // Health check endpoint
                /^\/api\/supply-chain\/products\/[^\/]+\/trace$/,  // Supply chain trace
                /^\/cart\/(add-to-cart|get-cart|update-cart|checkout)$/,  // Cart routes (optional auth via optionalAuthMiddleware)
                /^\/payment\/vnpay\/(create-payment-url|create-qr|return|ipn)$/,  // VNPay routes
                /^\/payment\/(vnpay-callback|momo-callback)$/,  // Payment callbacks
                /^\/auth\/google\/.*\/callback$/,  // Google OAuth callback with any segments
            ];
            
            // Kiểm tra pattern match cho các routes công khai khác
            for (const pattern of publicPathPatterns) {
                if (pattern.test(req.path)) {
                    return next();
                }
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