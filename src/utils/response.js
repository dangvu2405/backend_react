// Utility functions for API responses
const { transformResponseData, sanitizeObject } = require('./output.transformer');
const { formatBusinessError, createBusinessError } = require('./business.error');

/**
 * Success response - Chuẩn hóa output, loại bỏ field nhạy cảm
 * @param {Object} res - Express response object
 * @param {*} data - Data to send (sẽ được transform)
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} options - { transformType: 'auto'|'user'|'product'|'order'|'review', skipTransform: false }
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200, options = {}) => {
    const { transformType = 'auto', skipTransform = false } = options;
    
    // Transform data để loại bỏ field nhạy cảm
    let transformedData = data;
    if (!skipTransform && data !== null) {
        transformedData = transformResponseData(data, transformType);
    }
    
    return res.status(statusCode).json({
        success: true,
        message,
        data: transformedData,
    });
};

/**
 * Error response - Format chuẩn cho validation errors
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {*} errors - Validation errors (optional) - format: { field: [messages] }
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };

    // Validation errors format
    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Business error response - Format chuẩn cho lỗi nghiệp vụ
 * @param {Object} res - Express response object
 * @param {String} errorKey - Key trong BUSINESS_ERRORS
 * @param {Object} additionalData - { details, field, ... }
 */
const businessErrorResponse = (res, errorKey, additionalData = {}) => {
    return formatBusinessError(res, errorKey, additionalData);
};

/**
 * Paginated response - Chuẩn hóa output cho pagination
 * @param {Object} res - Express response object
 * @param {Array} data - Data array (sẽ được transform)
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @param {Object} options - { transformType: 'auto'|'user'|'product'|'order'|'review' }
 */
const paginatedResponse = (res, data, page, limit, total, options = {}) => {
    const { transformType = 'auto' } = options;
    
    // Transform data array
    const transformedData = transformResponseData(data, transformType);
    
    return res.status(200).json({
        success: true,
        data: transformedData,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
};

module.exports = {
    successResponse,
    errorResponse,
    businessErrorResponse,
    paginatedResponse,
};

