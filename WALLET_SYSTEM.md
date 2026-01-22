# 💰 Hệ thống Ví điện tử (Wallet System)

## 📋 Tổng quan

Hệ thống ví điện tử cho phép khách hàng:
- Nạp tiền vào ví
- Thanh toán đơn hàng bằng số dư ví
- Xem lịch sử giao dịch
- Admin quản lý ví khách hàng

## 🗄️ Database Models

### 1. Wallet Model (`/src/app/models/Wallet.js`)
Lưu số dư ví của mỗi khách hàng.

**Fields:**
- `MaNguoiDung` - ID người dùng (unique)
- `SoDu` - Số dư ví (default: 0)
- `TrangThai` - Trạng thái: active, frozen, suspended
- `GhiChu` - Ghi chú

**Methods:**
- `deposit(amount, transactionId)` - Nạp tiền
- `withdraw(amount, orderId)` - Rút tiền (thanh toán)
- `refund(amount, orderId, reason)` - Hoàn tiền
- `hasEnoughBalance(amount)` - Kiểm tra số dư

**Static Methods:**
- `getOrCreate(userId)` - Tạo hoặc lấy wallet
- `getByUserId(userId)` - Lấy wallet theo user ID

### 2. WalletTransaction Model (`/src/app/models/WalletTransaction.js`)
Lưu lịch sử giao dịch.

**Fields:**
- `MaVi` - ID ví
- `MaNguoiDung` - ID người dùng
- `Loai` - Loại: deposit, withdraw, refund, adjustment
- `SoTien` - Số tiền
- `SoDuTruoc` - Số dư trước giao dịch
- `SoDuSau` - Số dư sau giao dịch
- `TrangThai` - pending, completed, failed, cancelled
- `MaDonHang` - ID đơn hàng (nếu có)
- `PhuongThuc` - Phương thức: wallet, vnpay, momo, bank, cash, admin
- `MaGiaoDich` - Mã giao dịch từ payment gateway
- `MoTa` - Mô tả
- `NguoiThucHien` - ID người thực hiện (admin)

## 🔌 API Endpoints

### User Endpoints (Cần authentication)

#### 1. Lấy số dư ví
```
GET /api/wallet
```
**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000000,
    "status": "active",
    "walletId": "..."
  }
}
```

#### 2. Nạp tiền vào ví
```
POST /api/wallet/deposit
Body: {
  "amount": 500000,
  "paymentMethod": "vnpay",
  "transactionId": "optional"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 1500000,
      "previousBalance": 1000000
    },
    "transaction": {
      "id": "...",
      "amount": 500000,
      "status": "completed"
    }
  }
}
```

#### 3. Lấy lịch sử giao dịch
```
GET /api/wallet/transactions?page=1&limit=20&type=deposit&status=completed
```
**Query Parameters:**
- `page` - Trang (default: 1)
- `limit` - Số lượng mỗi trang (default: 20)
- `type` - Loại: deposit, withdraw, refund, adjustment
- `status` - Trạng thái: pending, completed, failed, cancelled
- `startDate` - Ngày bắt đầu (YYYY-MM-DD)
- `endDate` - Ngày kết thúc (YYYY-MM-DD)

#### 4. Thanh toán bằng ví
```
POST /api/wallet/pay
Body: {
  "orderId": "...",
  "amount": 500000
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 500000,
      "previousBalance": 1000000
    },
    "order": {
      "id": "...",
      "totalAmount": 500000,
      "paymentStatus": "paid"
    }
  }
}
```

#### 5. Thống kê giao dịch
```
GET /api/wallet/statistics?startDate=2024-01-01&endDate=2024-12-31
```

### Admin Endpoints (Cần admin role)

#### 1. Lấy danh sách tất cả ví
```
GET /admin/wallets?page=1&limit=20&search=john&status=active&minBalance=0&maxBalance=10000000
```

#### 2. Lấy chi tiết ví của user
```
GET /admin/wallets/:userId
```

#### 3. Điều chỉnh số dư ví
```
POST /admin/wallets/:userId/adjust
Body: {
  "amount": 100000,
  "reason": "Bồi thường lỗi hệ thống",
  "type": "deposit" // hoặc "withdraw"
}
```

#### 4. Khóa/Mở khóa ví
```
PUT /admin/wallets/:userId/status
Body: {
  "status": "frozen", // active, frozen, suspended
  "reason": "Nghi ngờ gian lận"
}
```

#### 5. Lấy lịch sử giao dịch của user
```
GET /admin/wallets/:userId/transactions?page=1&limit=20
```

#### 6. Thống kê tổng quan
```
GET /admin/wallets/statistics?startDate=2024-01-01&endDate=2024-12-31
```

## 💳 Thanh toán bằng ví trong Checkout

Khi checkout, có thể chọn `PhuongThucThanhToan: 'Wallet'`:

```javascript
POST /api/orders/checkout
Body: {
  "SanPham": [...],
  "TongTien": 500000,
  "PhuongThucThanhToan": "Wallet",
  "DiaChi": "...",
  ...
}
```

**Flow:**
1. Backend kiểm tra số dư ví
2. Nếu đủ, tạo order và trừ tiền từ ví ngay lập tức
3. Order status: `TrangThaiThanhToan: 'paid'`
4. Tạo transaction record

## 🔐 Security

- Tất cả endpoints cần authentication (trừ public endpoints)
- Admin endpoints cần admin role
- Wallet balance được kiểm tra trước mỗi transaction
- Transaction được log đầy đủ với IP, User Agent
- Admin điều chỉnh số dư phải có lý do

## 📝 Validation Rules

### Deposit
- Amount: 10,000 - 100,000,000 VNĐ
- Payment method: vnpay, momo, bank, cash

### Pay
- Order ID: Valid ObjectId
- Amount: Must match order total
- Balance: Must be sufficient

### Adjust Balance (Admin)
- Amount: Required, can be positive or negative
- Reason: Required, 5-500 characters

## 🚀 Usage Examples

### Frontend: Nạp tiền
```javascript
const response = await fetch('/api/wallet/deposit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 500000,
    paymentMethod: 'vnpay'
  })
});
```

### Frontend: Thanh toán bằng ví
```javascript
const response = await fetch('/api/wallet/pay', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: '...',
    amount: 500000
  })
});
```

### Frontend: Lấy số dư
```javascript
const response = await fetch('/api/wallet', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { balance } = response.data;
```

## ⚠️ Lưu ý

1. **Wallet tự động tạo**: Khi user đầu tiên truy cập wallet, hệ thống tự động tạo wallet với số dư 0
2. **Transaction atomicity**: Tất cả giao dịch được thực hiện trong transaction để đảm bảo consistency
3. **Balance check**: Luôn kiểm tra số dư trước khi rút tiền
4. **Payment gateway integration**: Hiện tại deposit đang simulate thành công. Cần integrate với VNPay/MoMo thực tế
5. **Refund**: Khi hủy đơn hàng đã thanh toán bằng ví, tiền sẽ được hoàn vào ví

## 🔄 Integration với Payment Gateway

Để tích hợp thực tế với VNPay/MoMo cho nạp tiền:

1. Trong `WalletController.deposit()`:
   - Tạo pending transaction
   - Gọi payment gateway để tạo payment URL
   - Return payment URL cho frontend
   - Frontend redirect đến payment gateway
   - Payment gateway callback → Update transaction status và wallet balance

2. Tạo callback endpoint:
   ```
   POST /api/wallet/deposit/callback
   ```
   - Verify payment gateway signature
   - Update transaction status
   - Update wallet balance

## 📊 Database Indexes

Các indexes đã được tạo để tối ưu query:
- Wallet: `MaNguoiDung` (unique), `TrangThai`
- WalletTransaction: `MaNguoiDung + createdAt`, `MaVi + createdAt`, `Loai`, `TrangThai`, `MaDonHang`, `MaGiaoDich`

## ✅ Testing

Test các scenarios:
1. Nạp tiền thành công
2. Nạp tiền với số dư không đủ (không áp dụng cho deposit)
3. Thanh toán bằng ví thành công
4. Thanh toán với số dư không đủ
5. Lấy lịch sử giao dịch
6. Admin điều chỉnh số dư
7. Admin khóa/mở khóa ví
