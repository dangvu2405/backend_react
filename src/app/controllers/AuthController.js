const TaiKhoan = require('../models/Taikhoan');
const Role = require('../models/Role');
const Session = require('../models/Session');
const OAuthCode = require('../models/OAuthCode');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail, sendEmail } = require('../../utils/email');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateTokenPair, generateToken } = require('../../utils/token');
const { successResponse, errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, JWT } = require('../../constants');

const getFrontendUrl = () => {
    let url = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    return url.replace(/\/+$/, '');
};

class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return errorResponse(res, MESSAGES.ERROR, HTTP_STATUS.BAD_REQUEST);
            }
            
            const user = await TaiKhoan.findOne({
                $or: [{ Email: username.toLowerCase() }, { TenDangNhap: username }]
            });
            if (!user) {
                return errorResponse(res, MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
            }
            
            const isMatch = await comparePassword(password, user.MatKhau);
            if (!isMatch) {
                return errorResponse(res, MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
            }
            
            const tokens = generateTokenPair(user);
            const refreshToken = crypto.randomBytes(32).toString('hex');
            const session = await Session.create({
                userId: user._id,
                refreshToken: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            await session.save();
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });
            
            // ✅ Chuẩn hóa response format: chỉ trả accessToken trong data
            return successResponse(res, {
                accessToken: tokens.accessToken,
                user: {
                    id: user._id,
                    TenDangNhap: user.TenDangNhap,
                    HoTen: user.HoTen,
                    Email: user.Email,
                    MaVaiTro: user.MaVaiTro
                }
            }, 'Đăng nhập thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi đăng nhập: ', error);
            }
            return errorResponse(res, 'Lỗi khi đăng nhập', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async register(req, res) {
        try {
            const { hoten, username, email, password, sdt } = req.body;
            if (!hoten || !username || !email || !password || !sdt) {
                return errorResponse(res, 'Vui lòng nhập đầy đủ thông tin', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return errorResponse(res, 'Email không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate password strength (ít nhất 6 ký tự)
            if (password.length < 6) {
                return errorResponse(res, 'Mật khẩu phải có ít nhất 6 ký tự', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate username (ít nhất 3 ký tự, không có ký tự đặc biệt)
            if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
                return errorResponse(res, 'Tên đăng nhập phải có ít nhất 3 ký tự và chỉ chứa chữ cái, số, dấu gạch dưới', HTTP_STATUS.BAD_REQUEST);
            }
            
            const user = await TaiKhoan.findOne({ 
                $or: [{ Email: email.toLowerCase() }, { TenDangNhap: username }] 
            });
            if (user) {
                return errorResponse(res, MESSAGES.USER_EXISTS, HTTP_STATUS.BAD_REQUEST);
            }
            
            const customerRole = await Role.getCustomerRole();
            if (!customerRole) {
                return errorResponse(res, 'Không tìm thấy vai trò Customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            
            const hashedPassword = await hashPassword(password);
            const newUser = new TaiKhoan({ 
                HoTen: hoten, 
                TenDangNhap: username, 
                Email: email.toLowerCase(), 
                MatKhau: hashedPassword,
                MaVaiTro: customerRole._id,
                SoDienThoai: sdt
            });
            await newUser.save();
            
            try {
                await sendWelcomeEmail(newUser.Email, newUser.HoTen || newUser.TenDangNhap);
            } catch (emailError) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Lỗi khi gửi email chào mừng:', emailError);
                }
            }
            
            const tokens = generateTokenPair(newUser);
            const refreshToken = crypto.randomBytes(32).toString('hex');
            const session = await Session.create({
                userId: newUser._id,
                refreshToken: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            await session.save();
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });
            
            // ✅ Chuẩn hóa response format: chỉ trả accessToken trong data
            return successResponse(res, {
                accessToken: tokens.accessToken,
                user: {
                    id: newUser._id,
                    TenDangNhap: newUser.TenDangNhap,
                    HoTen: newUser.HoTen,
                    Email: newUser.Email
                }
            }, 'Tạo tài khoản thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi tạo tài khoản: ', error);
            }
            return errorResponse(res, 'Lỗi khi tạo tài khoản', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async logout(req, res) {
        try {
            const { refreshToken } = req.cookies;
            
            if (refreshToken) {
                try {
                    await Session.findOneAndDelete({ refreshToken });
                } catch (sessionError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Lỗi khi xóa session:', sessionError);
                    }
                }
            }
            
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });
            
            return successResponse(res, null, 'Đăng xuất thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi đăng xuất: ', error);
            }
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });
            return successResponse(res, null, 'Đăng xuất thành công', HTTP_STATUS.OK);
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return errorResponse(res, 'Không tìm thấy refresh token', HTTP_STATUS.UNAUTHORIZED);
            }
            
            const session = await Session.findOne({ refreshToken }).populate('userId');
            if (!session) {
                return errorResponse(res, 'Không tìm thấy session', HTTP_STATUS.UNAUTHORIZED);
            }
            if (session.expiresAt < Date.now()) {
                return errorResponse(res, 'Refresh token đã hết hạn', HTTP_STATUS.UNAUTHORIZED);
            }
            
            const user = await TaiKhoan.findById(session.userId);
            if (!user) {
                return errorResponse(res, MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            
            const tokens = generateTokenPair(user);
            // ✅ Chuẩn hóa response format: chỉ trả accessToken trong data
            return successResponse(res, {
                accessToken: tokens.accessToken
            }, 'Token đã được làm mới', HTTP_STATUS.OK);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi làm mới token: ', error);
            }
            return errorResponse(res, 'Lỗi khi làm mới token', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async sendEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return errorResponse(res, 'Vui lòng cung cấp email', HTTP_STATUS.BAD_REQUEST);
            }
            
            const result = await sendEmail(email, 'Xác nhận email', 'Xin chào, đây là email xác nhận từ hệ thống của chúng tôi');
            
            if (!result.success) {
                return errorResponse(res, 'Không thể gửi email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            
            return successResponse(res, null, 'Email đã được gửi', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi gửi email: ', error);
            }
            return errorResponse(res, 'Lỗi khi gửi email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async forgetPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await TaiKhoan.findOne({ Email: email });
            if (!user) {
                return errorResponse(res, MESSAGES.USER_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
            }
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save({ validateBeforeSave: false });
            
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;
            await sendPasswordResetEmail(user.Email, resetToken, resetUrl);
            
            return successResponse(res, null, 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn.', HTTP_STATUS.OK);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi quên mật khẩu: ', error);
            }
            return errorResponse(res, 'Lỗi khi quên mật khẩu', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async sendPasswordResetEmail(req, res) {
      try {
        const { email } = req.body;
        const user = await TaiKhoan.findOne({ Email: email.toLowerCase() });
        if (!user) {
          return successResponse(res, null, 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn.', HTTP_STATUS.OK);
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
    
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;
        await sendPasswordResetEmail(user.Email, resetToken, resetUrl);
    
        return successResponse(res, null, 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn.', HTTP_STATUS.OK);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
        }
        return errorResponse(res, 'Không thể gửi email đặt lại mật khẩu', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
    }
    async resetPassword(req, res) {
        try {
            const { password, token } = req.body;
            const resetToken = token || req.params.token;
            
            if (!resetToken || !password) {
                return errorResponse(res, 'Token và mật khẩu mới là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }
            
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const user = await TaiKhoan.findOne({ 
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: Date.now() }
            });
            
            if (!user) {
                return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', HTTP_STATUS.BAD_REQUEST);
            }
            
            user.MatKhau = await hashPassword(password);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            
            return successResponse(res, null, 'Đặt lại mật khẩu thành công', HTTP_STATUS.OK);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi đặt lại mật khẩu: ', error);
            }
            return errorResponse(res, 'Lỗi khi đặt lại mật khẩu', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    async oauthCallback(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                const frontendUrl = getFrontendUrl();
                return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
            }

            // Tạo OAuth code để đổi lấy token (code chỉ có hiệu lực 5 phút)
            const code = crypto.randomBytes(32).toString('hex');
            await OAuthCode.create({
                code: code,
                userId: user._id,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 phút
            });

            const frontendUrl = getFrontendUrl();
            const redirectUrl = `${frontendUrl}/auth/callback?code=${encodeURIComponent(code)}`;
            
            return res.redirect(redirectUrl);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xử lý OAuth callback: ', error);
            }
            const frontendUrl = getFrontendUrl();
            return res.redirect(`${frontendUrl}/login?error=oauth_error`);
        }
    }

    async oauthExchange(req, res) {
        try {
            const { code } = req.body;
            
            if (!code) {
                return errorResponse(res, 'Code là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }

            // Trim code để loại bỏ whitespace
            const trimmedCode = code.trim();
            
            if (process.env.NODE_ENV === 'development') {
                console.log('OAuth Exchange - Received code:', trimmedCode ? `${trimmedCode.substring(0, 20)}...` : 'missing');
                console.log('OAuth Exchange - Code length:', trimmedCode?.length);
            }

            // Tìm và xóa OAuth code
            const oauthCode = await OAuthCode.findOneAndDelete({ code: trimmedCode });
            
            if (!oauthCode) {
                if (process.env.NODE_ENV === 'development') {
                    // Kiểm tra xem code có tồn tại không (không xóa)
                    const existingCode = await OAuthCode.findOne({ code: trimmedCode });
                    console.log('OAuth Exchange - Code not found. Exists in DB:', !!existingCode);
                    if (existingCode) {
                        console.log('OAuth Exchange - Code expiresAt:', existingCode.expiresAt);
                        console.log('OAuth Exchange - Current time:', new Date());
                        console.log('OAuth Exchange - Is expired:', existingCode.expiresAt < new Date());
                    }
                }
                return errorResponse(res, 'Code không hợp lệ hoặc đã hết hạn', HTTP_STATUS.BAD_REQUEST);
            }

            // Kiểm tra code đã hết hạn chưa
            if (oauthCode.expiresAt < new Date()) {
                return errorResponse(res, 'Code đã hết hạn', HTTP_STATUS.BAD_REQUEST);
            }

            // Lấy user từ code
            const user = await TaiKhoan.findById(oauthCode.userId);
            if (!user) {
                return errorResponse(res, MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Tạo tokens
            const tokens = generateTokenPair(user);
            const refreshToken = crypto.randomBytes(32).toString('hex');
            const session = await Session.create({
                userId: user._id,
                refreshToken: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            await session.save();

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            // Trả về tokens
            return successResponse(res, {
                accessToken: tokens.accessToken,
                refreshToken: refreshToken,
                user: {
                    id: user._id,
                    TenDangNhap: user.TenDangNhap,
                    HoTen: user.HoTen,
                    Email: user.Email,
                    MaVaiTro: user.MaVaiTro
                }
            }, 'Đăng nhập thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi đổi OAuth code: ', error);
            }
            return errorResponse(res, 'Lỗi khi xử lý đăng nhập', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    async oauthError(req, res) {
        try {
            const frontendUrl = getFrontendUrl();
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xử lý OAuth error: ', error);
            }
            const frontendUrl = getFrontendUrl();
            return res.redirect(`${frontendUrl}/login?error=oauth_error`);
        }
    }

}
module.exports = new AuthController();