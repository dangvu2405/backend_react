const mongoose = require('mongoose');

/**
 * ============================================
 * 💳 WALLET TRANSACTION SCHEMA
 * ============================================
 * Lưu lịch sử giao dịch ví
 */
const WalletTransactionSchema = new mongoose.Schema({
    MaVi: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: [true, 'Mã ví là bắt buộc']
    },
    MaNguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        required: [true, 'Mã người dùng là bắt buộc']
    },
    Loai: {
        type: String,
        enum: ['deposit', 'withdraw', 'refund', 'adjustment'],
        required: [true, 'Loại giao dịch là bắt buộc']
    },
    SoTien: {
        type: Number,
        required: [true, 'Số tiền là bắt buộc'],
        min: [0, 'Số tiền không được âm']
    },
    SoDuTruoc: {
        type: Number,
        required: [true, 'Số dư trước là bắt buộc'],
        min: [0, 'Số dư không được âm']
    },
    SoDuSau: {
        type: Number,
        required: [true, 'Số dư sau là bắt buộc'],
        min: [0, 'Số dư không được âm']
    },
    TrangThai: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    MaDonHang: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DonHang',
        default: null
    },
    PhuongThuc: {
        type: String,
        enum: ['wallet', 'vnpay', 'momo', 'bank', 'cash', 'admin'],
        default: 'wallet'
    },
    MaGiaoDich: {
        type: String,
        default: '',
        trim: true
    },
    MoTa: {
        type: String,
        default: '',
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    NguoiThucHien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        default: null
    }
}, {
    timestamps: true,
    collection: 'WalletTransaction'
});

// ============================================
// INDEXES
// ============================================

WalletTransactionSchema.index({ MaNguoiDung: 1, createdAt: -1 });
WalletTransactionSchema.index({ MaVi: 1, createdAt: -1 });
WalletTransactionSchema.index({ Loai: 1 });
WalletTransactionSchema.index({ TrangThai: 1 });
WalletTransactionSchema.index({ MaDonHang: 1 });
WalletTransactionSchema.index({ MaGiaoDich: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

WalletTransactionSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

WalletTransactionSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

/**
 * Dấu hiệu số tiền (dương cho deposit/refund, âm cho withdraw)
 */
WalletTransactionSchema.virtual('SoTienHienThi').get(function() {
    if (this.Loai === 'deposit' || this.Loai === 'refund') {
        return this.SoTien;
    }
    return -this.SoTien;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy lịch sử giao dịch của user
 * @param {String} userId - User ID
 * @param {Object} options - Options (page, limit, type, status)
 * @returns {Promise}
 */
WalletTransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
    const { 
        page = 1, 
        limit = 20, 
        type, 
        status,
        startDate,
        endDate
    } = options;
    
    const skip = (page - 1) * limit;
    
    const filter = { MaNguoiDung: userId };
    
    if (type) {
        filter.Loai = type;
    }
    
    if (status) {
        filter.TrangThai = status;
    }
    
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }
    
    return this.find(filter)
        .populate('MaDonHang', 'MaDonHang TongTien TrangThai')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Đếm số giao dịch của user
 * @param {String} userId - User ID
 * @param {Object} filter - Filter options
 * @returns {Promise<Number>}
 */
WalletTransactionSchema.statics.countUserTransactions = function(userId, filter = {}) {
    return this.countDocuments({ 
        MaNguoiDung: userId,
        ...filter
    });
};

/**
 * Thống kê giao dịch
 * @param {String} userId - User ID
 * @param {Object} options - Options (startDate, endDate)
 * @returns {Promise}
 */
WalletTransactionSchema.statics.getStatistics = async function(userId, options = {}) {
    const { startDate, endDate } = options;
    
    const matchFilter = { 
        MaNguoiDung: userId,
        TrangThai: 'completed'
    };
    
    if (startDate || endDate) {
        matchFilter.createdAt = {};
        if (startDate) {
            matchFilter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            matchFilter.createdAt.$lte = new Date(endDate);
        }
    }
    
    const stats = await this.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: '$Loai',
                totalAmount: { $sum: '$SoTien' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        totalDeposit: 0,
        totalWithdraw: 0,
        totalRefund: 0,
        depositCount: 0,
        withdrawCount: 0,
        refundCount: 0
    };
    
    stats.forEach(stat => {
        if (stat._id === 'deposit') {
            result.totalDeposit = stat.totalAmount;
            result.depositCount = stat.count;
        } else if (stat._id === 'withdraw') {
            result.totalWithdraw = stat.totalAmount;
            result.withdrawCount = stat.count;
        } else if (stat._id === 'refund') {
            result.totalRefund = stat.totalAmount;
            result.refundCount = stat.count;
        }
    });
    
    return result;
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
