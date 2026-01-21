/**
 * Output Transformer - Chuẩn hóa output, loại bỏ field nhạy cảm
 * Đảm bảo không trả về dữ liệu nhạy cảm
 */

const mongoose = require('mongoose');

/**
 * Fields nhạy cảm cần loại bỏ
 */
const SENSITIVE_FIELDS = [
    'MatKhau',
    'password',
    'refreshToken',
    'resetPasswordToken',
    'resetPasswordExpire',
    '__v',
    'internalId',
    'secret',
    'apiKey'
];

/**
 * Transform user object - loại bỏ password và field nhạy cảm
 */
const transformUser = (user) => {
    if (!user) return null;
    
    const userObj = user.toObject ? user.toObject() : user;
    
    const transformed = {
        id: userObj._id?.toString() || userObj.id,
        TenDangNhap: userObj.TenDangNhap,
        HoTen: userObj.HoTen,
        Email: userObj.Email,
        SoDienThoai: userObj.SoDienThoai,
        Avatar: userObj.Avatar || userObj.AvatarUrl,
        DiaChi: userObj.DiaChi,
        TrangThai: userObj.TrangThai,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt
    };
    
    // Populate MaVaiTro nếu có
    if (userObj.MaVaiTro) {
        if (typeof userObj.MaVaiTro === 'object') {
            transformed.MaVaiTro = {
                id: userObj.MaVaiTro._id?.toString(),
                TenVaiTro: userObj.MaVaiTro.TenVaiTro,
                MoTa: userObj.MaVaiTro.MoTa
            };
        } else {
            transformed.MaVaiTro = userObj.MaVaiTro.toString();
        }
    }
    
    // Loại bỏ tất cả field nhạy cảm
    SENSITIVE_FIELDS.forEach(field => {
        delete transformed[field];
    });
    
    return transformed;
};

/**
 * Transform product object
 */
const transformProduct = (product) => {
    if (!product) return null;
    
    const productObj = product.toObject ? product.toObject() : product;
    
    return {
        id: productObj._id?.toString() || productObj.id,
        TenSanPham: productObj.TenSanPham,
        MaLoaiSanPham: productObj.MaLoaiSanPham ? (
            typeof productObj.MaLoaiSanPham === 'object' ? {
                id: productObj.MaLoaiSanPham._id?.toString(),
                TenLoaiSanPham: productObj.MaLoaiSanPham.TenLoaiSanPham
            } : productObj.MaLoaiSanPham.toString()
        ) : null,
        Gia: productObj.Gia,
        KhuyenMai: productObj.KhuyenMai,
        SoLuong: productObj.SoLuong,
        MoTa: productObj.MoTa,
        HinhAnhChinh: productObj.HinhAnhChinh,
        HinhAnhPhu: productObj.HinhAnhPhu || [],
        DungTich: productObj.DungTich,
        DungTichOptions: productObj.DungTichOptions || [],
        TrangThai: productObj.TrangThai || 'active',
        createdAt: productObj.createdAt,
        updatedAt: productObj.updatedAt
    };
};

/**
 * Transform order object
 */
const transformOrder = (order) => {
    if (!order) return null;
    
    const orderObj = order.toObject ? order.toObject() : order;
    
    return {
        id: orderObj._id?.toString() || orderObj.id,
        MaDonHang: orderObj.MaDonHang,
        MaKhachHang: orderObj.MaKhachHang ? (
            typeof orderObj.MaKhachHang === 'object' ? transformUser(orderObj.MaKhachHang) : orderObj.MaKhachHang.toString()
        ) : null,
        SanPham: (orderObj.SanPham || []).map(item => ({
            MaSanPham: item.MaSanPham ? (
                typeof item.MaSanPham === 'object' ? item.MaSanPham._id?.toString() : item.MaSanPham.toString()
            ) : null,
            TenSanPham: item.TenSanPham,
            SoLuong: item.SoLuong,
            Gia: item.Gia,
            TongTien: item.TongTien,
            HinhAnhChinh: item.HinhAnhChinh,
            SelectedDungTich: item.SelectedDungTich
        })),
        TongTien: orderObj.TongTien,
        DiaChi: orderObj.DiaChi,
        PhiVanChuyen: orderObj.PhiVanChuyen || 0,
        PhuongThucThanhToan: orderObj.PhuongThucThanhToan,
        TrangThai: orderObj.TrangThai,
        TrangThaiThanhToan: orderObj.TrangThaiThanhToan,
        GhiChu: orderObj.GhiChu,
        createdAt: orderObj.createdAt,
        updatedAt: orderObj.updatedAt
    };
};

/**
 * Transform review object
 */
const transformReview = (review) => {
    if (!review) return null;
    
    const reviewObj = review.toObject ? review.toObject() : review;
    
    return {
        id: reviewObj._id?.toString() || reviewObj.id,
        IdSanPham: reviewObj.IdSanPham ? (
            typeof reviewObj.IdSanPham === 'object' ? reviewObj.IdSanPham._id?.toString() : reviewObj.IdSanPham.toString()
        ) : null,
        IdKhachHang: reviewObj.IdKhachHang ? (
            typeof reviewObj.IdKhachHang === 'object' ? transformUser(reviewObj.IdKhachHang) : reviewObj.IdKhachHang.toString()
        ) : null,
        SoSao: reviewObj.SoSao,
        NoiDung: reviewObj.NoiDung,
        HinhAnh: reviewObj.HinhAnh || [],
        createdAt: reviewObj.createdAt,
        updatedAt: reviewObj.updatedAt
    };
};

/**
 * Generic transformer - loại bỏ field nhạy cảm từ object bất kỳ
 */
const sanitizeObject = (obj, options = {}) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const { excludeFields = [], includeFields = null, deep = true } = options;
    const objToTransform = obj.toObject ? obj.toObject() : obj;
    
    // Nếu là array, transform từng item
    if (Array.isArray(objToTransform)) {
        return objToTransform.map(item => sanitizeObject(item, options));
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(objToTransform)) {
        // Loại bỏ field nhạy cảm
        if (SENSITIVE_FIELDS.includes(key) || excludeFields.includes(key)) {
            continue;
        }
        
        // Nếu có includeFields, chỉ giữ các field được chỉ định
        if (includeFields && !includeFields.includes(key)) {
            continue;
        }
        
        // Transform nested objects
        if (deep && value && typeof value === 'object' && !(value instanceof Date) && !mongoose.Types.ObjectId.isValid(value)) {
            if (Array.isArray(value)) {
                sanitized[key] = value.map(item => 
                    typeof item === 'object' ? sanitizeObject(item, options) : item
                );
            } else {
                sanitized[key] = sanitizeObject(value, options);
            }
        } else {
            // Convert _id to id
            if (key === '_id' && mongoose.Types.ObjectId.isValid(value)) {
                sanitized.id = value.toString();
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
};

/**
 * Transform response data theo type
 */
const transformResponseData = (data, type = 'auto') => {
    if (!data) return null;
    
    // Auto detect type
    if (type === 'auto') {
        if (Array.isArray(data)) {
            if (data.length > 0) {
                // Detect từ item đầu tiên
                const firstItem = data[0];
                if (firstItem.TenSanPham) type = 'product';
                else if (firstItem.MaDonHang) type = 'order';
                else if (firstItem.SoSao !== undefined) type = 'review';
                else if (firstItem.TenDangNhap) type = 'user';
            }
        } else {
            if (data.TenSanPham) type = 'product';
            else if (data.MaDonHang) type = 'order';
            else if (data.SoSao !== undefined) type = 'review';
            else if (data.TenDangNhap) type = 'user';
        }
    }
    
    const transformer = {
        user: transformUser,
        product: transformProduct,
        order: transformOrder,
        review: transformReview
    }[type];
    
    if (transformer) {
        return Array.isArray(data) ? data.map(transformer) : transformer(data);
    }
    
    // Fallback: sanitize generic
    return sanitizeObject(data);
};

module.exports = {
    transformUser,
    transformProduct,
    transformOrder,
    transformReview,
    sanitizeObject,
    transformResponseData,
    SENSITIVE_FIELDS
};
