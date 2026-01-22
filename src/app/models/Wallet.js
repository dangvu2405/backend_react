const mongoose = require('mongoose');

/**
 * ============================================
 * 💰 WALLET SCHEMA (VÍ ĐIỆN TỬ)
 * ============================================
 * Lưu số dư ví của khách hàng
 */
const WalletSchema = new mongoose.Schema({
    MaNguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        required: [true, 'Mã người dùng là bắt buộc'],
        unique: true,
        index: true
    },
    SoDu: {
        type: Number,
        required: [true, 'Số dư là bắt buộc'],
        default: 0,
        min: [0, 'Số dư không được âm']
    },
    TrangThai: {
        type: String,
        enum: ['active', 'frozen', 'suspended'],
        default: 'active'
    },
    GhiChu: {
        type: String,
        default: '',
        maxlength: [500, 'Ghi chú không được quá 500 ký tự']
    }
}, {
    timestamps: true,
    collection: 'Wallet'
});

// ============================================
// INDEXES
// ============================================

WalletSchema.index({ MaNguoiDung: 1 });
WalletSchema.index({ TrangThai: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

WalletSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

WalletSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Nạp tiền vào ví
 * @param {Number} amount - Số tiền nạp
 * @param {String} transactionId - ID của transaction
 * @returns {Promise}
 */
WalletSchema.methods.deposit = async function(amount, transactionId) {
    if (amount <= 0) {
        throw new Error('Số tiền nạp phải lớn hơn 0');
    }
    
    if (this.TrangThai !== 'active') {
        throw new Error('Ví đang bị khóa, không thể nạp tiền');
    }
    
    this.SoDu += amount;
    await this.save();
    
    // Tạo transaction record
    const WalletTransaction = require('./WalletTransaction');
    await WalletTransaction.create({
        MaVi: this._id,
        MaNguoiDung: this.MaNguoiDung,
        Loai: 'deposit',
        SoTien: amount,
        SoDuTruoc: this.SoDu - amount,
        SoDuSau: this.SoDu,
        TrangThai: 'completed',
        MoTa: `Nạp tiền vào ví - Transaction ID: ${transactionId}`
    });
    
    return this;
};

/**
 * Rút tiền từ ví (thanh toán)
 * @param {Number} amount - Số tiền rút
 * @param {String} orderId - ID đơn hàng
 * @returns {Promise}
 */
WalletSchema.methods.withdraw = async function(amount, orderId) {
    if (amount <= 0) {
        throw new Error('Số tiền rút phải lớn hơn 0');
    }
    
    if (this.TrangThai !== 'active') {
        throw new Error('Ví đang bị khóa, không thể thanh toán');
    }
    
    if (this.SoDu < amount) {
        throw new Error('Số dư không đủ để thanh toán');
    }
    
    const soDuTruoc = this.SoDu;
    this.SoDu -= amount;
    await this.save();
    
    // Tạo transaction record
    const WalletTransaction = require('./WalletTransaction');
    await WalletTransaction.create({
        MaVi: this._id,
        MaNguoiDung: this.MaNguoiDung,
        Loai: 'withdraw',
        SoTien: amount,
        SoDuTruoc: soDuTruoc,
        SoDuSau: this.SoDu,
        TrangThai: 'completed',
        MaDonHang: orderId,
        MoTa: `Thanh toán đơn hàng #${orderId}`
    });
    
    return this;
};

/**
 * Hoàn tiền vào ví
 * @param {Number} amount - Số tiền hoàn
 * @param {String} orderId - ID đơn hàng
 * @param {String} reason - Lý do hoàn tiền
 * @returns {Promise}
 */
WalletSchema.methods.refund = async function(amount, orderId, reason = '') {
    if (amount <= 0) {
        throw new Error('Số tiền hoàn phải lớn hơn 0');
    }
    
    const soDuTruoc = this.SoDu;
    this.SoDu += amount;
    await this.save();
    
    // Tạo transaction record
    const WalletTransaction = require('./WalletTransaction');
    await WalletTransaction.create({
        MaVi: this._id,
        MaNguoiDung: this.MaNguoiDung,
        Loai: 'refund',
        SoTien: amount,
        SoDuTruoc: soDuTruoc,
        SoDuSau: this.SoDu,
        TrangThai: 'completed',
        MaDonHang: orderId,
        MoTa: `Hoàn tiền đơn hàng #${orderId}${reason ? ' - ' + reason : ''}`
    });
    
    return this;
};

/**
 * Kiểm tra số dư có đủ không
 * @param {Number} amount - Số tiền cần kiểm tra
 * @returns {Boolean}
 */
WalletSchema.methods.hasEnoughBalance = function(amount) {
    return this.SoDu >= amount && this.TrangThai === 'active';
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tạo hoặc lấy wallet của user
 * @param {String} userId - User ID
 * @returns {Promise<Wallet>}
 */
WalletSchema.statics.getOrCreate = async function(userId) {
    let wallet = await this.findOne({ MaNguoiDung: userId });
    
    if (!wallet) {
        wallet = await this.create({
            MaNguoiDung: userId,
            SoDu: 0
        });
    }
    
    return wallet;
};

/**
 * Lấy wallet theo user ID
 * @param {String} userId - User ID
 * @returns {Promise<Wallet>}
 */
WalletSchema.statics.getByUserId = function(userId) {
    return this.findOne({ MaNguoiDung: userId });
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('Wallet', WalletSchema);
