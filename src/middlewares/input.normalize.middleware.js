/**
 * Input Normalize Middleware
 * Tự động normalize input từ client trước khi vào controller
 */

const { normalizeObject, normalizeString, normalizeEmail, normalizePhone, normalizeNumber, normalizePagination, normalizeSort } = require('../utils/input.normalizer');

/**
 * Normalize request body
 */
const normalizeBody = (schema = {}) => {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            req.body = normalizeObject(req.body, schema);
        }
        next();
    };
};

/**
 * Normalize request query
 */
const normalizeQuery = (schema = {}) => {
    return (req, res, next) => {
        if (req.query && typeof req.query === 'object') {
            // Normalize pagination
            if (req.query.page || req.query.limit) {
                const pagination = normalizePagination(req.query);
                req.query.page = pagination.page;
                req.query.limit = pagination.limit;
            }
            
            // Normalize sort
            if (req.query.sortBy || req.query.sortOrder) {
                const allowedFields = schema.allowedSortFields || [];
                const sort = normalizeSort(req.query.sortBy, req.query.sortOrder, allowedFields);
                req.query.sortBy = sort.sortBy;
                req.query.sortOrder = sort.sortOrder;
            }
            
            // Normalize other fields
            req.query = normalizeObject(req.query, schema);
        }
        next();
    };
};

/**
 * Normalize request params
 */
const normalizeParams = (schema = {}) => {
    return (req, res, next) => {
        if (req.params && typeof req.params === 'object') {
            req.params = normalizeObject(req.params, schema);
        }
        next();
    };
};

/**
 * Auto normalize all inputs
 */
const normalizeAll = (schemas = {}) => {
    return (req, res, next) => {
        // Normalize body
        if (req.body && schemas.body) {
            req.body = normalizeObject(req.body, schemas.body);
        }
        
        // Normalize query
        if (req.query && schemas.query) {
            if (req.query.page || req.query.limit) {
                const pagination = normalizePagination(req.query);
                req.query.page = pagination.page;
                req.query.limit = pagination.limit;
            }
            
            if (req.query.sortBy || req.query.sortOrder) {
                const allowedFields = schemas.query.allowedSortFields || [];
                const sort = normalizeSort(req.query.sortBy, req.query.sortOrder, allowedFields);
                req.query.sortBy = sort.sortBy;
                req.query.sortOrder = sort.sortOrder;
            }
            
            req.query = normalizeObject(req.query, schemas.query);
        }
        
        // Normalize params
        if (req.params && schemas.params) {
            req.params = normalizeObject(req.params, schemas.params);
        }
        
        next();
    };
};

module.exports = {
    normalizeBody,
    normalizeQuery,
    normalizeParams,
    normalizeAll
};
