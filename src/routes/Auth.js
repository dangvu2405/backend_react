const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const TaiKhoanController = require('../app/controllers/TaiKhoanController');
const { passport } = require('../config/passport');

// Helper function để normalize frontend URL (xóa trailing slash)
const getFrontendUrl = () => {
    let url = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    return url.replace(/\/+$/, ''); // Xóa trailing slash
};

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.sendPasswordResetEmail);
router.post('/reset-password', TaiKhoanController.changePassword);

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

router.get('/google/callback',
    (req, res, next) => {
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
    },
    AuthController.oauthCallback
);

// OAuth error routes
router.get('/google/error', AuthController.oauthError);

module.exports = router;