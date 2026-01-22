const mongoose = require('mongoose');

/**
 * ============================================
 * 🎮 MMO PRODUCT SCHEMA
 * ============================================
 * Schema cho sản phẩm MMO (Gold, Items, Accounts, Services)
 */
const MMOProductSchema = new mongoose.Schema({
    Ten: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        minlength: [1, 'Tên sản phẩm phải có ít nhất 1 ký tự'],
        maxlength: [255, 'Tên sản phẩm không được quá 255 ký tự']
    },
    Loai: {
        type: String,
        required: [true, 'Loại sản phẩm là bắt buộc'],
        enum: {
            values: ['gold', 'items', 'accounts', 'services'],
            message: 'Loại sản phẩm phải là: gold, items, accounts, hoặc services'
        }
    },
    Game: {
        type: String,
        required: [true, 'Tên game là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên game không được quá 100 ký tự']
    },
    Gia: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    SoLuong: {
        type: Number,
        required: [true, 'Số lượng là bắt buộc'],
        default: 0,
        min: [0, 'Số lượng không được âm']
    },
    MoTa: {
        type: String,
        default: '',
        maxlength: [5000, 'Mô tả không được quá 5000 ký tự']
    },
    HinhAnh: {
        type: String,
        default: '',
        trim: true
    },
    TrangThai: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'out_of_stock'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'active'
    },
    NguoiTao: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        default: null
    },
    NguoiCapNhat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        default: null
    }
}, {
    timestamps: true,
    collection: 'MMOProduct'
});

// ============================================
// INDEXES
// ============================================

MMOProductSchema.index({ Loai: 1 });
MMOProductSchema.index({ Game: 1 });
MMOProductSchema.index({ TrangThai: 1 });
MMOProductSchema.index({ createdAt: -1 });
MMOProductSchema.index({ Ten: 'text', MoTa: 'text' }); // Text search

// ============================================
// VIRTUAL FIELDS
// ============================================

MMOProductSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

MMOProductSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Kiểm tra sản phẩm có đủ số lượng không
 */
MMOProductSchema.methods.hasStock = function(quantity = 1) {
    return this.TrangThai === 'active' && this.SoLuong >= quantity;
};

/**
 * Trừ số lượng sản phẩm
 */
MMOProductSchema.methods.decreaseStock = async function(quantity) {
    if (this.SoLuong < quantity) {
        throw new Error(`Không đủ số lượng. Hiện có: ${this.SoLuong}, yêu cầu: ${quantity}`);
    }
    
    this.SoLuong -= quantity;
    
    // Tự động cập nhật trạng thái nếu hết hàng
    if (this.SoLuong === 0) {
        this.TrangThai = 'out_of_stock';
    }
    
    return this.save();
};

/**
 * Tăng số lượng sản phẩm
 */
MMOProductSchema.methods.increaseStock = async function(quantity) {
    this.SoLuong += quantity;
    
    // Tự động cập nhật trạng thái nếu có hàng lại
    if (this.TrangThai === 'out_of_stock' && this.SoLuong > 0) {
        this.TrangThai = 'active';
    }
    
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm kiếm sản phẩm với filter
 */
MMOProductSchema.statics.search = function(filters = {}) {
    const {
        page = 1,
        limit = 20,
        category,
        game,
        search,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        inStock = false
    } = filters;
    
    const skip = (page - 1) * limit;
    const query = {};
    
    // Filter by category
    if (category && category !== 'all') {
        query.Loai = category;
    }
    
    // Filter by game
    if (game) {
        query.Game = game;
    }
    
    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.Gia = {};
        if (minPrice !== undefined) query.Gia.$gte = minPrice;
        if (maxPrice !== undefined) query.Gia.$lte = maxPrice;
    }
    
    // Filter by stock
    if (inStock) {
        query.SoLuong = { $gt: 0 };
        query.TrangThai = 'active';
    } else {
        query.TrangThai = { $ne: 'inactive' };
    }
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }
    
    // Sort
    let sort = {};
    switch (sortBy) {
        case 'price_asc':
            sort = { Gia: 1 };
            break;
        case 'price_desc':
            sort = { Gia: -1 };
            break;
        case 'newest':
            sort = { createdAt: -1 };
            break;
        case 'name_asc':
            sort = { Ten: 1 };
            break;
        case 'popular':
            // TODO: Implement popularity based on orders
            sort = { createdAt: -1 };
            break;
        default:
            sort = { createdAt: -1 };
    }
    
    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('NguoiTao', 'TenDangNhap Email')
        .populate('NguoiCapNhat', 'TenDangNhap Email');
};

/**
 * Đếm số lượng sản phẩm với filter
 */
MMOProductSchema.statics.countWithFilter = function(filters = {}) {
    const {
        category,
        game,
        search,
        minPrice,
        maxPrice,
        inStock = false
    } = filters;
    
    const query = {};
    
    if (category && category !== 'all') {
        query.Loai = category;
    }
    
    if (game) {
        query.Game = game;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.Gia = {};
        if (minPrice !== undefined) query.Gia.$gte = minPrice;
        if (maxPrice !== undefined) query.Gia.$lte = maxPrice;
    }
    
    if (inStock) {
        query.SoLuong = { $gt: 0 };
        query.TrangThai = 'active';
    } else {
        query.TrangThai = { $ne: 'inactive' };
    }
    
    if (search) {
        query.$text = { $search: search };
    }
    
    return this.countDocuments(query);
};

/**
 * Lấy danh sách games duy nhất
 */
MMOProductSchema.statics.getGames = function() {
    return this.distinct('Game', { TrangThai: { $ne: 'inactive' } });
};

/**
 * Lấy thống kê theo category
 */
MMOProductSchema.statics.getCategoryStats = async function() {
    const stats = await this.aggregate([
        {
            $match: { TrangThai: { $ne: 'inactive' } }
        },
        {
            $group: {
                _id: '$Loai',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const categoryNames = {
        gold: 'Gold',
        items: 'Items',
        accounts: 'Accounts',
        services: 'Services'
    };
    
    return stats.map(stat => ({
        id: stat._id,
        name: categoryNames[stat._id] || stat._id,
        count: stat.count
    }));
};

// ============================================
// PRE SAVE HOOK
// ============================================

MMOProductSchema.pre('save', function(next) {
    // Tự động cập nhật trạng thái dựa trên số lượng
    if (this.SoLuong === 0 && this.TrangThai === 'active') {
        this.TrangThai = 'out_of_stock';
    } else if (this.SoLuong > 0 && this.TrangThai === 'out_of_stock') {
        this.TrangThai = 'active';
    }
    next();
});

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('MMOProduct', MMOProductSchema);
