const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * UpdateProductRequest - Validation cho cập nhật sản phẩm
 * 
 * Rules:
 * - Tất cả fields đều optional (vì là update)
 * - Unique + ignore(id) được xử lý trong controller
 */
class UpdateProductRequest extends BaseRequest {
    rules() {
        return Joi.object({
            TenSanPham: Joi.string()
                .min(3)
                .max(200)
                .optional()
                .trim(),
            
            MaLoaiSanPham: Joi.string()
                .optional()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.pattern.base': 'Mã loại sản phẩm không hợp lệ'
                }),
            
            Gia: Joi.number()
                .min(0)
                .optional()
                .messages({
                    'number.min': 'Giá không được âm'
                }),
            
            SoLuong: Joi.number()
                .integer()
                .min(0)
                .optional()
                .messages({
                    'number.integer': 'Số lượng phải là số nguyên',
                    'number.min': 'Số lượng không được âm'
                }),
            
            KhuyenMai: Joi.number()
                .min(0)
                .max(100)
                .optional()
                .messages({
                    'number.min': 'Khuyến mãi không được âm',
                    'number.max': 'Khuyến mãi không được vượt quá 100%'
                }),
            
            DungTich: Joi.number()
                .min(0)
                .optional()
                .allow(null)
                .messages({
                    'number.min': 'Dung tích không được âm'
                }),
            
            MoTa: Joi.string()
                .max(2000)
                .optional()
                .allow(''),
            
            HinhAnhChinh: Joi.string()
                .uri()
                .optional()
                .allow('')
                .messages({
                    'string.uri': 'Hình ảnh chính phải là URL hợp lệ'
                }),
            
            HinhAnhPhu: Joi.array()
                .items(Joi.string().uri())
                .optional()
                .messages({
                    'array.base': 'Hình ảnh phụ phải là danh sách',
                    'string.uri': 'Hình ảnh phụ phải là URL hợp lệ'
                }),
            
            DungTichOptions: Joi.array()
                .items(
                    Joi.object({
                        value: Joi.number().min(0).required(),
                        label: Joi.string().optional()
                    })
                )
                .optional()
        }).min(1); // Ít nhất 1 field phải được cung cấp
    }

    messages() {
        return {
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật',
            'string.min': '{#label} phải có ít nhất {#limit} ký tự',
            'string.max': '{#label} không được quá {#limit} ký tự',
            'number.base': '{#label} phải là số',
            'number.min': '{#label} phải lớn hơn hoặc bằng {#limit}',
            'number.max': '{#label} phải nhỏ hơn hoặc bằng {#limit}',
        };
    }

    attributes() {
        return {
            TenSanPham: 'Tên sản phẩm',
            MaLoaiSanPham: 'Mã loại sản phẩm',
            Gia: 'Giá',
            SoLuong: 'Số lượng',
            KhuyenMai: 'Khuyến mãi',
            DungTich: 'Dung tích',
            MoTa: 'Mô tả',
            HinhAnhChinh: 'Hình ảnh chính',
            HinhAnhPhu: 'Hình ảnh phụ',
            DungTichOptions: 'Tùy chọn dung tích'
        };
    }
}

module.exports = UpdateProductRequest;
