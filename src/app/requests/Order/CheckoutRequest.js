const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * CheckoutRequest - Validation cho checkout đơn hàng
 * 
 * ⚠️ QUAN TRỌNG:
 * - KHÔNG có field TongTien - backend sẽ tính lại từ DB
 * - Tất cả giá, tồn kho, tổng tiền được tính từ backend
 * - Backend là Single Source of Truth
 */
class CheckoutRequest extends BaseRequest {
    rules() {
        return Joi.object({
            // ❗ KHÔNG có TongTien - backend tính lại
            SanPham: Joi.array()
                .items(
                    Joi.object({
                        MaSanPham: Joi.string()
                            .pattern(/^[0-9a-fA-F]{24}$/)
                            .required()
                            .messages({
                                'string.pattern.base': 'Mã sản phẩm không hợp lệ',
                                'any.required': 'Mã sản phẩm là bắt buộc'
                            }),
                        SoLuong: Joi.number()
                            .integer()
                            .min(1)
                            .required()
                            .messages({
                                'number.integer': 'Số lượng phải là số nguyên',
                                'number.min': 'Số lượng phải lớn hơn 0',
                                'any.required': 'Số lượng là bắt buộc'
                            }),
                        selectedDungTich: Joi.object({
                            value: Joi.number().min(0).optional(),
                            label: Joi.string().optional()
                        }).optional()
                    })
                )
                .min(1)
                .required()
                .messages({
                    'array.min': 'Giỏ hàng phải có ít nhất 1 sản phẩm',
                    'any.required': 'Sản phẩm là bắt buộc'
                }),
            
            DiaChi: Joi.string()
                .trim()
                .min(10)
                .max(500)
                .required()
                .messages({
                    'string.min': 'Địa chỉ phải có ít nhất 10 ký tự',
                    'string.max': 'Địa chỉ không được quá 500 ký tự',
                    'any.required': 'Địa chỉ giao hàng là bắt buộc'
                }),
            
            PhuongThucThanhToan: Joi.string()
                .valid('COD', 'VNPay', 'VNPayQR', 'BANK', 'CARD', 'MoMo', 'Chuyển khoản')
                .required()
                .messages({
                    'any.only': 'Phương thức thanh toán không hợp lệ',
                    'any.required': 'Phương thức thanh toán là bắt buộc'
                }),
            
            GhiChu: Joi.string()
                .max(1000)
                .optional()
                .allow('')
                .messages({
                    'string.max': 'Ghi chú không được quá 1000 ký tự'
                }),
            
            Voucher: Joi.string()
                .optional()
                .allow(null),
            
            ThongTinNhanHang: Joi.object({
                HoTen: Joi.string().trim().min(2).max(100).optional(),
                Email: Joi.string().email().trim().lowercase().optional(),
                SoDienThoai: Joi.string().pattern(/^[0-9]{10}$/).optional(),
                DiaChiChiTiet: Joi.string().trim().optional(),
                PhuongXa: Joi.string().trim().optional(),
                QuanHuyen: Joi.string().trim().optional(),
                TinhThanh: Joi.string().trim().optional()
            }).optional()
        });
    }

    messages() {
        return {
            'any.required': '{#label} là bắt buộc',
            'string.empty': '{#label} không được để trống',
            'string.min': '{#label} phải có ít nhất {#limit} ký tự',
            'string.max': '{#label} không được quá {#limit} ký tự',
            'number.min': '{#label} phải lớn hơn hoặc bằng {#limit}',
            'array.min': '{#label} phải có ít nhất {#limit} phần tử'
        };
    }

    attributes() {
        return {
            SanPham: 'Sản phẩm',
            DiaChi: 'Địa chỉ giao hàng',
            PhuongThucThanhToan: 'Phương thức thanh toán',
            GhiChu: 'Ghi chú',
            Voucher: 'Mã giảm giá',
            ThongTinNhanHang: 'Thông tin nhận hàng'
        };
    }
}

module.exports = CheckoutRequest;
