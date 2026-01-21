const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * LoginRequest - Validation cho đăng nhập
 * 
 * Rules:
 * - username: required, string (có thể là email hoặc username)
 * - password: required, string
 */
class LoginRequest extends BaseRequest {
    rules() {
        return Joi.object({
            username: Joi.string()
                .required()
                .trim()
                .messages({
                    'string.empty': 'Tên đăng nhập hoặc email không được để trống',
                    'any.required': 'Tên đăng nhập hoặc email là bắt buộc'
                }),
            
            password: Joi.string()
                .required()
                .messages({
                    'string.empty': 'Mật khẩu không được để trống',
                    'any.required': 'Mật khẩu là bắt buộc'
                })
        });
    }

    attributes() {
        return {
            username: 'Tên đăng nhập/Email',
            password: 'Mật khẩu'
        };
    }
}

module.exports = LoginRequest;
