# ✅ VNPay Integration Implementation Checklist

## Quy trình tích hợp VNPay theo tài liệu

### ✅ Bước 1: Khách hàng thực hiện mua hàng
**Status**: ✅ Đã implement
- Frontend: `frontend/src/pages/Checkout.tsx`
- Khách hàng chọn phương thức thanh toán VNPay
- Tạo đơn hàng trong database

### ✅ Bước 2: Tạo URL thanh toán và chuyển hướng
**Status**: ✅ Đã implement
- **Backend**: `backend/src/app/controllers/VNPayController.js` → `createPaymentUrl()`
- **Frontend**: `frontend/src/services/cartService.ts` → `createVNPayUrl()`
- **Flow**:
  1. Frontend gọi API: `POST /api/payment/vnpay/create-payment-url`
  2. Backend tạo payment URL với đầy đủ params:
     - `vnp_TmnCode`: Mã merchant
     - `vnp_Amount`: Số tiền (xu)
     - `vnp_TxnRef`: Mã giao dịch
     - `vnp_OrderInfo`: Mô tả đơn hàng
     - `vnp_ReturnUrl`: URL redirect về sau thanh toán
     - `vnp_IpnUrl`: URL IPN để cập nhật kết quả
     - `vnp_SecureHash`: Chữ ký SHA512
  3. Backend trả về `paymentUrl`
  4. Frontend redirect khách hàng đến VNPay

**Files**:
- `backend/src/app/controllers/VNPayController.js` (line 14-330)
- `frontend/src/pages/Checkout.tsx` (line 345-358)

### ✅ Bước 3, 4: Khách hàng thanh toán trên VNPay
**Status**: ✅ VNPay xử lý (không cần code)
- Khách hàng nhập thông tin tài khoản/thẻ
- Hoặc quét mã VNPay-QR
- VNPay xử lý xác thực và thanh toán

### ✅ Bước 5: VNPay thông báo kết quả

#### 5a. Redirect về vnp_ReturnUrl (Browser)
**Status**: ✅ Đã implement
- **Backend**: `backend/src/app/controllers/VNPayController.js` → `vnpayReturn()`
- **Route**: `GET /api/payment/vnpay/return`
- **Flow**:
  1. VNPay redirect khách hàng về `vnp_ReturnUrl` với query params
  2. Backend xác minh signature
  3. Backend cập nhật trạng thái đơn hàng (nếu IPN chưa được gọi)
  4. Backend redirect về frontend với status: `?status=success` hoặc `?status=fail`
- **Frontend**: `frontend/src/pages/VNPayReturn.tsx`
  - Hiển thị kết quả thanh toán
  - Component: `PaymentSuccess` hoặc `PaymentFail`

**Files**:
- `backend/src/app/controllers/VNPayController.js` (line 549-618)
- `frontend/src/pages/VNPayReturn.tsx`

#### 5b. IPN URL (Server-to-Server)
**Status**: ✅ Đã implement
- **Backend**: `backend/src/app/controllers/VNPayController.js` → `vnpayIpn()`
- **Route**: `GET /api/payment/vnpay/ipn`
- **Flow**:
  1. VNPay gọi IPN URL từ server của họ
  2. Backend xác minh signature
  3. Backend cập nhật trạng thái đơn hàng trong database
  4. Backend trả về `{ RspCode: '00', Message: 'Success' }` cho VNPay
- **Lưu ý**: IPN được gọi độc lập với Return URL, đảm bảo cập nhật kết quả ngay cả khi khách hàng đóng browser

**Files**:
- `backend/src/app/controllers/VNPayController.js` (line 436-547)

### ✅ Bước 6: Hiển thị kết quả cho khách hàng
**Status**: ✅ Đã implement
- **Frontend**: `frontend/src/pages/VNPayReturn.tsx`
- Hiển thị:
  - ✅ Thành công: `PaymentSuccess` component
  - ❌ Thất bại: `PaymentFail` component với thông báo lỗi

## 📋 Checklist Implementation

### ✅ (1) Cài đặt code build URL thanh toán
- [x] `createPaymentUrl()` - Tạo URL thanh toán
- [x] `createQRCode()` - Tạo QR code thanh toán
- [x] Validate và normalize URLs
- [x] Tạo signature SHA512 đúng format
- [x] Sắp xếp params theo alphabet trước khi ký

### ✅ (2) Cài đặt code vnp_ReturnUrl
- [x] `vnpayReturn()` - Xử lý callback từ VNPay
- [x] Xác minh signature
- [x] Cập nhật trạng thái đơn hàng
- [x] Redirect về frontend với status
- [x] Frontend hiển thị kết quả

### ✅ (3) Cài đặt code IPN URL
- [x] `vnpayIpn()` - Xử lý IPN từ VNPay server
- [x] Xác minh signature
- [x] Cập nhật trạng thái đơn hàng
- [x] Trả về response đúng format cho VNPay
- [x] Xử lý duplicate IPN calls

## 🔧 Configuration

### Environment Variables (Render.com)
```yaml
VNPAY_TMN_CODE: <Mã merchant>
VNPAY_HASH_SECRET: <Secret key>
VNPAY_URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL: https://dtv2405.id.vn/payment/vnpay-return
VNPAY_IPN_URL: https://backend-ks46.onrender.com/api/payment/vnpay/ipn
FRONTEND_URL: https://dtv2405.id.vn
BACKEND_URL: https://backend-ks46.onrender.com
```

### Routes
- `POST /api/payment/vnpay/create-payment-url` - Tạo payment URL
- `POST /api/payment/vnpay/create-qr` - Tạo QR code
- `GET /api/payment/vnpay/return` - Return URL callback
- `GET /api/payment/vnpay/ipn` - IPN callback

## 🎯 Key Features Implemented

1. ✅ **URL Normalization**: Loại bỏ khoảng trắng, double slashes, localhost
2. ✅ **Signature Validation**: Xác minh SHA512 signature đúng cách
3. ✅ **Amount Validation**: Kiểm tra số tiền khớp với đơn hàng
4. ✅ **Duplicate Prevention**: Xử lý IPN được gọi nhiều lần
5. ✅ **Error Handling**: Xử lý lỗi và log chi tiết
6. ✅ **Production Ready**: Đảm bảo không dùng localhost trong production

## 📝 Notes

- IPN và Return URL đều cập nhật trạng thái đơn hàng để đảm bảo đồng bộ
- Return URL chỉ hiển thị kết quả, IPN là nguồn chính để cập nhật database
- Tất cả URLs đều được normalize để tránh lỗi format
- Signature được tính trên giá trị gốc (không encode), URL cuối cùng được encode

## 🚀 Next Steps

1. Test với VNPay sandbox
2. Đăng ký tài khoản production VNPay
3. Cập nhật env vars với thông tin production
4. Test end-to-end flow

