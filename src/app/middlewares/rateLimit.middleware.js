/**
 * ✅ Rate Limiting Middleware
 * Chống spam và DDoS attacks
 */
const rateLimit = require('express-rate-limit');

// ✅ Rate limit cho API chung
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Tối đa 100 requests
    message: {
        success: false,
        message: 'Quá nhiều requests, vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Bỏ qua rate limit cho health check
        return req.path === '/api/health';
    }
});

// ✅ Rate limit cho auth endpoints (đăng nhập, đăng ký)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // Tối đa 5 lần đăng nhập trong 15 phút
    message: {
        success: false,
        message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
    },
    skipSuccessfulRequests: true, // Chỉ đếm khi thất bại
    standardHeaders: true,
    legacyHeaders: false,
});

// ✅ Rate limit cho checkout (đặt hàng)
const checkoutLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 3, // Tối đa 3 đơn hàng/phút
    message: {
        success: false,
        message: 'Quá nhiều đơn hàng, vui lòng thử lại sau 1 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ✅ Rate limit cho review (đánh giá)
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 10, // Tối đa 10 đánh giá/giờ
    message: {
        success: false,
        message: 'Quá nhiều đánh giá, vui lòng thử lại sau 1 giờ'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ✅ Rate limit cho upload ảnh
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 5, // Tối đa 5 upload/phút
    message: {
        success: false,
        message: 'Quá nhiều upload, vui lòng thử lại sau 1 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    checkoutLimiter,
    reviewLimiter,
    uploadLimiter
};

