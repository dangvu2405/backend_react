const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const TaiKhoanController = require('../app/controllers/TaiKhoanController');
const { passport } = require('../config/passport');
const { authLimiter } = require('../app/middlewares/rateLimit.middleware');
const { LoginRequest, RegisterRequest } = require('../app/requests');

// Helper function để normalize frontend URL (xóa trailing slash)
const getFrontendUrl = () => {
    let url = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    return url.replace(/\/+$/, ''); // Xóa trailing slash
};

// ✅ Thêm rate limiting cho auth endpoints để chống brute force
// ✅ Sử dụng Request classes để validate

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Thông tin đăng nhập không hợp lệ
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
router.post('/login', authLimiter, LoginRequest.handle(), AuthController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - hoTen
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               hoTen:
 *                 type: string
 *                 example: Nguyễn Văn A
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/register', authLimiter, RegisterRequest.handle(), AuthController.register);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token được làm mới thành công
 *       401:
 *         description: Refresh token không hợp lệ
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Gửi email đặt lại mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi
 *       404:
 *         description: Email không tồn tại
 */
router.post('/forgot-password', authLimiter, AuthController.sendPasswordResetEmail);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset-token-here
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password', authLimiter, TaiKhoanController.changePassword);

// OAuth Routes - Google
router.get('/google', (req, res, next) => {
    // Kiểm tra credentials trước khi redirect
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
        !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth callback handler
const handleGoogleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Google OAuth authentication error:', err);
            // Kiểm tra lỗi invalid_client
            if (err.message && err.message.includes('invalid_client')) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                return res.redirect(`${frontendUrl}/login?error=google_invalid_client`);
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        if (!user) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        req.user = user;
        next();
    })(req, res, next);
};

// Standard callback route
router.get('/google/callback', handleGoogleCallback, AuthController.oauthCallback);

// Handle malformed callback URLs (e.g., /auth/google/domain.com/auth/callback)
// This route matches /google/:domain/auth/callback pattern
router.get('/google/:domain/auth/callback', handleGoogleCallback, AuthController.oauthCallback);

// OAuth error routes
router.get('/google/error', AuthController.oauthError);

// OAuth exchange endpoint - đổi code lấy token
router.post('/google/exchange', AuthController.oauthExchange);

module.exports = router;