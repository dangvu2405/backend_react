const mongoose = require('mongoose');

/**
 * ============================================
 * 🎟️ VOUCHER SCHEMA
 * ============================================
 */
const VoucherSchema = new mongoose.Schema({
    MaVoucher: {
        type: String,
        required: [true, 'Mã voucher là bắt buộc'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'Mã voucher phải có ít nhất 3 ký tự'],
        maxlength: [50, 'Mã voucher không được quá 50 ký tự']
    },
    NoiDung: {
        type: String,
        required: [true, 'Nội dung voucher là bắt buộc'],
        trim: true,
        maxlength: [500, 'Nội dung không được quá 500 ký tự']
    },
    GiaTri: {
        type: Number,
        required: [true, 'Giá trị voucher là bắt buộc'],
        min: [0, 'Giá trị voucher không được nhỏ hơn 0'],
        max: [100, 'Giá trị voucher không được lớn hơn 100']
    },
    SoLuong: {
        type: Number,
        required: [true, 'Số lượng voucher là bắt buộc'],
        default: 0
    },
    NgayTao: {
        type: Date,
        required: [true, 'Ngày tạo voucher là bắt buộc'],
        default: Date.now
    },
    NgayHetHan: {
        type: Date,
        required: [true, 'Ngày hết hạn voucher là bắt buộc'],
        validate: {
            validator: function(value) {
                // ✅ So sánh với NgayTao hoặc createdAt
                const ngayTao = this.NgayTao || this.createdAt || new Date();
                return value && value > ngayTao;
            },
            message: 'Ngày hết hạn phải sau ngày tạo'
        }
    },
    TrangThai: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'expired'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'active'
    },
    GiaTriToiThieu: {
        type: Number,
        default: 0,
        min: [0, 'Giá trị tối thiểu không được âm']
    }
}, {
    timestamps: false,
    collection: 'Voucher'
});

// ============================================
// INDEXES
// ============================================

// MaVoucher đã có unique: true nên tự động có index, không cần thêm

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm voucher theo mã
 */
VoucherSchema.statics.findByCode = function(code) {
    return this.findOne({ MaVoucher: code.toUpperCase() });
};

/**
 * Kiểm tra mã voucher có tồn tại không
 */
VoucherSchema.statics.isCodeExist = async function(code, excludeId = null) {
    const filter = { MaVoucher: code.toUpperCase() };
    
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }
    
    const voucher = await this.findOne(filter);
    return !!voucher;
};

/**
 * Tìm kiếm voucher
 */
VoucherSchema.statics.search = function(keyword) {
    return this.find({
        $or: [
            { MaVoucher: { $regex: keyword, $options: 'i' } },
            { NoiDung: { $regex: keyword, $options: 'i' } }
        ]
    });
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('Voucher', VoucherSchema);
