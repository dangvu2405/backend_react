/**
 * ValidationError class - Custom error cho validation
 * Tương tự ValidationException trong Laravel
 */
class ValidationError extends Error {
    constructor(errors, message = 'Dữ liệu không hợp lệ') {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.errors = errors; // Object chứa errors theo field
        Error.captureStackTrace?.(this, this.constructor);
    }
}

module.exports = ValidationError;
