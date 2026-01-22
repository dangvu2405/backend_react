const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * DepositRequest - Validation cho nạp tiền vào ví
 */
class DepositRequest extends BaseRequest {
    rules() {
        return Joi.object({
            userId: Joi.string()
                .optional()
                .pattern(/^[0-9a-fA-F]{24}$/) // ObjectId pattern
                .messages({
                    'string.pattern.base': 'UserId không hợp lệ'
                }),
            
            amount: Joi.number()
                .positive()
                .min(10000) // Tối thiểu 10,000 VNĐ
                .max(100000000) // Tối đa 100,000,000 VNĐ
                .required()
                .messages({
                    'number.base': 'Số tiền phải là số',
                    'number.positive': 'Số tiền phải lớn hơn 0',
                    'number.min': 'Số tiền nạp tối thiểu là 10,000 VNĐ',
                    'number.max': 'Số tiền nạp tối đa là 100,000,000 VNĐ',
                    'any.required': 'Số tiền nạp là bắt buộc'
                }),
            
            paymentMethod: Joi.string()
                .valid('vnpay', 'momo', 'bank', 'cash')
                .default('vnpay')
                .messages({
                    'any.only': 'Phương thức thanh toán không hợp lệ'
                }),
            
            transactionId: Joi.string()
                .optional()
                .allow('')
                .max(100)
                .messages({
                    'string.max': 'Mã giao dịch không được quá 100 ký tự'
                })
        });
    }
}

module.exports = DepositRequest;
