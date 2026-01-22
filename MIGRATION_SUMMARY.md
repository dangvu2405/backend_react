# 📋 Tóm tắt Migration: Nước Hoa → Đồ Án

## ✅ Đã hoàn thành

### 1. Models mới đã tạo:

#### `/src/app/models/DoAn.js`
- Model chính thay thế `SanPham`
- Fields: TieuDe, MonHoc, CapDo, TinhNang, CongNghe, BaoGom, AnhPreview, LinkDemo, DiemSo, NamThucHien, Truong, Tags, SoLuotTai, DanhGia, etc.
- Methods: search, findByCategory, findBySubject, findByTechStack, getMostDownloaded, getTopRated, getSimilar, etc.

#### `/src/app/models/LoaiDoAn.js`
- Model thay thế `LoaiSanPham`
- Fields: TenLoaiDoAn, Loai (subject/level/format), MaLoaiCha, etc.
- Methods: findByType, findChildren, etc.

#### `/src/app/models/Download.js`
- Track các lượt download
- Fields: MaDonHangItem, MaNguoiDung, MaDoAn, DiaChiIP, UserAgent, etc.

#### `/src/app/models/DoAnFile.js`
- Quản lý files của đồ án
- Fields: MaDoAn, TenFile, DuongDan, LoaiFile (source/database/docs/images), KichThuoc, etc.

### 2. Models đã cập nhật:

#### `/src/app/models/DonHang.js`
- ✅ Thêm field `DoAn[]` (array đồ án)
- ✅ Thêm field `EmailNhanFile` (thay thế DiaChi cho đồ án)
- ✅ Thêm field `HetHanTai`, `DaGuiEmail`, `NgayGuiEmail`
- ✅ Cập nhật TrangThai: thêm 'sent', 'downloaded'
- ✅ Methods mới: `markAsSent()`, `markAsDownloaded()`
- ✅ Giữ backward compatibility với `SanPham[]`

### 3. Services đã tạo:

#### `/src/app/services/DownloadService.js`
- `generateDownloadLink()` - Tạo JWT token cho download
- `verifyAndDownload()` - Verify và log download
- `generateOrderDownloadLinks()` - Generate links cho toàn bộ order
- `getDownloadStats()` - Thống kê downloads

## 🔄 Cần làm tiếp

### 1. Controllers

#### Tạo `/src/app/controllers/DoAnController.js`
Các methods cần có:
- `createProject()` - Tạo đồ án mới
- `getProject()` - Lấy chi tiết đồ án
- `getAllProjects()` - Lấy danh sách với filter (subject, techStack, level, tags, etc.)
- `updateProject()` - Cập nhật đồ án
- `deleteProject()` - Xóa đồ án (soft delete)
- `getSimilarProjects()` - Lấy đồ án tương tự
- `getBySubject()` - Lấy theo môn học
- `getByTechStack()` - Lấy theo công nghệ
- `getMostDownloaded()` - Top downloaded
- `getTopRated()` - Top rated
- `incrementDownload()` - Tăng số lượt tải

#### Cập nhật `/src/app/controllers/DonHangController.js`
- Cập nhật `createOrder()` để:
  - Nhận `EmailNhanFile` thay vì `DiaChi`
  - Generate download links sau khi thanh toán thành công
  - Gửi email với download links
  - Set `TrangThai = 'sent'`
- Thêm method `generateDownloadLinks()`
- Thêm method `sendDownloadEmail()`

#### Tạo `/src/app/controllers/DownloadController.js`
- `download()` - Handle download request với token
- `verifyToken()` - Verify download token

### 2. Validation Requests

#### Tạo `/src/app/requests/Project/StoreProjectRequest.js`
Validation cho:
- TieuDe (required, min:2, max:200)
- MaLoaiDoAn (required, ObjectId)
- MonHoc (required, enum)
- CapDo (required, enum)
- Gia (required, min:0)
- TinhNang (array, max:50)
- CongNghe (array, max:30)
- BaoGom (array, max:20)
- AnhPreview (array, max:10)
- LinkDemo (optional, URL)
- DiemSo (optional, string)
- NamThucHien (optional, number)
- Truong (optional, string)
- Tags (array, max:20)
- MoTa (optional, max:5000)

#### Tạo `/src/app/requests/Project/UpdateProjectRequest.js`
Similar to StoreProjectRequest but all fields optional

### 3. Routes

#### Tạo `/src/routes/projects.js` (mới)
```javascript
router.get('/projects', DoAnController.getAllProjects);
router.get('/projects/:id', DoAnController.getProject);
router.get('/projects/subject/:subject', DoAnController.getBySubject);
router.get('/projects/tech/:tech', DoAnController.getByTechStack);
router.get('/projects/:id/similar', DoAnController.getSimilarProjects);
router.post('/projects', authMiddleware, StoreProjectRequest.handle(), DoAnController.createProject);
router.put('/projects/:id', authMiddleware, UpdateProjectRequest.handle(), DoAnController.updateProject);
router.delete('/projects/:id', authMiddleware, DoAnController.deleteProject);
```

#### Cập nhật `/src/routes/index.js`
- Thêm route cho projects
- Thêm route cho downloads: `/api/downloads/:token`

#### Cập nhật `/src/routes/admin.js`
- Thêm admin routes cho projects
- `/admin/projects` (CRUD)

### 4. Email Service

#### Tạo hoặc cập nhật `/src/app/services/EmailService.js`
Method `sendDownloadEmail()`:
- Nhận orderId
- Lấy thông tin order và download links
- Gửi email HTML với:
  - Danh sách đồ án đã mua
  - Download links cho mỗi đồ án
  - Expiry date
  - Hướng dẫn download

### 5. File Upload

#### Cập nhật file upload handler
- Support upload multiple files (source, database, docs, preview images)
- Store files in `/storage/projects/{projectId}/`
- Update `DoAnFile` model với file info
- Set `DuongDanFile` trong `DoAn` model

### 6. Text Replacement

#### Cần thay đổi text trong:
- Controllers: "sản phẩm" → "đồ án", "nước hoa" → "đồ án"
- Routes: `/api/products` → `/api/projects`
- Messages: Update success/error messages
- Swagger docs: Update API documentation

## 📝 Migration Script (Optional)

Nếu cần migrate data từ SanPham sang DoAn:

```javascript
// scripts/migrate-products-to-projects.js
const SanPham = require('../src/app/models/SanPham');
const DoAn = require('../src/app/models/DoAn');

async function migrate() {
    const products = await SanPham.find({});
    
    for (const product of products) {
        await DoAn.create({
            TieuDe: product.TenSanPham,
            MaLoaiDoAn: product.MaLoaiSanPham, // Cần map category
            MonHoc: 'Other',
            CapDo: 'Đại học',
            Gia: product.Gia,
            MoTa: product.MoTa,
            TrangThai: product.TrangThai === 'deleted' ? 'deleted' : 'available',
            // ... map other fields
        });
    }
}
```

## 🚀 Next Steps

1. **Tạo DoAnController** với các methods cơ bản
2. **Tạo validation requests** (StoreProjectRequest, UpdateProjectRequest)
3. **Tạo routes** cho projects
4. **Cập nhật DonHangController** để handle download links
5. **Tạo EmailService** để gửi download emails
6. **Test** các endpoints mới
7. **Update Swagger docs**

## ⚠️ Lưu ý

- Giữ backward compatibility với SanPham nếu cần
- Test kỹ trước khi deploy
- Backup database trước khi migrate
- Update frontend cùng lúc với backend
