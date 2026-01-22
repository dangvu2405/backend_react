const mongoose = require('mongoose');

/**
 * ============================================
 * 📁 LOAIDOAN SCHEMA (CATEGORY)
 * ============================================
 * Schema cho loại đồ án thay thế LoaiSanPham
 */
const LoaiDoAnSchema = new mongoose.Schema({
    TenLoaiDoAn: {
        type: String,
        required: [true, 'Tên loại đồ án là bắt buộc'],
        unique: true,
        trim: true,
        minlength: [2, 'Tên loại đồ án phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Tên loại đồ án không được quá 100 ký tự']
    },
    MoTa: {
        type: String,
        default: '',
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    Loai: {
        type: String,
        enum: ['subject', 'level', 'format'],
        default: 'subject'
    },
    MaLoaiCha: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoaiDoAn',
        default: null
    },
    HinhAnh: {
        type: String,
        default: '',
        trim: true
    },
    ThuTu: {
        type: Number,
        default: 0,
        min: [0, 'Thứ tự không được âm']
    },
    TrangThai: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'LoaiDoAn'
});

// ============================================
// INDEXES
// ============================================

LoaiDoAnSchema.index({ TenLoaiDoAn: 1 });
LoaiDoAnSchema.index({ Loai: 1 });
LoaiDoAnSchema.index({ MaLoaiCha: 1 });
LoaiDoAnSchema.index({ TrangThai: 1 });
LoaiDoAnSchema.index({ ThuTu: 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm loại đồ án theo tên
 */
LoaiDoAnSchema.statics.findByName = function(name) {
    return this.findOne({ TenLoaiDoAn: name });
};

/**
 * Tìm kiếm loại đồ án
 */
LoaiDoAnSchema.statics.search = function(keyword) {
    return this.find({
        $or: [
            { TenLoaiDoAn: { $regex: keyword, $options: 'i' } },
            { MoTa: { $regex: keyword, $options: 'i' } }
        ],
        TrangThai: 'active'
    });
};

/**
 * Lấy các loại theo type
 */
LoaiDoAnSchema.statics.findByType = function(type) {
    return this.find({ 
        Loai: type,
        TrangThai: 'active'
    }).sort({ ThuTu: 1 });
};

/**
 * Lấy các loại con
 */
LoaiDoAnSchema.statics.findChildren = function(parentId) {
    return this.find({ 
        MaLoaiCha: parentId,
        TrangThai: 'active'
    }).sort({ ThuTu: 1 });
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('LoaiDoAn', LoaiDoAnSchema);
