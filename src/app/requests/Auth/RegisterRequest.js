const Joi = require('joi');
const BaseRequest = require('../BaseRequest');
const TaiKhoan = require('../../models/Taikhoan');

/**
 * RegisterRequest - Validation cho đăng ký tài khoản mới
 * 
 * Rules:
 * - username: required, string, min:3, max:30, pattern, unique
 * - email: required, email, unique
 * - password: required, string, min:8
 * - hoten: required, string, min:2, max:100
 * - sdt: required, string, pattern (10 chữ số)
 */
class RegisterRequest extends BaseRequest {
    rules() {
        return Joi.object({
            username: Joi.string()
                .min(3)
                .max(30)
                .required()
                .trim()
                .pattern(/^[a-zA-Z0-9_]+$/)
                .messages({
                    'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
                }),
            
            email: Joi.string()
                .email()
                .required()
                .trim()
                .lowercase()
                .messages({
                    'string.email': 'Email không hợp lệ'
                }),
            
            password: Joi.string()
                .min(8)
                .required()
                .messages({
                    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự'
                }),
            
            hoten: Joi.string()
                .min(2)
                .max(100)
                .required()
                .trim()
                .messages({
                    'string.min': 'Họ tên phải có ít nhất 2 ký tự',
                    'string.max': 'Họ tên không được quá 100 ký tự'
                }),
            
            sdt: Joi.string()
                .required()
                .pattern(/^[0-9]{10}$/)
                .messages({
                    'string.pattern.base': 'Số điện thoại phải có 10 chữ số'
                })
        });
    }

    messages() {
        return {
            'any.required': '{#label} là bắt buộc',
            'string.empty': '{#label} không được để trống',
            'string.min': '{#label} phải có ít nhất {#limit} ký tự',
            'string.max': '{#label} không được quá {#limit} ký tự',
        };
    }

    attributes() {
        return {
            username: 'Tên đăng nhập',
            email: 'Email',
            password: 'Mật khẩu',
            hoten: 'Họ tên',
            sdt: 'Số điện thoại'
        };
    }

    /**
     * Validation nâng cao: Kiểm tra unique cho email và username
     * Gọi sau khi Joi validation thành công
     */
    async validate() {
        // Gọi validation cơ bản từ BaseRequest
        const result = await super.validate();
        
        // Nếu validation cơ bản fail, return luôn
        if (result === false || !this.req.validated) {
            return;
        }

        // Kiểm tra unique cho email và username
        try {
            const { email, username } = this.req.validated;
            
            const existingUser = await TaiKhoan.findOne({
                $or: [
                    { Email: email.toLowerCase() },
                    { TenDangNhap: username }
                ]
            });

            if (existingUser) {
                const errors = {};
                
                if (existingUser.Email === email.toLowerCase()) {
                    errors.email = ['Email đã được sử dụng'];
                }
                
                if (existingUser.TenDangNhap === username) {
                    errors.username = ['Tên đăng nhập đã tồn tại'];
                }

                const { errorResponse } = require('../../../utils/response');
                const { HTTP_STATUS } = require('../../../constants');
                
                return errorResponse(
                    this.res,
                    'Dữ liệu không hợp lệ',
                    HTTP_STATUS.BAD_REQUEST,
                    errors
                );
            }

            // Nếu pass hết validation, tiếp tục
            return true;
            
        } catch (error) {
            console.error('Error checking unique fields:', error);
            
            const { errorResponse } = require('../../../utils/response');
            const { HTTP_STATUS } = require('../../../constants');
            
            return errorResponse(
                this.res,
                'Lỗi khi kiểm tra dữ liệu',
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = RegisterRequest;
