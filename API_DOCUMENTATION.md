# 📚 API Documentation

## 🔑 Authentication

### Base URL
```
http://localhost:3001
https://api.dtv2405.id.vn
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

---

## 👤 Auth Endpoints

### 1. Register
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "hoten": "Test User",
  "sdt": "0912345678"
}
```

**Validation Rules:**
- `username`: min 3, max 30, alphanumeric + underscore only, unique
- `email`: valid email format, unique
- `password`: min 8 characters
- `hoten`: min 2, max 100 characters
- `sdt`: exactly 10 digits

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo tài khoản thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "TenDangNhap": "testuser",
      "HoTen": "Test User",
      "Email": "test@example.com"
    }
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "email": ["Email đã được sử dụng"],
    "username": ["Tên đăng nhập đã tồn tại"]
  }
}
```

---

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "test@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "TenDangNhap": "testuser",
      "HoTen": "Test User",
      "Email": "test@example.com",
      "MaVaiTro": "507f1f77bcf86cd799439012"
    }
  }
}
```

---

### 3. Logout
**POST** `/auth/logout`

**Headers:** Requires `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### 4. Refresh Token
**POST** `/auth/refresh-token`

**Cookies:** Requires `refreshToken` cookie

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🛍️ Product Endpoints

### 1. Get All Products
**GET** `/api/products`

**Query Parameters:**
```
?page=1
&limit=10
&sortBy=createdAt
&sortOrder=desc
&category=507f1f77bcf86cd799439011
&minPrice=0
&maxPrice=1000000
&search=keyword
&inStock=true
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "TenSanPham": "Sản phẩm A",
      "MaLoaiSanPham": {
        "_id": "507f1f77bcf86cd799439012",
        "TenLoaiSanPham": "Danh mục A"
      },
      "Gia": 100000,
      "KhuyenMai": 10,
      "SoLuong": 50,
      "DaBan": 10,
      "MoTa": "Mô tả sản phẩm",
      "HinhAnhChinh": "https://...",
      "HinhAnhPhu": ["https://..."],
      "DungTich": 100,
      "DungTichOptions": [
        { "value": 100, "label": "100ml" }
      ],
      "createdAt": "2026-01-20T00:00:00.000Z",
      "updatedAt": "2026-01-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### 2. Get Product By ID
**GET** `/api/products/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy sản phẩm thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "TenSanPham": "Sản phẩm A",
    "MaLoaiSanPham": {
      "_id": "507f1f77bcf86cd799439012",
      "TenLoaiSanPham": "Danh mục A"
    },
    "Gia": 100000,
    "SoLuong": 50
  }
}
```

---

### 3. Create Product (Admin Only)
**POST** `/admin/products`

**Headers:** Requires `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "TenSanPham": "Sản phẩm mới",
  "MaLoaiSanPham": "507f1f77bcf86cd799439012",
  "Gia": 150000,
  "SoLuong": 100,
  "KhuyenMai": 15,
  "DungTich": 200,
  "MoTa": "Mô tả chi tiết",
  "HinhAnhChinh": "https://example.com/image.jpg",
  "HinhAnhPhu": ["https://example.com/image1.jpg"],
  "DungTichOptions": [
    { "value": 100, "label": "100ml" },
    { "value": 200, "label": "200ml" }
  ]
}
```

**Validation Rules:**
- `TenSanPham`: required, min 3, max 200
- `MaLoaiSanPham`: required, valid ObjectId
- `Gia`: required, number >= 0
- `SoLuong`: required, integer >= 0
- `KhuyenMai`: optional, number 0-100
- `DungTich`: optional, number >= 0

**Response (201):**
```json
{
  "success": true,
  "message": "Sản phẩm đã được tạo",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "TenSanPham": "Sản phẩm mới",
    "Gia": 150000
  }
}
```

---

### 4. Update Product (Admin Only)
**PUT** `/admin/products/:id`

**Headers:** Requires `Authorization: Bearer <admin_token>`

**Request Body:** (All fields optional)
```json
{
  "TenSanPham": "Sản phẩm đã cập nhật",
  "Gia": 180000,
  "SoLuong": 80
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sản phẩm đã được cập nhật",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "TenSanPham": "Sản phẩm đã cập nhật",
    "Gia": 180000
  }
}
```

---

### 5. Delete Product (Admin Only)
**DELETE** `/admin/products/:id`

**Headers:** Requires `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Sản phẩm đã được xóa"
}
```

---

## 📦 Category Endpoints

### 1. Get All Categories
**GET** `/api/categories`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "TenLoaiSanPham": "Danh mục A",
      "MoTa": "Mô tả danh mục",
      "HinhAnh": "https://...",
      "productCount": 25
    }
  ]
}
```

---

### 2. Create Category (Admin Only)
**POST** `/admin/categories`

**Request Body:**
```json
{
  "TenLoaiSanPham": "Danh mục mới",
  "MoTa": "Mô tả",
  "HinhAnh": "https://..."
}
```

---

## 🛒 Cart Endpoints

### 1. Get Cart
**GET** `/api/cart`

**Headers:** Requires `Authorization: Bearer <token>` (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "MaSanPham": {
          "_id": "507f1f77bcf86cd799439012",
          "TenSanPham": "Sản phẩm A",
          "Gia": 100000,
          "HinhAnhChinh": "https://..."
        },
        "SoLuong": 2,
        "DungTich": 100
      }
    ],
    "TongGia": 200000
  }
}
```

---

### 2. Add to Cart
**POST** `/api/add-to-cart`

**Request Body:**
```json
{
  "MaSanPham": "507f1f77bcf86cd799439012",
  "SoLuong": 2,
  "DungTich": 100
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Thêm vào giỏ hàng thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [...],
    "TongGia": 200000
  }
}
```

---

### 3. Update Cart
**POST** `/api/update-cart`

**Request Body:**
```json
{
  "MaSanPham": "507f1f77bcf86cd799439012",
  "SoLuong": 3
}
```

---

### 4. Delete from Cart
**DELETE** `/api/cart/:productId`

**Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa sản phẩm khỏi giỏ hàng"
}
```

---

## 📝 Order Endpoints

### 1. Checkout
**POST** `/api/checkout`

**Request Body:**
```json
{
  "DiaChiGiaoHang": "123 Đường ABC, Quận 1, TP.HCM",
  "SoDienThoai": "0912345678",
  "GhiChu": "Giao hàng buổi sáng",
  "PhuongThucThanhToan": "COD",
  "MaVoucher": "SALE20"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "MaDonHang": "DH20260120001",
    "TongTien": 180000,
    "TrangThai": "Chờ xác nhận",
    "items": [...]
  }
}
```

---

### 2. Get User Orders
**GET** `/api/orders`

**Headers:** Requires `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "MaDonHang": "DH20260120001",
      "TongTien": 180000,
      "TrangThai": "Đang giao hàng",
      "NgayDat": "2026-01-20T00:00:00.000Z",
      "items": [...]
    }
  ]
}
```

---

### 3. Get Order Details
**GET** `/api/orders/:id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "MaDonHang": "DH20260120001",
    "TongTien": 180000,
    "TrangThai": "Đang giao hàng",
    "DiaChiGiaoHang": "123 Đường ABC",
    "items": [
      {
        "MaSanPham": {...},
        "SoLuong": 2,
        "Gia": 100000
      }
    ]
  }
}
```

---

### 4. Cancel Order
**POST** `/api/orders/:id/cancel`

**Response (200):**
```json
{
  "success": true,
  "message": "Đơn hàng đã được hủy"
}
```

---

## ⭐ Review Endpoints

### 1. Create Review
**POST** `/api/reviews`

**Headers:** Requires `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "MaSanPham": "507f1f77bcf86cd799439012",
  "SoSao": 5,
  "NoiDung": "Sản phẩm rất tốt!",
  "HinhAnh": ["https://..."]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Đánh giá thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "SoSao": 5,
    "NoiDung": "Sản phẩm rất tốt!"
  }
}
```

---

### 2. Get Product Reviews
**GET** `/api/reviews/product/:productId`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "MaTaiKhoan": {
        "HoTen": "Nguyễn Văn A",
        "Avatar": "https://..."
      },
      "SoSao": 5,
      "NoiDung": "Sản phẩm rất tốt!",
      "NgayDanhGia": "2026-01-20T00:00:00.000Z"
    }
  ]
}
```

---

## ❤️ Wishlist Endpoints

### 1. Get Wishlist
**GET** `/api/wishlist`

**Headers:** Requires `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "TenSanPham": "Sản phẩm A",
        "Gia": 100000,
        "HinhAnhChinh": "https://..."
      }
    ]
  }
}
```

---

### 2. Add to Wishlist
**POST** `/api/wishlist/:productId`

**Response (200):**
```json
{
  "success": true,
  "message": "Đã thêm vào danh sách yêu thích"
}
```

---

### 3. Remove from Wishlist
**DELETE** `/api/wishlist/:productId`

**Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa khỏi danh sách yêu thích"
}
```

---

## 💬 Chat Endpoints

### 1. Get Chat Rooms
**GET** `/api/chat/rooms`

**Headers:** Requires `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "participants": [...],
      "lastMessage": "Hello",
      "unreadCount": 2,
      "updatedAt": "2026-01-20T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Messages
**GET** `/api/chat/rooms/:roomId/messages`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sender": {...},
      "content": "Hello",
      "createdAt": "2026-01-20T00:00:00.000Z"
    }
  ]
}
```

---

### 3. Send Message
**POST** `/api/chat/rooms/:roomId/messages`

**Request Body:**
```json
{
  "content": "Hello, how are you?"
}
```

---

## 👥 Admin Endpoints

### 1. Get Dashboard Stats
**GET** `/admin/dashboard`

**Headers:** Requires `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 10000000,
    "totalOrders": 150,
    "totalProducts": 50,
    "totalUsers": 200
  }
}
```

---

### 2. Get All Orders (Admin)
**GET** `/admin/orders`

**Query:** `?status=Chờ xác nhận&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

### 3. Update Order Status
**PUT** `/admin/orders/:id/status`

**Request Body:**
```json
{
  "TrangThai": "Đang giao hàng"
}
```

**Status values:**
- `Chờ xác nhận`
- `Đã xác nhận`
- `Đang giao hàng`
- `Đã giao hàng`
- `Đã hủy`

---

## 🔐 User Profile Endpoints

### 1. Get Profile
**GET** `/api/user/profile`

**Headers:** Requires `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "TenDangNhap": "testuser",
    "Email": "test@example.com",
    "HoTen": "Test User",
    "SoDienThoai": "0912345678",
    "DiaChi": "123 ABC Street"
  }
}
```

---

### 2. Update Profile
**PUT** `/api/user/profile`

**Request Body:**
```json
{
  "HoTen": "Updated Name",
  "SoDienThoai": "0987654321",
  "DiaChi": "New Address"
}
```

---

### 3. Change Password
**POST** `/api/user/change-password`

**Request Body:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

---

## 🎫 Voucher Endpoints

### 1. Get Available Vouchers
**GET** `/api/vouchers`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "MaVoucher": "SALE20",
      "GiamGia": 20,
      "MoTa": "Giảm 20% đơn hàng",
      "NgayBatDau": "2026-01-01",
      "NgayKetThuc": "2026-12-31",
      "SoLuong": 100
    }
  ]
}
```

---

### 2. Apply Voucher
**POST** `/api/vouchers/apply`

**Request Body:**
```json
{
  "MaVoucher": "SALE20",
  "TongTien": 200000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "discount": 40000,
    "finalAmount": 160000
  }
}
```

---

## 📤 File Upload

### Upload Image
**POST** `/api/upload`

**Headers:** 
```
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <image_file>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/..."
  }
}
```

---

## 🔔 WebSocket Events

### Connect
```javascript
const socket = io('ws://localhost:3001', {
  auth: { token: 'your_access_token' }
});
```

### Events

#### Join Room
```javascript
socket.emit('join-room', { roomId: '507f1f77bcf86cd799439011' });
```

#### Send Message
```javascript
socket.emit('send-message', {
  roomId: '507f1f77bcf86cd799439011',
  content: 'Hello!'
});
```

#### Receive Message
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

#### Order Status Update
```javascript
socket.on('order-status-updated', (data) => {
  console.log('Order updated:', data);
});
```

---

## 📊 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

---

## 🔒 Authentication Flow

1. **Register/Login** → Get `accessToken` + `refreshToken` (cookie)
2. **Use accessToken** in `Authorization: Bearer <token>` header
3. **When accessToken expires** → Call `/auth/refresh-token`
4. **Logout** → Call `/auth/logout` to invalidate tokens

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Pagination default: `page=1, limit=10`
- File uploads max size: 10MB
- Rate limiting: 100 requests/15 minutes per IP
- CORS enabled for configured origins only

---

**Last Updated**: 2026-01-21
**API Version**: 1.0
