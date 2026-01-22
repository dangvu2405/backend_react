const Joi = require('joi');
const BaseRequest = require('../BaseRequest');
// SanPham model đã bị xóa - không còn sử dụng

/**
 * StoreProductRequest - Validation cho tạo sản phẩm mới
 * 
 * Rules:
 * - TenSanPham: required, string, min:3, max:200
 * - MaLoaiSanPham: required, ObjectId
 * - Gia: required, number, min:0
 * - SoLuong: required, integer, min:0
 * - KhuyenMai: optional, number, min:0, max:100
 * - DungTich: optional, number, min:0
 * - MoTa: optional, string, max:2000
 * - HinhAnhChinh: optional, string, uri
 * - HinhAnhPhu: optional, array of uri
 * - DungTichOptions: optional, array
 */
class StoreProductRequest extends BaseRequest {
    rules() {
        return Joi.object({
            TenSanPham: Joi.string()
                .min(3)
                .max(200)
                .required()
                .trim(),
            
            MaLoaiSanPham: Joi.string()
                .required()
                .pattern(/^[0-9a-fA-F]{24}$/) // ObjectId pattern
                .messages({
                    'string.pattern.base': 'Mã loại sản phẩm không hợp lệ'
                }),
            
            Gia: Joi.number()
                .min(0)
                .required()
                .messages({
                    'number.min': 'Giá không được âm'
                }),
            
            SoLuong: Joi.number()
                .integer()
                .min(0)
                .required()
                .messages({
                    'number.integer': 'Số lượng phải là số nguyên',
                    'number.min': 'Số lượng không được âm'
                }),
            
            KhuyenMai: Joi.number()
                .min(0)
                .max(100)
                .optional()
                .default(0)
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
                .allow('')
                .default('')
                .messages({
                    'string.max': 'Mô tả không được quá 2000 ký tự'
                }),
            
            HinhAnhChinh: Joi.string()
                .uri()
                .optional()
                .allow('')
                .default('')
                .messages({
                    'string.uri': 'Hình ảnh chính phải là URL hợp lệ'
                }),
            
            HinhAnhPhu: Joi.array()
                .items(Joi.string().uri())
                .optional()
                .default([])
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
                .default([])
        });
    }

    messages() {
        return {
            'any.required': '{#label} là bắt buộc',
            'string.empty': '{#label} không được để trống',
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

module.exports = StoreProductRequest;
