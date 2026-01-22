const mongoose = require('mongoose');

/**
 * ============================================
 * 📦 DOAN SCHEMA (PROJECT)
 * ============================================
 * Schema cho đồ án thay thế SanPham (nước hoa)
 */
const DoAnSchema = new mongoose.Schema({
    TieuDe: {
        type: String,
        required: [true, 'Tên đồ án là bắt buộc'],
        trim: true,
        minlength: [2, 'Tên đồ án phải có ít nhất 2 ký tự'],
        maxlength: [200, 'Tên đồ án không được quá 200 ký tự']
    },
    MaLoaiDoAn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoaiDoAn',
        required: [true, 'Loại đồ án là bắt buộc']
    },
    MonHoc: {
        type: String,
        required: [true, 'Môn học là bắt buộc'],
        trim: true,
        enum: ['Web Development', 'Mobile App', 'AI/ML', 'Full-stack', 'Backend', 'Frontend', 'Other'],
        default: 'Other'
    },
    CapDo: {
        type: String,
        required: [true, 'Cấp độ là bắt buộc'],
        enum: ['Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'],
        default: 'Đại học'
    },
    Gia: {
        type: Number,
        required: [true, 'Giá đồ án là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    KhuyenMai: {
        type: Number,
        default: 0,
        min: [0, 'Khuyến mãi không được âm'],
        max: [100, 'Khuyến mãi không được quá 100%']
    },
    MoTa: {
        type: String,
        default: '',
        maxlength: [5000, 'Mô tả không được quá 5000 ký tự']
    },
    TinhNang: {
        type: [String],
        default: [],
        validate: {
            validator: function(features) {
                return features.length <= 50;
            },
            message: 'Không thể có quá 50 tính năng'
        }
    },
    CongNghe: {
        type: [String],
        default: [],
        validate: {
            validator: function(tech) {
                return tech.length <= 30;
            },
            message: 'Không thể có quá 30 công nghệ'
        }
    },
    BaoGom: {
        type: [String],
        default: [],
        validate: {
            validator: function(includes) {
                return includes.length <= 20;
            },
            message: 'Không thể có quá 20 mục bao gồm'
        }
    },
    AnhPreview: {
        type: [String],
        default: [],
        validate: {
            validator: function(images) {
                return images.length <= 10;
            },
            message: 'Không thể có quá 10 ảnh preview'
        }
    },
    LinkDemo: {
        type: String,
        default: '',
        trim: true,
        validate: {
            validator: function(url) {
                if (!url) return true;
                return /^https?:\/\/.+/.test(url);
            },
            message: 'Link demo không hợp lệ'
        }
    },
    DiemSo: {
        type: String,
        default: '',
        trim: true,
        maxlength: [10, 'Điểm số không được quá 10 ký tự']
    },
    NamThucHien: {
        type: Number,
        min: [2000, 'Năm thực hiện phải từ 2000 trở đi'],
        max: [new Date().getFullYear() + 1, 'Năm thực hiện không được vượt quá năm hiện tại']
    },
    Truong: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Tên trường không được quá 200 ký tự']
    },
    Tags: {
        type: [String],
        default: [],
        validate: {
            validator: function(tags) {
                return tags.length <= 20;
            },
            message: 'Không thể có quá 20 tags'
        }
    },
    SoLuotTai: {
        type: Number,
        default: 0,
        min: [0, 'Số lượt tải không được âm']
    },
    DanhGia: {
        type: Number,
        default: 0,
        min: [0, 'Đánh giá không được âm'],
        max: [5, 'Đánh giá không được quá 5']
    },
    SoLuongDanhGia: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng đánh giá không được âm']
    },
    DuongDanFile: {
        type: String,
        default: '',
        trim: true
    },
    KichThuocFile: {
        type: Number,
        default: 0,
        min: [0, 'Kích thước file không được âm']
    },
    HinhAnhChinh: {
        type: String,
        default: '',
        trim: true
    },
    TrangThai: {
        type: String,
        enum: ['available', 'sold_out', 'pending', 'deleted'],
        default: 'available'
    },
    IsFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'DoAn'
});

// ============================================
// INDEXES
// ============================================

DoAnSchema.index({ TieuDe: 'text', MoTa: 'text' });
DoAnSchema.index({ MaLoaiDoAn: 1 });
DoAnSchema.index({ MonHoc: 1 });
DoAnSchema.index({ CapDo: 1 });
DoAnSchema.index({ Gia: 1 });
DoAnSchema.index({ SoLuotTai: -1 });
DoAnSchema.index({ DanhGia: -1 });
DoAnSchema.index({ SoLuongDanhGia: -1 });
DoAnSchema.index({ createdAt: -1 });
DoAnSchema.index({ TrangThai: 1 });
DoAnSchema.index({ IsFeatured: 1 });
DoAnSchema.index({ Tags: 1 });
DoAnSchema.index({ CongNghe: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

DoAnSchema.virtual('NgayTao').get(function() {
    return this.createdAt;
});

DoAnSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

/**
 * Giá sau khuyến mãi
 */
DoAnSchema.virtual('GiaSauKhuyenMai').get(function() {
    if (this.KhuyenMai > 0) {
        return this.Gia * (1 - this.KhuyenMai / 100);
    }
    return this.Gia;
});

/**
 * Còn sẵn có không
 */
DoAnSchema.virtual('ConSan').get(function() {
    return this.TrangThai === 'available';
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Tăng số lượt tải
 */
DoAnSchema.methods.incrementDownload = async function() {
    this.SoLuotTai += 1;
    return this.save();
};

/**
 * Cập nhật đánh giá
 */
DoAnSchema.methods.updateRating = async function(newRating) {
    const totalRating = (this.DanhGia * this.SoLuongDanhGia) + newRating;
    this.SoLuongDanhGia += 1;
    this.DanhGia = totalRating / this.SoLuongDanhGia;
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm kiếm đồ án
 */
DoAnSchema.statics.search = function(keyword, options = {}) {
    const query = {
        $or: [
            { TieuDe: { $regex: keyword, $options: 'i' } },
            { MoTa: { $regex: keyword, $options: 'i' } },
            { Tags: { $in: [new RegExp(keyword, 'i')] } }
        ],
        TrangThai: { $ne: 'deleted' }
    };

    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find(query)
        .populate('MaLoaiDoAn')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy đồ án theo loại
 */
DoAnSchema.statics.findByCategory = function(categoryId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ 
        MaLoaiDoAn: categoryId,
        TrangThai: { $ne: 'deleted' }
    })
        .populate('MaLoaiDoAn')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy đồ án theo môn học
 */
DoAnSchema.statics.findBySubject = function(subject, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ 
        MonHoc: subject,
        TrangThai: { $ne: 'deleted' }
    })
        .populate('MaLoaiDoAn')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy đồ án theo công nghệ
 */
DoAnSchema.statics.findByTechStack = function(techStack, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ 
        CongNghe: { $in: Array.isArray(techStack) ? techStack : [techStack] },
        TrangThai: { $ne: 'deleted' }
    })
        .populate('MaLoaiDoAn')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

/**
 * Lấy đồ án có khuyến mãi
 */
DoAnSchema.statics.getOnSale = function(options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ 
        KhuyenMai: { $gt: 0 },
        TrangThai: { $ne: 'deleted' }
    })
        .populate('MaLoaiDoAn')
        .skip(skip)
        .limit(limit)
        .sort({ KhuyenMai: -1 });
};

/**
 * Lấy đồ án được tải nhiều nhất
 */
DoAnSchema.statics.getMostDownloaded = function(limit = 10) {
    return this.find({ TrangThai: { $ne: 'deleted' } })
        .populate('MaLoaiDoAn')
        .sort({ SoLuotTai: -1 })
        .limit(limit);
};

/**
 * Lấy đồ án đánh giá cao nhất
 */
DoAnSchema.statics.getTopRated = function(limit = 10) {
    return this.find({ 
        TrangThai: { $ne: 'deleted' },
        SoLuongDanhGia: { $gte: 1 }
    })
        .populate('MaLoaiDoAn')
        .sort({ DanhGia: -1, SoLuongDanhGia: -1 })
        .limit(limit);
};

/**
 * Lấy đồ án mới nhất
 */
DoAnSchema.statics.getLatest = function(limit = 10) {
    return this.find({ TrangThai: { $ne: 'deleted' } })
        .populate('MaLoaiDoAn')
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Lấy đồ án nổi bật
 */
DoAnSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ 
        IsFeatured: true,
        TrangThai: { $ne: 'deleted' }
    })
        .populate('MaLoaiDoAn')
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Lấy đồ án tương tự
 */
DoAnSchema.statics.getSimilar = function(projectId, limit = 5) {
    return this.findById(projectId)
        .then(project => {
            if (!project) return [];
            
            return this.find({
                _id: { $ne: projectId },
                $or: [
                    { MonHoc: project.MonHoc },
                    { CongNghe: { $in: project.CongNghe } },
                    { Tags: { $in: project.Tags } }
                ],
                TrangThai: { $ne: 'deleted' }
            })
                .populate('MaLoaiDoAn')
                .limit(limit)
                .sort({ DanhGia: -1, SoLuotTai: -1 });
        });
};

/**
 * Lấy với phân trang
 */
DoAnSchema.statics.paginate = async function(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    
    // Đảm bảo không lấy các đồ án đã xóa
    filter.TrangThai = filter.TrangThai || { $ne: 'deleted' };

    const [data, total] = await Promise.all([
        this.find(filter)
            .populate('MaLoaiDoAn')
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

module.exports = mongoose.model('DoAn', DoAnSchema);
