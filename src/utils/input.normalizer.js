/**
 * Input Normalizer - Chuẩn hóa input từ client
 * Không tin dữ liệu client, normalize tất cả input
 */

/**
 * Normalize string: trim, loại bỏ khoảng trắng thừa
 */
const normalizeString = (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
};

/**
 * Normalize email: lowercase, trim
 */
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    return email.toLowerCase().trim();
};

/**
 * Normalize phone number: chỉ giữ số
 */
const normalizePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return phone;
    return phone.replace(/\D/g, '');
};

/**
 * Normalize number: parse và validate
 */
const normalizeNumber = (value, options = {}) => {
    const { min, max, integer = false, defaultValue = null } = options;
    
    if (value === null || value === undefined) return defaultValue;
    
    const num = integer ? parseInt(value, 10) : parseFloat(value);
    
    if (isNaN(num)) return defaultValue;
    
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    
    return num;
};

/**
 * Normalize ObjectId: validate format
 */
const normalizeObjectId = (value) => {
    const mongoose = require('mongoose');
    if (!value) return null;
    if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return null;
};

/**
 * Normalize array: đảm bảo là array, filter null/undefined
 */
const normalizeArray = (value, itemNormalizer = null) => {
    if (!Array.isArray(value)) {
        return [];
    }
    
    if (itemNormalizer) {
        return value.map(itemNormalizer).filter(item => item !== null && item !== undefined);
    }
    
    return value.filter(item => item !== null && item !== undefined);
};

/**
 * Normalize object: loại bỏ null/undefined, normalize nested values
 */
const normalizeObject = (obj, schema = {}) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    
    const normalized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            continue; // Bỏ qua null/undefined
        }
        
        const fieldSchema = schema[key];
        
        if (fieldSchema) {
            if (fieldSchema.type === 'string') {
                normalized[key] = normalizeString(value);
            } else if (fieldSchema.type === 'email') {
                normalized[key] = normalizeEmail(value);
            } else if (fieldSchema.type === 'phone') {
                normalized[key] = normalizePhone(value);
            } else if (fieldSchema.type === 'number') {
                normalized[key] = normalizeNumber(value, fieldSchema.options || {});
            } else if (fieldSchema.type === 'objectId') {
                normalized[key] = normalizeObjectId(value);
            } else if (fieldSchema.type === 'array') {
                normalized[key] = normalizeArray(value, fieldSchema.itemNormalizer);
            } else if (fieldSchema.type === 'object') {
                normalized[key] = normalizeObject(value, fieldSchema.schema || {});
            } else {
                normalized[key] = value;
            }
        } else {
            // Không có schema, chỉ normalize string
            normalized[key] = typeof value === 'string' ? normalizeString(value) : value;
        }
    }
    
    return normalized;
};

/**
 * Sanitize HTML: loại bỏ script tags và dangerous content
 */
const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    
    // Loại bỏ script tags và các event handlers
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
};

/**
 * Normalize pagination params
 */
const normalizePagination = (query) => {
    return {
        page: Math.max(1, normalizeNumber(query.page, { integer: true, min: 1, defaultValue: 1 })),
        limit: Math.min(100, Math.max(1, normalizeNumber(query.limit, { integer: true, min: 1, max: 100, defaultValue: 10 }))),
        skip: 0 // Sẽ tính sau
    };
};

/**
 * Normalize sort params
 */
const normalizeSort = (sortBy, sortOrder, allowedFields = []) => {
    const normalizedOrder = sortOrder === 'asc' ? 1 : -1;
    
    // Validate sortBy trong whitelist
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
        return { sortBy: allowedFields[0] || 'createdAt', sortOrder: normalizedOrder };
    }
    
    return {
        sortBy: sortBy || 'createdAt',
        sortOrder: normalizedOrder
    };
};

module.exports = {
    normalizeString,
    normalizeEmail,
    normalizePhone,
    normalizeNumber,
    normalizeObjectId,
    normalizeArray,
    normalizeObject,
    sanitizeHtml,
    normalizePagination,
    normalizeSort
};
