const mongoose = require('mongoose');

/**
 * ============================================
 * 📦 SANPHAM SCHEMA (PRODUCT)
 * ============================================
 */
const SanPhamSchema = new mongoose.Schema({
    TenSanPham: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        minlength: [2, 'Tên sản phẩm phải có ít nhất 2 ký tự'],
        maxlength: [200, 'Tên sản phẩm không được quá 200 ký tự']
    },
    MaLoaiSanPham: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoaiSanPham',
        required: [true, 'Loại sản phẩm là bắt buộc']
    },
    Gia: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    KhuyenMai: {
        type: Number,
        default: 0,
        min: [0, 'Khuyến mãi không được âm'],
        max: [100, 'Khuyến mãi không được quá 100%']
    },
    /**
     * @deprecated: Dung tích đơn lẻ (giữ để tương thích ngược, sẽ được sync từ DungTichOptions)
     */
    DungTich: {
        type: Number,
        min: [0, 'Dung tích không được âm'],
        default: null
    },
    DungTichOptions: [{
        value: {
            type: Number,
            min: [0, 'Dung tích không được âm'],
            required: [true, 'Dung tích là bắt buộc']
        },
        label: {
            type: String,
            trim: true,
            maxlength: 50
        },
        priceDiff: {
            type: Number,
            default: 0
        },
        stockDiff: {
            type: Number,
            default: 0
        },
        sku: {
            type: String,
            trim: true,
            maxlength: 100
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    MoTa: {
        type: String,
        default: '',
        maxlength: [5000, 'Mô tả không được quá 5000 ký tự']
    },
    SoLuong: {
        type: Number,
        required: [true, 'Số lượng là bắt buộc'],
        default: 0,
        min: [0, 'Số lượng không được âm']
    },
    DaBan: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng đã bán không được âm']
    },
    IdTepAnh: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TepAnhSanPham',
        default: null
    },
    HinhAnhChinh: {
        type: String,
        default: '',
        trim: true
    },
    HinhAnhPhu: {
        type: [String],
        default: [],
        validate: {
            validator: function(images) {
                return images.length <= 10;
            },
            message: 'Không thể có quá 10 ảnh phụ'
        }
    }
}, {
    timestamps: true,
    collection: 'SanPham'
});

// ============================================
// INDEXES
// ============================================

SanPhamSchema.index({ TenSanPham: 'text' });
SanPhamSchema.index({ MaLoaiSanPham: 1 });
SanPhamSchema.index({ Gia: 1 });
SanPhamSchema.index({ DaBan: -1 });
SanPhamSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

SanPhamSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

SanPhamSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

/**
 * Giá sau khuyến mãi
 */
SanPhamSchema.virtual('GiaSauKhuyenMai').get(function() {
    if (this.KhuyenMai > 0) {
        return this.Gia * (1 - this.KhuyenMai / 100);
    }
    return this.Gia;
});

/**
 * Còn hàng không
 */
SanPhamSchema.virtual('ConHang').get(function() {
    return this.SoLuong > 0;
});

/**
 * Chuẩn hóa tên sản phẩm với dung tích (ví dụ: "Nước hoa A 100ml")
 * @param {String} name
 * @param {Number} volume
 */
function formatProductNameWithVolume(name = '', volume) {
    if (!volume || Number(volume) <= 0) {
        return name?.trim();
    }

    const cleanName = (name || '')
        .replace(/\s+(\d+(\.\d+)?\s?ml)$/i, '')
        .trim();

    const normalizedVolume = Number(volume);
    const volumeText = Number.isInteger(normalizedVolume)
        ? normalizedVolume.toString()
        : normalizedVolume.toFixed(2).replace(/\.?0+$/, '');

    return `${cleanName} ${volumeText}ml`.trim();
}

SanPhamSchema.statics.formatNameWithVolume = formatProductNameWithVolume;

function normalizeVolumeOptions(options = [], fallbackVolume = null) {
    let normalized = Array.isArray(options) ? options.filter(Boolean) : [];

    if (!normalized.length && fallbackVolume) {
        normalized = [{
            value: fallbackVolume,
            label: `${fallbackVolume} ml`,
            isDefault: true
        }];
    }

    normalized = normalized.map(option => {
        const value = Number(option.value);
        if (!Number.isFinite(value) || value < 0) return null;

        const label = option.label?.trim() || `${value} ml`;

        return {
            value,
            label,
            priceDiff: Number(option.priceDiff) || 0,
            stockDiff: Number.isFinite(option.stockDiff) ? Number(option.stockDiff) : 0,
            sku: option.sku?.trim() || undefined,
            isDefault: Boolean(option.isDefault)
        };
    }).filter(Boolean);

    if (!normalized.length && fallbackVolume) {
        normalized = [{
            value: fallbackVolume,
            label: `${fallbackVolume} ml`,
            isDefault: true
        }];
    }

    if (!normalized.some(option => option.isDefault)) {
        if (normalized.length) {
            normalized[0].isDefault = true;
        }
    } else {
        normalized = normalized.map((option, index) => ({
            ...option,
            isDefault: option.isDefault || index === 0
        }));
    }

    return normalized;
}

function getDefaultVolumeValue(options = [], fallback = null) {
    if (!Array.isArray(options) || !options.length) {
        return fallback;
    }

    const defaultOption = options.find(option => option.isDefault) || options[0];
    return defaultOption ? defaultOption.value : fallback;
}

SanPhamSchema.statics.normalizeVolumeOptions = normalizeVolumeOptions;
SanPhamSchema.methods.getDefaultVolumeValue = function() {
    return getDefaultVolumeValue(this.DungTichOptions, this.DungTich);
};
SanPhamSchema.virtual('DefaultDungTich').get(function() {
    return this.getDefaultVolumeValue();
});

SanPhamSchema.pre('save', function(next) {
    const fallbackVolume = this.DungTich || null;
    const volumeOptions = normalizeVolumeOptions(this.DungTichOptions, fallbackVolume);
    this.DungTichOptions = volumeOptions;

    const defaultVolume = getDefaultVolumeValue(volumeOptions, fallbackVolume);
    this.DungTich = defaultVolume || null;

    const shouldUpdateName =
        (this.isModified('DungTichOptions') || this.isModified('DungTich')) ||
        this.isModified('TenSanPham') ||
        this.isNew;

    if (shouldUpdateName) {
        this.TenSanPham = formatProductNameWithVolume(this.TenSanPham, defaultVolume);
    }
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Kiểm tra còn đủ hàng không
 */
SanPhamSchema.methods.hasStock = function(quantity) {
    return this.SoLuong >= quantity;
};

/**
 * Giảm số lượng tồn kho
 * @param {Number} quantity - Số lượng cần giảm
 * @param {Object} options - Options cho save (có thể chứa session cho transaction)
 */
SanPhamSchema.methods.decreaseStock = async function(quantity, options = {}) {
    if (!this.hasStock(quantity)) {
        throw new Error('Không đủ hàng trong kho');
    }
    this.SoLuong -= quantity;
    this.DaBan += quantity;
    return this.save(options);
};

/**
 * Tăng số lượng tồn kho
 * @param {Number} quantity - Số lượng cần tăng
 * @param {Object} options - Options cho save (có thể chứa session cho transaction)
 */
SanPhamSchema.methods.increaseStock = async function(quantity, options = {}) {
    this.SoLuong += quantity;
    return this.save(options);
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm kiếm sản phẩm
 */
SanPhamSchema.statics.search = function(keyword, options = {}) {
    const query = {
        $or: [
            { TenSanPham: { $regex: keyword, $options: 'i' } },
            { MoTa: { $regex: keyword, $options: 'i' } }
        ]
    };

    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find(query)
        .populate('MaLoaiSanPham')
        .populate('IdTepAnh')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy sản phẩm theo loại
 */
SanPhamSchema.statics.findByCategory = function(categoryId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ MaLoaiSanPham: categoryId })
        .populate('MaLoaiSanPham')
        .populate('IdTepAnh')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy sản phẩm có khuyến mãi
 */
SanPhamSchema.statics.getOnSale = function(options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ KhuyenMai: { $gt: 0 } })
        .populate('MaLoaiSanPham')
        .populate('IdTepAnh')
        .skip(skip)
        .limit(limit)
        .sort({ KhuyenMai: -1 });
};

/**
 * Lấy sản phẩm bán chạy
 */
SanPhamSchema.statics.getBestSellers = function(limit = 10) {
    return this.find({})
        .populate('MaLoaiSanPham')
        .populate('IdTepAnh')
        .sort({ DaBan: -1 })
        .limit(limit);
};

/**
 * Lấy sản phẩm mới nhất
 */
SanPhamSchema.statics.getLatest = function(limit = 10) {
    return this.find({})
        .populate('MaLoaiSanPham')
        .populate('IdTepAnh')
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Lấy với phân trang
 */
SanPhamSchema.statics.paginate = async function(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        this.find(filter)
            .populate('MaLoaiSanPham')
            .populate('IdTepAnh')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        this.countDocuments(filter)
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('SanPham', SanPhamSchema);
