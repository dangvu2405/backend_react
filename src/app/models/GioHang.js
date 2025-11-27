const mongoose = require('mongoose');

/**
 * ============================================
 * 🛒 GIOHANG SCHEMA (CART)
 * ============================================
 */
const GioHangSchema = new mongoose.Schema({
    IdKhachHang: {
        type: mongoose.Schema.Types.Mixed, // ✅ Hỗ trợ cả ObjectId (user) và String (guest)
        required: [true, 'ID khách hàng là bắt buộc'],
        validate: {
            validator: function(value) {
                // Cho phép ObjectId hoặc string bắt đầu bằng 'guest-'
                return mongoose.Types.ObjectId.isValid(value) || 
                       (typeof value === 'string' && value.startsWith('guest-'));
            },
            message: 'ID khách hàng phải là ObjectId hợp lệ hoặc string bắt đầu bằng "guest-"'
        },
        unique: true, // Mỗi khách hàng chỉ có 1 giỏ hàng
        sparse: true // Cho phép null/undefined để unique hoạt động với Mixed type
    },
    Items: [{
        IdSanPham: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SanPham',
            required: true
        },
        TenSanPham: {
            type: String,
            required: true
        },
        Gia: {
            type: Number,
            required: true,
            min: 0
        },
        SoLuong: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        ThanhTien: {
            type: Number,
            required: true,
            min: 0
        },
        SelectedDungTich: {
            value: {
                type: Number,
                default: null
            },
            label: {
                type: String,
                trim: true,
                maxlength: 50,
                default: ''
            },
            priceDiff: {
                type: Number,
                default: 0
            },
            sku: {
                type: String,
                trim: true,
                maxlength: 100,
                default: ''
            }
        }
    }]
}, {
    // tự động thêm createdAt và updatedAt
    timestamps: true,
    collection: 'GioHang'
});

// ============================================
// INDEXES
// ============================================
// Note: IdKhachHang already has unique: true, which automatically creates an index
// Only keep indexes that are not already defined as unique

GioHangSchema.index({ 'Items.IdSanPham': 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

GioHangSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

GioHangSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

/**
 * Tổng tiền giỏ hàng
 */
GioHangSchema.virtual('TongTien').get(function() {
    return this.Items.reduce((total, item) => total + item.ThanhTien, 0);
});

/**
 * Tổng số sản phẩm
 */
GioHangSchema.virtual('TongSoLuong').get(function() {
    return this.Items.reduce((total, item) => total + item.SoLuong, 0);
});

// ============================================
// MIDDLEWARE
// ============================================

// Tự động tính ThanhTien khi thêm/sửa item
GioHangSchema.pre('save', function(next) {
    this.Items.forEach(item => {
        item.ThanhTien = item.Gia * item.SoLuong;
    });
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Kiểm tra sản phẩm có trong giỏ không
 */
GioHangSchema.methods.hasProduct = function(productId) {
    return this.Items.some(item => 
        item.IdSanPham.toString() === productId.toString()
    );
};

/**
 * Lấy item theo productId
 */
GioHangSchema.methods.getItem = function(productId) {
    return this.Items.find(item => 
        item.IdSanPham.toString() === productId.toString()
    );
};

/**
 * Thêm sản phẩm vào giỏ
 */
GioHangSchema.methods.addItem = async function(product) {
    const { IdSanPham, TenSanPham, Gia, SoLuong } = product;
    
    const existingItem = this.getItem(IdSanPham);
    
    if (existingItem) {
        // Nếu đã có, tăng số lượng
        existingItem.SoLuong += SoLuong;
        existingItem.ThanhTien = existingItem.Gia * existingItem.SoLuong;
    } else {
        // Nếu chưa có, thêm mới
        this.Items.push({
            IdSanPham,
            TenSanPham,
            Gia,
            SoLuong,
            ThanhTien: Gia * SoLuong
        });
    }
    
    return this.save();
};

/**
 * Cập nhật số lượng sản phẩm
 */
GioHangSchema.methods.updateQuantity = async function(productId, quantity) {
    const item = this.getItem(productId);
    
    if (!item) {
        throw new Error('Sản phẩm không có trong giỏ hàng');
    }
    
    if (quantity <= 0) {
        // Xóa item nếu số lượng <= 0
        this.Items = this.Items.filter(item => 
            item.IdSanPham.toString() !== productId.toString()
        );
    } else {
        item.SoLuong = quantity;
        item.ThanhTien = item.Gia * quantity;
    }
    
    return this.save();
};

/**
 * Xóa sản phẩm khỏi giỏ
 */
GioHangSchema.methods.removeItem = async function(productId) {
    this.Items = this.Items.filter(item => 
        item.IdSanPham.toString() !== productId.toString()
    );
    return this.save();
};

/**
 * Xóa toàn bộ giỏ hàng
 */
GioHangSchema.methods.clearCart = async function() {
    this.Items = [];
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy giỏ hàng theo khách hàng
 */
GioHangSchema.statics.findByCustomer = function(customerId) {
    return this.findOne({ IdKhachHang: customerId })
        .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai IdTepAnh');
};

/**
 * Tạo hoặc lấy giỏ hàng
 */
GioHangSchema.statics.findOrCreate = async function(customerId) {
    let cart = await this.findByCustomer(customerId);
    
    if (!cart) {
        cart = await this.create({
            IdKhachHang: customerId,
            Items: []
        });
    }
    
    return cart;
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('GioHang', GioHangSchema);
