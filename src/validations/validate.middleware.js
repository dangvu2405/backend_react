const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../constants');

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return errorResponse(
                res,
                'Dữ liệu không hợp lệ',
                HTTP_STATUS.BAD_REQUEST,
                errors
            );
        }

        // Replace request data with validated & sanitized data
        req[property] = value;
        next();
    };
};

module.exports = validate;

