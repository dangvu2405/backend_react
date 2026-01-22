const mongoose = require('mongoose');

/**
 * ============================================
 * 📥 DOWNLOAD SCHEMA
 * ============================================
 * Track các lượt download đồ án
 */
const DownloadSchema = new mongoose.Schema({
    MaDonHangItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DonHang.SanPham',
        required: [true, 'Mã đơn hàng item là bắt buộc']
    },
    MaNguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaiKhoan',
        required: [true, 'Mã người dùng là bắt buộc']
    },
    MaDoAn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoAn',
        required: [true, 'Mã đồ án là bắt buộc']
    },
    DiaChiIP: {
        type: String,
        default: '',
        trim: true
    },
    UserAgent: {
        type: String,
        default: '',
        trim: true
    },
    KichThuocTai: {
        type: Number,
        default: 0,
        min: [0, 'Kích thước tải không được âm']
    },
    ThanhCong: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'Download'
});

// ============================================
// INDEXES
// ============================================

DownloadSchema.index({ MaNguoiDung: 1, MaDoAn: 1 });
DownloadSchema.index({ MaDoAn: 1 });
DownloadSchema.index({ MaDonHangItem: 1 });
DownloadSchema.index({ createdAt: -1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy số lượt download của một đồ án
 */
DownloadSchema.statics.getDownloadCount = function(projectId) {
    return this.countDocuments({ 
        MaDoAn: projectId,
        ThanhCong: true
    });
};

/**
 * Lấy số lượt download của một user cho một đồ án
 */
DownloadSchema.statics.getUserDownloadCount = function(userId, projectId) {
    return this.countDocuments({ 
        MaNguoiDung: userId,
        MaDoAn: projectId,
        ThanhCong: true
    });
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('Download', DownloadSchema);
