const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * UpdateMMOProductRequest - Validation cho cập nhật sản phẩm MMO
 */
class UpdateMMOProductRequest extends BaseRequest {
    rules() {
        return Joi.object({
            Ten: Joi.string()
                .trim()
                .min(1)
                .max(255)
                .optional()
                .messages({
                    'string.base': 'Tên sản phẩm phải là chuỗi',
                    'string.empty': 'Tên sản phẩm không được để trống',
                    'string.min': 'Tên sản phẩm phải có ít nhất 1 ký tự',
                    'string.max': 'Tên sản phẩm không được quá 255 ký tự'
                }),
            
            Loai: Joi.string()
                .valid('gold', 'items', 'accounts', 'services')
                .optional()
                .messages({
                    'any.only': 'Loại sản phẩm phải là: gold, items, accounts, hoặc services'
                }),
            
            Game: Joi.string()
                .trim()
                .min(1)
                .max(100)
                .optional()
                .messages({
                    'string.base': 'Tên game phải là chuỗi',
                    'string.empty': 'Tên game không được để trống',
                    'string.min': 'Tên game phải có ít nhất 1 ký tự',
                    'string.max': 'Tên game không được quá 100 ký tự'
                }),
            
            Gia: Joi.number()
                .min(0)
                .optional()
                .messages({
                    'number.base': 'Giá phải là số',
                    'number.min': 'Giá không được âm'
                }),
            
            SoLuong: Joi.number()
                .integer()
                .min(0)
                .optional()
                .messages({
                    'number.base': 'Số lượng phải là số',
                    'number.integer': 'Số lượng phải là số nguyên',
                    'number.min': 'Số lượng không được âm'
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
                .valid('active', 'inactive', 'out_of_stock')
                .optional()
                .messages({
                    'any.only': 'Trạng thái phải là: active, inactive, hoặc out_of_stock'
                })
        }).min(1).messages({
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
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

module.exports = UpdateMMOProductRequest;
