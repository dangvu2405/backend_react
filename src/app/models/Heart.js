const mongoose = require('mongoose');

/**
 * ============================================
 * ❤️ HEART SCHEMA (FAVORITE PRODUCTS)
 * ============================================
 */
const HeartSchema = new mongoose.Schema({
    MaKhachHang: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaiKhoan',
        required: [true, 'Mã khách hàng là bắt buộc'],
        index: true
    },
    MaSanPham: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SanPham',
        required: [true, 'Mã sản phẩm là bắt buộc'],
        index: true
    }
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    collection: 'hearts'
});

// Compound index để đảm bảo mỗi user chỉ có thể yêu thích 1 sản phẩm 1 lần
HeartSchema.index({ MaKhachHang: 1, MaSanPham: 1 }, { unique: true });

// Virtual để populate thông tin sản phẩm
HeartSchema.virtual('SanPham', {
    ref: 'SanPham',
    localField: 'MaSanPham',
    foreignField: '_id',
    justOne: true
});

// Virtual để populate thông tin khách hàng
HeartSchema.virtual('KhachHang', {
    ref: 'TaiKhoan',
    localField: 'MaKhachHang',
    foreignField: '_id',
    justOne: true
});

// Đảm bảo virtual được include khi convert sang JSON
HeartSchema.set('toJSON', { virtuals: true });
HeartSchema.set('toObject', { virtuals: true });

// Static method: Lấy tất cả sản phẩm yêu thích của user
HeartSchema.statics.getUserHearts = async function(userId) {
    return this.find({ MaKhachHang: userId })
        .populate('MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh DungTich DungTichOptions')
        .sort({ createdAt: -1 });
};

// Static method: Kiểm tra user đã yêu thích sản phẩm chưa
HeartSchema.statics.isHeartExists = async function(userId, productId) {
    const heart = await this.findOne({ 
        MaKhachHang: userId, 
        MaSanPham: productId 
    });
    return !!heart;
};

// Static method: Lấy danh sách product IDs mà user đã yêu thích
HeartSchema.statics.getUserHeartProductIds = async function(userId) {
    const hearts = await this.find({ MaKhachHang: userId }).select('MaSanPham');
    return hearts.map(heart => heart.MaSanPham.toString());
};

module.exports = mongoose.model('Heart', HeartSchema);

