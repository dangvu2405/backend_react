# 📋 HƯỚNG DẪN CHUẨN HÓA INPUT/OUTPUT API

## Tổng Quan

Hệ thống đã được chuẩn hóa theo chuẩn production e-commerce với các nguyên tắc:

1. **Validate + Normalize toàn bộ input** - Không tin dữ liệu client
2. **Output format thống nhất** - Loại bỏ field nhạy cảm
3. **Business error rõ ràng** - Tách biệt validation error và business error
4. **Backend là source of truth** - Tính toán lại tất cả từ DB

---

## 1. INPUT NORMALIZATION

### 1.1. Utility Functions

File: `src/utils/input.normalizer.js`

```javascript
const {
    normalizeString,    // Trim, loại bỏ khoảng trắng thừa
    normalizeEmail,     // Lowercase, trim
    normalizePhone,     // Chỉ giữ số
    normalizeNumber,    // Parse và validate
    normalizeObjectId,  // Validate ObjectId format
    normalizeArray,     // Đảm bảo là array
    normalizeObject,    // Normalize nested object
    sanitizeHtml,       // Loại bỏ script tags
    normalizePagination,// Normalize page, limit
    normalizeSort       // Validate sortBy trong whitelist
} = require('../utils/input.normalizer');
```

### 1.2. Sử Dụng Trong BaseRequest

BaseRequest tự động normalize input sau khi validate:

```javascript
// src/app/requests/Auth/LoginRequest.js
class LoginRequest extends BaseRequest {
    rules() {
        return Joi.object({
            username: Joi.string().required().trim(), // Joi tự động trim
            password: Joi.string().required()
        });
    }
    
    // Normalize sau khi validate
    async validate() {
        const result = await super.validate();
        if (result) {
            // Normalize email nếu là email
            if (this.req.validated.username.includes('@')) {
                this.req.validated.username = normalizeEmail(this.req.validated.username);
            }
        }
        return result;
    }
}
```

### 1.3. Normalize Middleware

```javascript
const { normalizeAll } = require('../middlewares/input.normalize.middleware');

// Sử dụng trong route
router.post('/api/endpoint', 
    normalizeAll({
        body: {
            email: { type: 'email' },
            phone: { type: 'phone' },
            name: { type: 'string' }
        },
        query: {
            page: { type: 'number', options: { integer: true, min: 1 } },
            allowedSortFields: ['createdAt', 'name']
        }
    }),
    Controller.action
);
```

---

## 2. OUTPUT TRANSFORMATION

### 2.1. Utility Functions

File: `src/utils/output.transformer.js`

```javascript
const {
    transformUser,      // Loại bỏ password, token
    transformProduct,   // Format product response
    transformOrder,     // Format order response
    transformReview,    // Format review response
    sanitizeObject,     // Generic sanitizer
    transformResponseData // Auto-detect và transform
} = require('../utils/output.transformer');
```

### 2.2. Sử Dụng Trong Controller

```javascript
const { successResponse, businessErrorResponse } = require('../../utils/response');
const { transformUser } = require('../../utils/output.transformer');

async login(req, res) {
    // ... business logic
    
    // ✅ Transform user để loại bỏ field nhạy cảm
    return successResponse(res, {
        accessToken: tokens.accessToken,
        user: transformUser(user)
    }, 'Đăng nhập thành công', HTTP_STATUS.OK, { skipTransform: true });
}
```

### 2.3. Response Options

```javascript
successResponse(res, data, message, statusCode, {
    transformType: 'auto' | 'user' | 'product' | 'order' | 'review',
    skipTransform: false // Nếu đã transform thủ công
});

paginatedResponse(res, data, page, limit, total, {
    transformType: 'product' // Transform từng item trong array
});
```

---

## 3. BUSINESS ERROR HANDLING

### 3.1. Business Error Codes

File: `src/utils/business.error.js`

```javascript
const { businessErrorResponse } = require('../../utils/response');

// Sử dụng
if (!product) {
    return businessErrorResponse(res, 'PRODUCT_NOT_FOUND');
}

if (product.TrangThai === 'deleted') {
    return businessErrorResponse(res, 'PRODUCT_DELETED');
}

// Với additional data
return businessErrorResponse(res, 'PRODUCT_IN_USE', {
    details: `Sản phẩm đang có trong ${count} đơn hàng`,
    field: 'productId'
});
```

### 3.2. Error Response Format

**Validation Error:**
```json
{
    "success": false,
    "message": "Dữ liệu không hợp lệ",
    "errors": {
        "email": ["Email không hợp lệ"],
        "password": ["Mật khẩu phải có ít nhất 8 ký tự"]
    }
}
```

**Business Error:**
```json
{
    "success": false,
    "error": {
        "code": "PROD_001",
        "message": "Sản phẩm không tồn tại",
        "details": "Sản phẩm với ID 123 không tìm thấy"
    }
}
```

---

## 4. CÁC NGUYÊN TẮC QUAN TRỌNG

### 4.1. Không Tin Dữ Liệu Client

```javascript
// ❌ SAI - Tin giá từ client
const finalTotal = req.body.TongTien;

// ✅ ĐÚNG - Tính lại từ backend
let calculatedTotal = 0;
for (const item of SanPham) {
    const product = await SanPham.findById(item.MaSanPham);
    calculatedTotal += product.Gia * item.SoLuong;
}
const finalTotal = calculatedTotal;
```

### 4.2. Loại Bỏ Field Nhạy Cảm

```javascript
// ❌ SAI - Trả về password
return successResponse(res, user);

// ✅ ĐÚNG - Transform user
return successResponse(res, transformUser(user), 'Success', 200, { transformType: 'user' });
```

### 4.3. Business Error Rõ Ràng

```javascript
// ❌ SAI - Generic error
return errorResponse(res, 'Lỗi', 400);

// ✅ ĐÚNG - Business error với code
return businessErrorResponse(res, 'PRODUCT_NOT_FOUND');
```

---

## 5. CHECKLIST CHO MỖI API

### 5.1. Input Validation

- [ ] Sử dụng BaseRequest hoặc Joi schema
- [ ] Normalize input (trim, lowercase email, etc.)
- [ ] Validate ObjectId format
- [ ] Validate enum values
- [ ] Validate range (min, max)

### 5.2. Business Logic

- [ ] Không tin dữ liệu từ client
- [ ] Tính toán lại từ DB
- [ ] Kiểm tra tồn tại resource
- [ ] Kiểm tra quyền truy cập
- [ ] Kiểm tra trạng thái hợp lệ

### 5.3. Output Format

- [ ] Transform data để loại bỏ field nhạy cảm
- [ ] Sử dụng businessErrorResponse cho lỗi nghiệp vụ
- [ ] Sử dụng errorResponse cho validation error
- [ ] Format thống nhất (success, message, data)
- [ ] Pagination format chuẩn

---

## 6. VÍ DỤ HOÀN CHỈNH

### 6.1. Controller với Full Standardization

```javascript
const { successResponse, businessErrorResponse, errorResponse } = require('../../utils/response');
const { transformProduct } = require('../../utils/output.transformer');

class ProductController {
    async getProduct(req, res) {
        try {
            const { id } = req.params; // Đã được validate bởi route
            
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Business logic - không tin client
            const product = await SanPham.findOne({ 
                _id: id,
                TrangThai: { $ne: 'deleted' }
            });
            
            if (!product) {
                return businessErrorResponse(res, 'PRODUCT_NOT_FOUND');
            }
            
            // Transform output
            return successResponse(res, product, 'Lấy sản phẩm thành công', HTTP_STATUS.OK, {
                transformType: 'product'
            });
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy sản phẩm', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}
```

---

## 7. MIGRATION CHECKLIST

Để áp dụng chuẩn hóa cho toàn bộ API:

1. **Cập nhật Controllers:**
   - Import `businessErrorResponse` và transformer functions
   - Thay `errorResponse` bằng `businessErrorResponse` cho business errors
   - Thêm `transformType` vào `successResponse` và `paginatedResponse`

2. **Cập nhật Requests:**
   - Thêm normalize logic vào BaseRequest nếu cần
   - Đảm bảo tất cả input được validate và normalize

3. **Test:**
   - Kiểm tra không có field nhạy cảm trong response
   - Kiểm tra business error format đúng
   - Kiểm tra validation error format đúng

---

**Tài liệu này sẽ được cập nhật khi có thay đổi.**
