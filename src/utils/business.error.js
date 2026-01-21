/**
 * Business Error Messages - Lỗi nghiệp vụ rõ ràng
 * Tách biệt lỗi validation và lỗi nghiệp vụ
 */

const BUSINESS_ERRORS = {
    // Authentication
    INVALID_CREDENTIALS: {
        code: 'AUTH_001',
        message: 'Thông tin đăng nhập không đúng',
        statusCode: 401
    },
    ACCOUNT_LOCKED: {
        code: 'AUTH_002',
        message: 'Tài khoản đã bị khóa',
        statusCode: 403
    },
    TOKEN_EXPIRED: {
        code: 'AUTH_003',
        message: 'Token đã hết hạn',
        statusCode: 401
    },
    TOKEN_INVALID: {
        code: 'AUTH_004',
        message: 'Token không hợp lệ',
        statusCode: 401
    },
    REFRESH_TOKEN_REUSED: {
        code: 'AUTH_005',
        message: 'Refresh token đã được sử dụng',
        statusCode: 401
    },
    
    // Product
    PRODUCT_NOT_FOUND: {
        code: 'PROD_001',
        message: 'Sản phẩm không tồn tại',
        statusCode: 404
    },
    PRODUCT_OUT_OF_STOCK: {
        code: 'PROD_002',
        message: 'Sản phẩm không đủ hàng trong kho',
        statusCode: 400
    },
    PRODUCT_IN_USE: {
        code: 'PROD_003',
        message: 'Sản phẩm đang có trong đơn hàng chưa hoàn thành',
        statusCode: 400
    },
    PRODUCT_DELETED: {
        code: 'PROD_004',
        message: 'Sản phẩm đã bị xóa',
        statusCode: 404
    },
    
    // Order
    ORDER_NOT_FOUND: {
        code: 'ORDER_001',
        message: 'Đơn hàng không tồn tại',
        statusCode: 404
    },
    ORDER_CANNOT_CANCEL: {
        code: 'ORDER_002',
        message: 'Đơn hàng không thể hủy ở trạng thái này',
        statusCode: 400
    },
    ORDER_ALREADY_CANCELLED: {
        code: 'ORDER_003',
        message: 'Đơn hàng đã được hủy trước đó',
        statusCode: 400
    },
    ORDER_TOTAL_MISMATCH: {
        code: 'ORDER_004',
        message: 'Tổng tiền không khớp. Backend là nguồn sự thật duy nhất',
        statusCode: 400
    },
    CART_EMPTY: {
        code: 'ORDER_005',
        message: 'Giỏ hàng trống',
        statusCode: 400
    },
    INSUFFICIENT_STOCK: {
        code: 'ORDER_006',
        message: 'Không đủ hàng trong kho',
        statusCode: 400
    },
    
    // Review
    REVIEW_NOT_FOUND: {
        code: 'REVIEW_001',
        message: 'Đánh giá không tồn tại',
        statusCode: 404
    },
    REVIEW_ALREADY_EXISTS: {
        code: 'REVIEW_002',
        message: 'Bạn đã đánh giá sản phẩm này',
        statusCode: 400
    },
    REVIEW_NOT_PURCHASED: {
        code: 'REVIEW_003',
        message: 'Bạn cần mua và nhận hàng trước khi đánh giá',
        statusCode: 400
    },
    
    // Permission
    PERMISSION_DENIED: {
        code: 'PERM_001',
        message: 'Bạn không có quyền thực hiện hành động này',
        statusCode: 403
    },
    ADMIN_ONLY: {
        code: 'PERM_002',
        message: 'Chỉ admin mới có quyền truy cập',
        statusCode: 403
    },
    OWNER_ONLY: {
        code: 'PERM_003',
        message: 'Chỉ chủ sở hữu mới có quyền truy cập',
        statusCode: 403
    },
    
    // General
    RESOURCE_NOT_FOUND: {
        code: 'GEN_001',
        message: 'Không tìm thấy tài nguyên',
        statusCode: 404
    },
    OPERATION_FAILED: {
        code: 'GEN_002',
        message: 'Thao tác thất bại',
        statusCode: 500
    },
    INVALID_STATE: {
        code: 'GEN_003',
        message: 'Trạng thái không hợp lệ',
        statusCode: 400
    }
};

/**
 * Tạo business error response
 */
const createBusinessError = (errorKey, additionalData = {}) => {
    const error = BUSINESS_ERRORS[errorKey];
    
    if (!error) {
        return {
            code: 'UNKNOWN',
            message: 'Lỗi không xác định',
            statusCode: 500,
            ...additionalData
        };
    }
    
    return {
        ...error,
        ...additionalData
    };
};

/**
 * Format business error response
 */
const formatBusinessError = (res, errorKey, additionalData = {}) => {
    const error = createBusinessError(errorKey, additionalData);
    
    return res.status(error.statusCode).json({
        success: false,
        error: {
            code: error.code,
            message: error.message,
            ...(additionalData.details && { details: additionalData.details }),
            ...(additionalData.field && { field: additionalData.field })
        }
    });
};

module.exports = {
    BUSINESS_ERRORS,
    createBusinessError,
    formatBusinessError
};
