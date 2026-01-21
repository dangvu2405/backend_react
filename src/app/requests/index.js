/**
 * Export tất cả Request classes
 */

// Auth Requests
const RegisterRequest = require('./Auth/RegisterRequest');
const LoginRequest = require('./Auth/LoginRequest');

// Product Requests
const StoreProductRequest = require('./Product/StoreProductRequest');
const UpdateProductRequest = require('./Product/UpdateProductRequest');

// Order Requests
const CheckoutRequest = require('./Order/CheckoutRequest');

module.exports = {
    // Auth
    RegisterRequest,
    LoginRequest,
    
    // Product
    StoreProductRequest,
    UpdateProductRequest,
    
    // Order
    CheckoutRequest,
};
