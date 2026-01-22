# 📚 API Endpoints - Tất cả các API cho Frontend

**Base URL:** `http://localhost:3001`

---

## 🔐 Authentication APIs

### Đăng ký
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "hoTen": "Nguyễn Văn A"
}
```

### Đăng nhập
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Đăng xuất
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

### Quên mật khẩu
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Đặt lại mật khẩu
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "new_password"
}
```

---

## 📦 Projects APIs (Đồ Án) - Public GET

### 1. Lấy danh sách đồ án
```http
GET /api/projects?page=1&limit=10&search=keyword&category=id&subject=Web Development&level=Đại học&techStack=React&tags=tag1&minPrice=100000&maxPrice=1000000&sortBy=newest&featured=true
```

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số lượng mỗi trang (default: 10, max: 100)
- `search`: Từ khóa tìm kiếm
- `category`: ID danh mục (MaLoaiDoAn)
- `subject`: Môn học (Web Development, Mobile App, AI/ML, Full-stack, Backend, Frontend, Other)
- `level`: Cấp độ (Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ)
- `techStack`: Công nghệ
- `tags`: Tags
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `sortBy`: newest, price_asc, price_desc, popular, rating, downloads
- `featured`: true/false
- `status`: available (default)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 2. Lấy chi tiết đồ án
```http
GET /api/projects/:id
```

### 3. Lấy danh mục đồ án
```http
GET /api/project-categories?type=subject
```

**Query Parameters:**
- `type`: subject, level, format (optional)

### 4. Lấy top đồ án
```http
GET /api/projects/top?type=downloads&limit=10
```

### 5. Lấy đồ án tương tự
```http
GET /api/projects/:id/similar?limit=5
```

---

## 🎮 MMO Shop APIs - Public GET

### 1. Lấy danh sách sản phẩm MMO
```http
GET /api/mmo-shop/products?page=1&limit=20&category=gold&game=WoW&search=keyword&minPrice=100000&maxPrice=1000000&sortBy=newest&inStock=true
```

### 2. Lấy chi tiết sản phẩm MMO
```http
GET /api/mmo-shop/products/:id
```

### 3. Lấy danh sách games
```http
GET /api/mmo-shop/games
```

### 4. Lấy danh sách categories
```http
GET /api/mmo-shop/categories
```

---

## ⭐ Reviews APIs

### 1. Lấy thống kê đánh giá sản phẩm (Public)
```http
GET /api/reviews/product/:productId/stats
```

### 2. Lấy thống kê đánh giá đồ án (Public)
```http
GET /api/reviews/project/:projectId/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "avgRating": 4.5,
    "totalReviews": 10,
    "star5": 5,
    "star4": 3,
    "star3": 1,
    "star2": 1,
    "star1": 0
  }
}
```

### 3. Lấy danh sách đánh giá sản phẩm (Public)
```http
GET /api/reviews/product/:productId?page=1&limit=10
```

### 4. Lấy danh sách đánh giá đồ án (Public)
```http
GET /api/reviews/project/:projectId?page=1&limit=10
```

### 5. Tạo đánh giá (Cần Auth)
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "IdSanPham": "product_id", // hoặc "IdDoAn": "project_id"
  "NoiDung": "Nội dung đánh giá",
  "SoSao": 5,
  "LoaiSanPham": "DoAn" // hoặc "SanPham", "MMOProduct"
}
```

### 6. Lấy đánh giá của tôi (Cần Auth)
```http
GET /api/reviews/product/:productId/my-review
GET /api/reviews/my-reviews
Authorization: Bearer <token>
```

### 7. Cập nhật đánh giá (Cần Auth)
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "SoSao": 4,
  "NoiDung": "Nội dung cập nhật"
}
```

### 8. Xóa đánh giá (Cần Auth)
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

---

## 💰 Wallet APIs

### 1. Lấy số dư ví
```http
GET /api/wallet?userId=user_id
GET /api/wallet/me
Authorization: Bearer <token> (optional)
```

**Note:** Có thể dùng `userId` query param hoặc token

### 2. Nạp tiền vào ví
```http
POST /api/wallet/deposit
Content-Type: application/json

{
  "userId": "user_id", // optional nếu có token
  "amount": 100000,
  "paymentMethod": "vnpay", // vnpay, momo, bank, cash
  "transactionId": "optional"
}
```

### 3. Lấy lịch sử giao dịch
```http
GET /api/wallet/transactions?userId=user_id&page=1&limit=20&type=deposit&status=completed&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `userId`: ID user (optional)
- `page`: Số trang
- `limit`: Số lượng
- `type`: deposit, withdraw, refund, adjustment
- `status`: pending, completed, failed, cancelled
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

### 4. Thanh toán bằng ví (Cần Auth)
```http
POST /api/wallet/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "amount": 500000
}
```

### 5. Lấy thống kê giao dịch
```http
GET /api/wallet/statistics?userId=user_id&startDate=2024-01-01&endDate=2024-12-31
```

---

## 🛒 Cart APIs (Optional Auth)

### 1. Thêm vào giỏ hàng
```http
POST /cart/add-to-cart
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1,
  "loaiSP": "Product", // hoặc "MMO"
  "selectedDungTich": "optional"
}
```

### 2. Lấy giỏ hàng
```http
GET /cart/get-cart
```

### 3. Cập nhật giỏ hàng
```http
POST /cart/update-cart
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ]
}
```

### 4. Thanh toán (Checkout)
```http
POST /cart/checkout
Content-Type: application/json

{
  "diaChiGiaoHang": "Địa chỉ giao hàng",
  "ghiChu": "Ghi chú",
  "phuongThucThanhToan": "vnpay", // hoặc "wallet", "cod"
  "maVoucher": "optional_voucher_code"
}
```

---

## 👤 User APIs (Cần Auth)

### 1. Lấy thông tin user
```http
GET /user/me
Authorization: Bearer <token>
```

### 2. Cập nhật thông tin user
```http
PUT /user/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "hoTen": "Nguyễn Văn B",
  "soDienThoai": "0123456789"
}
```

### 3. Upload Avatar
```http
POST /user/uploadAvatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

### 4. Đổi mật khẩu
```http
POST /user/changepassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

### 5. Lấy danh sách đơn hàng
```http
GET /user/orderUser
Authorization: Bearer <token>
```

### 6. Xem chi tiết đơn hàng
```http
GET /user/orderUser/:id
Authorization: Bearer <token>
```

### 7. Hủy đơn hàng
```http
DELETE /user/orderUser/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "lyDo": "Lý do hủy đơn"
}
```

### 8. Quản lý địa chỉ
```http
GET /user/address
POST /user/address
PATCH /user/address/:id
DELETE /user/address/:id
Authorization: Bearer <token>
```

---

## 💬 Chat APIs (Cần Auth)

### 1. Lấy hoặc tạo phòng chat
```http
GET /chat/room
Authorization: Bearer <token>
```

### 2. Lấy thông tin phòng chat
```http
GET /chat/room/:chatRoomId
Authorization: Bearer <token>
```

### 3. Lấy tin nhắn
```http
GET /chat/room/:chatRoomId/messages?page=1&limit=50
Authorization: Bearer <token>
```

### 4. Đánh dấu đã đọc
```http
POST /chat/room/:chatRoomId/read
Authorization: Bearer <token>
```

---

## 💳 Payment APIs

### 1. Tạo thanh toán (Cần Auth)
```http
POST /payment/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentMethod": "vnpay" // hoặc "momo"
}
```

### 2. VNPay Callback
```http
GET /payment/vnpay-callback?vnp_ResponseCode=00&vnp_TxnRef=...
```

### 3. MoMo Callback
```http
GET /payment/momo-callback?resultCode=0&...
```

---

## 🔧 Admin APIs (Cần Auth + Admin Role)

**Tất cả routes admin đều cần:**
- `Authorization: Bearer <token>`
- User phải có role `Admin`

### Roles Management
```http
POST /admin/roles
GET /admin/roles
GET /admin/roles/:id
PUT /admin/roles/:id
DELETE /admin/roles/:id
```

### Users Management
```http
GET /admin/users/me
PUT /admin/users/me
DELETE /admin/users/me
POST /admin/users
GET /admin/users?page=1&limit=10&search=keyword&role=role_id
PUT /admin/users/:id
DELETE /admin/users/:id
```

### Customers Management
```http
GET /admin/customers?page=1&limit=10&search=keyword
PUT /admin/customers/:id
DELETE /admin/customers/:id
POST /admin/customers/:id/lock
POST /admin/customers/:id/change-role
```

### Orders Management
```http
GET /admin/orders?page=1&limit=10&status=pending&startDate=2024-01-01&endDate=2024-12-31
GET /admin/orders/:id
PUT /admin/orders/:id/status
GET /admin/orders/stats
```

### Wallet Management
```http
GET /admin/wallets?page=1&limit=10
GET /admin/wallets/:userId
POST /admin/wallets/:userId/adjust
GET /admin/wallets/transactions?page=1&limit=20&type=deposit&status=completed
GET /admin/wallets/statistics?startDate=2024-01-01&endDate=2024-12-31
```

### MMO Shop Management
```http
POST /admin/mmo-shop/products
GET /admin/mmo-shop/products?page=1&limit=20&status=active&game=WoW
PUT /admin/mmo-shop/products/:id
DELETE /admin/mmo-shop/products/:id
GET /admin/mmo-shop/stats
```

### Reviews Management
```http
GET /admin/reviews?page=1&limit=20&productId=product_id&rating=5
GET /admin/reviews/:id
PUT /admin/reviews/:id
DELETE /admin/reviews/:id
DELETE /admin/reviews (body: { "reviewIds": ["id1", "id2"] })
GET /admin/reviews/stats
```

### Vouchers Management
```http
POST /admin/vouchers
GET /admin/vouchers?page=1&limit=20&status=active
GET /admin/vouchers/stats
GET /admin/vouchers/:id
PUT /admin/vouchers/:id
DELETE /admin/vouchers/:id
```

### Statistics & Dashboard
```http
GET /admin/stats
GET /admin/stats/orders?startDate=2024-01-01&endDate=2024-12-31
GET /admin/stats/revenue?period=monthly&startDate=2024-01-01&endDate=2024-12-31
GET /admin/stats/users?period=monthly
```

---

## 📄 Other APIs

### Health Check
```http
GET /api/health
```

### Upload Image
```http
POST /api/upload
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}
```

---

## 🔑 Authentication

### Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### Cookie (tự động)
```http
Cookie: refreshToken=<refresh_token>
```

---

## 📝 Response Format

### Success
```json
{
  "success": true,
  "message": "Thông báo thành công",
  "data": { ... },
  "pagination": { // nếu có
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "error": "Chi tiết lỗi (development only)"
}
```

---

## 🚨 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📌 Public Routes (Không cần token)

- ✅ GET `/api/projects/*`
- ✅ GET `/api/mmo-shop/*`
- ✅ GET `/api/reviews/product/*` (trừ `/my-review`)
- ✅ GET `/api/reviews/project/*` (trừ `/my-review`)
- ✅ GET `/api/wallet` (có thể dùng `userId` query param)
- ✅ POST `/api/wallet/deposit` (có thể dùng `userId` trong body)
- ✅ GET `/api/wallet/transactions` (có thể dùng `userId` query param)
- ✅ GET `/api/wallet/statistics` (có thể dùng `userId` query param)

## 🔒 Protected Routes (Cần token)

- ❌ Tất cả `/user/*`
- ❌ Tất cả `/admin/*`
- ❌ Tất cả `/chat/*`
- ❌ POST `/api/reviews`
- ❌ POST `/api/wallet/pay`

## 🔓 Optional Auth (Guest hoặc User)

- ⚠️ `/cart/*`

---

## 💡 Example - Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy danh sách đồ án
const getProjects = async (params = {}) => {
  const response = await api.get('/api/projects', { params });
  return response.data;
};

// Lấy thống kê đánh giá đồ án
const getProjectRatingStats = async (projectId) => {
  const response = await api.get(`/api/reviews/project/${projectId}/stats`);
  return response.data;
};

// Lấy số dư ví
const getWalletBalance = async (userId = null) => {
  const response = await api.get('/api/wallet/me', {
    params: userId ? { userId } : {}
  });
  return response.data;
};

// Lấy lịch sử giao dịch
const getWalletTransactions = async (params = {}) => {
  const response = await api.get('/api/wallet/transactions', { params });
  return response.data;
};
```

---

**Last Updated:** 2024
**Version:** 1.0.0
