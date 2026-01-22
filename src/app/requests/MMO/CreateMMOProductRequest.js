const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * CreateMMOProductRequest - Validation cho tạo sản phẩm MMO
 */
class CreateMMOProductRequest extends BaseRequest {
    rules() {
        return Joi.object({
            Ten: Joi.string()
                .trim()
                .min(1)
                .max(255)
                .required()
                .messages({
                    'string.base': 'Tên sản phẩm phải là chuỗi',
                    'string.empty': 'Tên sản phẩm không được để trống',
                    'string.min': 'Tên sản phẩm phải có ít nhất 1 ký tự',
                    'string.max': 'Tên sản phẩm không được quá 255 ký tự',
                    'any.required': 'Tên sản phẩm là bắt buộc'
                }),
            
            Loai: Joi.string()
                .valid('gold', 'items', 'accounts', 'services')
                .required()
                .messages({
                    'any.only': 'Loại sản phẩm phải là: gold, items, accounts, hoặc services',
                    'any.required': 'Loại sản phẩm là bắt buộc'
                }),
            
            Game: Joi.string()
                .trim()
                .min(1)
                .max(100)
                .required()
                .messages({
                    'string.base': 'Tên game phải là chuỗi',
                    'string.empty': 'Tên game không được để trống',
                    'string.min': 'Tên game phải có ít nhất 1 ký tự',
                    'string.max': 'Tên game không được quá 100 ký tự',
                    'any.required': 'Tên game là bắt buộc'
                }),
            
            Gia: Joi.number()
                .min(0)
                .required()
                .messages({
                    'number.base': 'Giá phải là số',
                    'number.min': 'Giá không được âm',
                    'any.required': 'Giá là bắt buộc'
                }),
            
            SoLuong: Joi.number()
                .integer()
                .min(0)
                .required()
                .messages({
                    'number.base': 'Số lượng phải là số',
                    'number.integer': 'Số lượng phải là số nguyên',
                    'number.min': 'Số lượng không được âm',
                    'any.required': 'Số lượng là bắt buộc'
                }),
            
            MoTa: Joi.string()
                .allow('')
                .max(5000)
                .optional()
                .messages({
                    'string.max': 'Mô tả không được quá 5000 ký tự'
                }),
            
            HinhAnh: Joi.string()
                .uri()
                .allow('')
                .optional()
                .messages({
                    'string.uri': 'Hình ảnh phải là URL hợp lệ'
                }),
            
            TrangThai: Joi.string()
                .valid('active', 'inactive')
                .optional()
                .default('active')
                .messages({
                    'any.only': 'Trạng thái phải là: active hoặc inactive'
                })
        });
    }

    attributes() {
        return {
            Ten: 'Tên sản phẩm',
            Loai: 'Loại sản phẩm',
            Game: 'Tên game',
            Gia: 'Giá',
            SoLuong: 'Số lượng',
            MoTa: 'Mô tả',
            HinhAnh: 'Hình ảnh',
            TrangThai: 'Trạng thái'
        };
    }
}

module.exports = CreateMMOProductRequest;
