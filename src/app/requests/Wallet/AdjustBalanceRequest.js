const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * AdjustBalanceRequest - Validation cho admin điều chỉnh số dư
 */
class AdjustBalanceRequest extends BaseRequest {
    rules() {
        return Joi.object({
            amount: Joi.number()
                .required()
                .messages({
                    'number.base': 'Số tiền phải là số',
                    'any.required': 'Số tiền điều chỉnh là bắt buộc'
                }),
            
            reason: Joi.string()
                .required()
                .min(5)
                .max(500)
                .trim()
                .messages({
                    'string.empty': 'Lý do điều chỉnh không được để trống',
                    'string.min': 'Lý do điều chỉnh phải có ít nhất 5 ký tự',
                    'string.max': 'Lý do điều chỉnh không được quá 500 ký tự',
                    'any.required': 'Lý do điều chỉnh là bắt buộc'
                }),
            
            type: Joi.string()
                .valid('deposit', 'withdraw')
                .optional()
                .messages({
                    'any.only': 'Loại điều chỉnh không hợp lệ'
                })
        });
    }
}

module.exports = AdjustBalanceRequest;
