const Joi = require('joi');
const { errorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../constants');

/**
 * BaseRequest - Class cơ sở cho tất cả Request validation
 * Tương tự FormRequest trong Laravel
 * 
 * Cách sử dụng:
 * 1. Tạo class kế thừa BaseRequest
 * 2. Override rules() để định nghĩa validation rules
 * 3. Override messages() để custom messages (optional)
 * 4. Override attributes() để custom tên trường (optional)
 */
class BaseRequest {
    /**
     * Constructor
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    constructor(req, res, next) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.property = 'body'; // Mặc định validate req.body
    }

    /**
     * Định nghĩa validation rules (Joi schema)
     * Phải được override trong class con
     * @returns {Object} Joi schema object
     */
    rules() {
        return Joi.object({});
    }

    /**
     * Custom messages cho validation
     * @returns {Object} Custom messages
     */
    messages() {
        return {};
    }

    /**
     * Custom tên hiển thị cho các trường (attributes)
     * @returns {Object} Attribute names
     */
    attributes() {
        return {};
    }

    /**
     * Xác định nguồn dữ liệu cần validate
     * @returns {string} 'body' | 'query' | 'params'
     */
    source() {
        return 'body';
    }

    /**
     * Thực hiện validation
     * @returns {Promise<boolean>}
     */
    async validate() {
        try {
            this.property = this.source();
            const schema = this.rules();
            
            // Thêm custom messages vào schema nếu có
            const customMessages = this.messages();
            
            const { error, value } = schema.validate(this.req[this.property], {
                abortEarly: false, // Trả về tất cả lỗi
                stripUnknown: true, // Loại bỏ các field không được khai báo
                messages: customMessages
            });

            if (error) {
                // Format lỗi theo chuẩn Laravel
                const errors = this.formatErrors(error);
                
                return errorResponse(
                    this.res,
                    'Dữ liệu không hợp lệ',
                    HTTP_STATUS.BAD_REQUEST,
                    errors
                );
            }

            // Gán dữ liệu đã được validate vào request
            this.req[this.property] = value;
            this.req.validated = value; // Thêm vào req.validated để dễ truy cập

            // Tiếp tục xử lý
            this.next();
            return true;

        } catch (err) {
            console.error('Validation error:', err);
            return errorResponse(
                this.res,
                'Lỗi khi xử lý validation',
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Format errors theo chuẩn Laravel
     * @param {Object} error - Joi error object
     * @returns {Object} Formatted errors
     */
    formatErrors(error) {
        const errors = {};
        const attributes = this.attributes();

        error.details.forEach((detail) => {
            const field = detail.path.join('.');
            const fieldName = attributes[field] || field;
            
            // Thay thế tên field trong message bằng attribute name
            let message = detail.message.replace(new RegExp(`"${field}"`, 'g'), fieldName);
            
            if (!errors[field]) {
                errors[field] = [];
            }
            errors[field].push(message);
        });

        return errors;
    }

    /**
     * Static method để tạo middleware từ Request class
     * @returns {Function} Express middleware
     */
    static handle() {
        return async (req, res, next) => {
            const instance = new this(req, res, next);
            await instance.validate();
        };
    }
}

module.exports = BaseRequest;
