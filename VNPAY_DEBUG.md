# 🔍 VNPay Debug Guide

## Các vấn đề đã sửa

### 1. ✅ URL Encoding
**Vấn đề**: Code đang encode thủ công rồi lại dùng `querystring.stringify` với `encode: false`, gây ra encoding không đúng.

**Sửa**: Sử dụng `querystring.stringify(vnp_Params, { encode: true })` để tự động encode đúng cách.

### 2. ✅ Return URL không đúng
**Vấn đề**: 
- `render.yaml` có `VNPAY_RETURN_URL = https://dtv2405.id.vn/vnpay-return`
- Frontend route là `/payment/vnpay-return`
- Backend redirect về `/vnpay-return` (thiếu `/payment`)

**Sửa**: Cập nhật `render.yaml`:
```yaml
VNPAY_RETURN_URL: https://dtv2405.id.vn/payment/vnpay-return
```

### 3. ✅ Thiếu BACKEND_URL
**Vấn đề**: IPN URL không có BACKEND_URL trong env vars.

**Sửa**: Thêm vào `render.yaml`:
```yaml
BACKEND_URL: https://backend-ks46.onrender.com
VNPAY_IPN_URL: https://backend-ks46.onrender.com/api/payment/vnpay/ipn
```

## Checklist kiểm tra

### Environment Variables (Render.com)
- [ ] `VNPAY_TMN_CODE` - Mã merchant (ví dụ: DEMOV210)
- [ ] `VNPAY_HASH_SECRET` - Secret key để ký signature
- [ ] `VNPAY_URL` - URL sandbox hoặc production
- [ ] `VNPAY_RETURN_URL` - URL redirect về frontend (phải có `/payment/vnpay-return`)
- [ ] `BACKEND_URL` - URL backend để tạo IPN URL
- [ ] `VNPAY_IPN_URL` - URL IPN (có thể tự động tạo từ BACKEND_URL)
- [ ] `FRONTEND_URL` - URL frontend

### Kiểm tra Request
1. **Order ID**: Phải là ObjectId hợp lệ
2. **Amount**: Phải khớp với tổng tiền đơn hàng (bao gồm phí vận chuyển)
3. **IP Address**: Phải có giá trị (không null)
4. **Create Date**: Format YYYYMMDDHHmmss (14 ký tự số)
5. **Transaction Ref**: Chỉ chứa chữ số, chữ cái và dấu gạch dưới
6. **Order Info**: Chỉ ASCII, không có tiếng Việt thô

### Kiểm tra Signature
1. Params phải được sắp xếp theo thứ tự alphabet trước khi ký
2. Query string để ký phải KHÔNG encode (`encode: false`)
3. Signature phải dùng SHA512 với HashSecret
4. URL cuối cùng phải encode các giá trị (`encode: true`)

## Test Steps

### 1. Test tạo Payment URL
```bash
POST /api/payment/vnpay/create-payment-url
{
  "orderId": "507f1f77bcf86cd799439011",
  "amount": 100000,
  "orderDescription": "Thanh toan don hang",
  "orderType": "other",
  "language": "vn"
}
```

**Kiểm tra response**:
- `paymentUrl` phải là URL hợp lệ
- URL phải chứa tất cả params cần thiết
- Signature phải được tính đúng

### 2. Test với VNPay Sandbox
1. Truy cập URL từ response
2. Kiểm tra VNPay có hiển thị form thanh toán không
3. Nếu báo "dữ liệu không hợp lệ", kiểm tra:
   - Console logs trong backend
   - Signature có đúng không
   - Params có đầy đủ không
   - Format các field có đúng không

### 3. Test Return URL
1. Sau khi thanh toán, VNPay redirect về Return URL
2. Kiểm tra frontend có nhận được params không
3. Kiểm tra backend có xử lý đúng không

### 4. Test IPN
1. VNPay sẽ gọi IPN URL sau khi thanh toán
2. Kiểm tra logs trong backend
3. Kiểm tra đơn hàng có được cập nhật không

## Common Errors

### "Dữ liệu không hợp lệ"
**Nguyên nhân có thể**:
1. Signature không đúng
2. Params thiếu hoặc sai format
3. URL encoding không đúng
4. Return URL hoặc IPN URL không hợp lệ

**Cách debug**:
1. Xem console logs trong backend
2. Kiểm tra từng param có đúng format không
3. So sánh signature với VNPay calculator (nếu có)
4. Kiểm tra env vars có đầy đủ không

### "Checksum failed"
**Nguyên nhân**: Signature không khớp

**Cách sửa**:
1. Kiểm tra HashSecret có đúng không
2. Kiểm tra params có được sắp xếp đúng không
3. Kiểm tra query string để ký có đúng không (không encode)

## Debug Logs

Code đã có các log chi tiết:
- `vnp_Params` trước khi ký
- `signData` (string để hash)
- `SecureHash` (signature)
- `vnpUrl` (URL cuối cùng)

Xem logs trong Render.com dashboard để debug.

