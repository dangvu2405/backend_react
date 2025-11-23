/**
 * ✅ Error Handler Middleware
 * Xử lý tất cả lỗi trong ứng dụng
 */
const { errorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../constants');

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });
    
    // ✅ Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return errorResponse(res, 'Dữ liệu không hợp lệ', HTTP_STATUS.BAD_REQUEST, errors);
    }
    
    // ✅ Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return errorResponse(res, `${field} đã tồn tại`, HTTP_STATUS.BAD_REQUEST);
    }
    
    // ✅ Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return errorResponse(res, 'ID không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }
    
    // ✅ JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Token không hợp lệ', HTTP_STATUS.UNAUTHORIZED);
    }
    
    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token đã hết hạn', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // ✅ MongoDB connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
        return errorResponse(res, 'Lỗi kết nối database', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    
    // ✅ Default error
    return errorResponse(
        res,
        err.message || 'Lỗi server',
        err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
};

module.exports = errorHandler;

