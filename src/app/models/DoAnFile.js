const mongoose = require('mongoose');

/**
 * ============================================
 * 📄 DOANFILE SCHEMA
 * ============================================
 * Quản lý các files của đồ án
 */
const DoAnFileSchema = new mongoose.Schema({
    MaDoAn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoAn',
        required: [true, 'Mã đồ án là bắt buộc']
    },
    TenFile: {
        type: String,
        required: [true, 'Tên file là bắt buộc'],
        trim: true,
        maxlength: [255, 'Tên file không được quá 255 ký tự']
    },
    DuongDan: {
        type: String,
        required: [true, 'Đường dẫn file là bắt buộc'],
        trim: true
    },
    LoaiFile: {
        type: String,
        enum: ['source', 'database', 'docs', 'images', 'other'],
        default: 'other'
    },
    KichThuoc: {
        type: Number,
        required: [true, 'Kích thước file là bắt buộc'],
        min: [0, 'Kích thước file không được âm']
    },
    MoTa: {
        type: String,
        default: '',
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    ThuTu: {
        type: Number,
        default: 0,
        min: [0, 'Thứ tự không được âm']
    }
}, {
    timestamps: true,
    collection: 'DoAnFile'
});

// ============================================
// INDEXES
// ============================================

DoAnFileSchema.index({ MaDoAn: 1 });
DoAnFileSchema.index({ LoaiFile: 1 });
DoAnFileSchema.index({ ThuTu: 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy tất cả files của một đồ án
 */
DoAnFileSchema.statics.getByProject = function(projectId) {
    return this.find({ MaDoAn: projectId })
        .sort({ LoaiFile: 1, ThuTu: 1 });
};

/**
 * Lấy files theo loại
 */
DoAnFileSchema.statics.getByType = function(projectId, fileType) {
    return this.find({ 
        MaDoAn: projectId,
        LoaiFile: fileType
    }).sort({ ThuTu: 1 });
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('DoAnFile', DoAnFileSchema);
