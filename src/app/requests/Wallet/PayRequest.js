const Joi = require('joi');
const BaseRequest = require('../BaseRequest');

/**
 * PayRequest - Validation cho thanh toán bằng ví
 */
class PayRequest extends BaseRequest {
    rules() {
        return Joi.object({
            orderId: Joi.string()
                .required()
                .pattern(/^[0-9a-fA-F]{24}$/) // ObjectId pattern
                .messages({
                    'string.pattern.base': 'ID đơn hàng không hợp lệ',
                    'any.required': 'ID đơn hàng là bắt buộc'
                }),
            
            amount: Joi.number()
                .positive()
                .required()
                .messages({
                    'number.base': 'Số tiền phải là số',
                    'number.positive': 'Số tiền phải lớn hơn 0',
                    'any.required': 'Số tiền thanh toán là bắt buộc'
                })
        });
    }
}

module.exports = PayRequest;
