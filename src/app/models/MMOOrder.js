const mongoose = require('mongoose');

/**
 * ============================================
 * 🎮 MMO ORDER SCHEMA
 * ============================================
 * Schema cho đơn hàng MMO (tracking riêng cho MMO products)
 */
const MMOOrderSchema = new mongoose.Schema({
    MaDonHang: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DonHang',
        required: [true, 'Mã đơn hàng là bắt buộc']
    },
    MaSanPham: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MMOProduct',
        required: [true, 'Mã sản phẩm là bắt buộc']
    },
    SoLuong: {
        type: Number,
        required: [true, 'Số lượng là bắt buộc'],
        min: [1, 'Số lượng phải lớn hơn 0'],
        default: 1
    },
    DonGia: {
        type: Number,
        required: [true, 'Đơn giá là bắt buộc'],
        min: [0, 'Đơn giá không được âm']
    },
    ThanhTien: {
        type: Number,
        required: [true, 'Thành tiền là bắt buộc'],
        min: [0, 'Thành tiền không được âm']
    },
    TrangThaiGiaoHang: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'delivered', 'cancelled'],
            message: 'Trạng thái giao hàng không hợp lệ'
        },
        default: 'pending'
    },
    PhuongThucGiaoHang: {
        type: String,
        default: '',
        trim: true,
        maxlength: [50, 'Phương thức giao hàng không được quá 50 ký tự']
    },
    ThongTinGiaoHang: {
        type: String,
        default: '',
        maxlength: [1000, 'Thông tin giao hàng không được quá 1000 ký tự']
    },
    NgayGiaoHang: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'MMOOrder'
});

// ============================================
// INDEXES
// ============================================

MMOOrderSchema.index({ MaDonHang: 1, createdAt: -1 });
MMOOrderSchema.index({ MaSanPham: 1 });
MMOOrderSchema.index({ TrangThaiGiaoHang: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

MMOOrderSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

MMOOrderSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Đánh dấu đang xử lý
 */
MMOOrderSchema.methods.markAsProcessing = async function() {
    this.TrangThaiGiaoHang = 'processing';
    return this.save();
};

/**
 * Đánh dấu đã giao hàng
 */
MMOOrderSchema.methods.markAsDelivered = async function(deliveryInfo = '') {
    this.TrangThaiGiaoHang = 'delivered';
    this.NgayGiaoHang = new Date();
    if (deliveryInfo) {
        this.ThongTinGiaoHang = deliveryInfo;
    }
    return this.save();
};

/**
 * Hủy đơn hàng
 */
MMOOrderSchema.methods.cancel = async function() {
    this.TrangThaiGiaoHang = 'cancelled';
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy đơn hàng theo mã đơn hàng chính
 */
MMOOrderSchema.statics.getByOrderId = function(orderId) {
    return this.find({ MaDonHang: orderId })
        .populate('MaSanPham', 'Ten Loai Game Gia')
        .populate('MaDonHang', 'MaDonHang TongTien TrangThai');
};

/**
 * Lấy đơn hàng theo sản phẩm
 */
MMOOrderSchema.statics.getByProductId = function(productId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return this.find({ MaSanPham: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('MaDonHang', 'MaDonHang TongTien TrangThai');
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('MMOOrder', MMOOrderSchema);
