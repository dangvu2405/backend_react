const mongoose = require('mongoose');

/**
 * ============================================
 * 📦 DONHANG SCHEMA (ORDER)
 * ============================================
 */
const DonHangSchema = new mongoose.Schema({
    MaDonHang: {
        type: String,
        unique: true,
        sparse: true, // Cho phép null/undefined
        default: function() {
            // ✅ Dùng ObjectId để đảm bảo unique
            return new mongoose.Types.ObjectId().toString();
        }
    },
    MaKhachHang: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Mã khách hàng là bắt buộc'],
        validate: {
            validator: function(value) {
                return mongoose.Types.ObjectId.isValid(value) || 
                       (typeof value === 'string' && value.startsWith('guest-'));
            },
            message: 'Mã khách hàng không hợp lệ'
        }
    },
    // Legacy: Giữ lại để backward compatibility
    SanPham: {
        type: [{
            MaSanPham: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SanPham',
                required: false // Không bắt buộc nữa
            },
            TenSanPham: {
                type: String,
                required: false,
                trim: true
            },
            SoLuong: {
                type: Number,
                required: false,
                min: [1, 'Số lượng phải lớn hơn 0']
            },
            Gia: {
                type: Number,
                required: false,
                min: [0, 'Giá không được âm']
            },
            TongTien: {
                type: Number,
                required: false,
                min: [0, 'Tổng tiền không được âm']
            },
            HinhAnhChinh: {
                type: String,
                default: ''
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
            },
            // New fields for projects
            LinkTai: {
                type: String,
                default: '',
                trim: true
            },
            SoLuotTai: {
                type: Number,
                default: 0,
                min: [0, 'Số lượt tải không được âm']
            },
            NgayTai: {
                type: Date,
                default: null
            }
        }],
        required: false, // Không bắt buộc nữa
        validate: {
            validator: function(products) {
                if (!products) return true;
                return Array.isArray(products) && products.length > 0 && products.length <= 1000;
            },
            message: 'Sản phẩm phải có ít nhất 1 sản phẩm và không quá 1000 sản phẩm'
        }
    },
    // New: Đồ án
    DoAn: {
        type: [{
            MaDoAn: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'DoAn',
                required: true
            },
            TieuDe: {
                type: String,
                required: true,
                trim: true
            },
            SoLuong: {
                type: Number,
                default: 1,
                min: [1, 'Số lượng phải lớn hơn 0']
            },
            Gia: {
                type: Number,
                required: true,
                min: [0, 'Giá không được âm']
            },
            TongTien: {
                type: Number,
                required: true,
                min: [0, 'Tổng tiền không được âm']
            },
            HinhAnhChinh: {
                type: String,
                default: ''
            },
            LinkTai: {
                type: String,
                default: '',
                trim: true
            },
            SoLuotTai: {
                type: Number,
                default: 0,
                min: [0, 'Số lượt tải không được âm']
            },
            NgayTai: {
                type: Date,
                default: null
            },
            HetHanTai: {
                type: Date,
                default: null
            }
        }],
        required: false,
        validate: {
            validator: function(projects) {
                if (!projects) return true;
                return Array.isArray(projects) && projects.length > 0 && projects.length <= 1000;
            },
            message: 'Đồ án phải có ít nhất 1 đồ án và không quá 1000 đồ án'
        }
    },
    TongTien: {
        type: Number,
        required: [true, 'Tổng tiền là bắt buộc'],
        min: [0, 'Tổng tiền không được âm']
    },
    // Legacy: Địa chỉ giao hàng (cho nước hoa)
    DiaChi: {
        type: String,
        required: false, // Không bắt buộc cho đồ án
        trim: true,
        minlength: [10, 'Địa chỉ phải có ít nhất 10 ký tự'],
        maxlength: [500, 'Địa chỉ không được quá 500 ký tự']
    },
    // New: Email nhận file (cho đồ án)
    EmailNhanFile: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(email) {
                if (!email) return true; // Optional
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Email không hợp lệ'
        }
    },
    ThongTinNhanHang: {
        type: {
            HoTen: String,
            Email: String,
            SoDienThoai: String,
            DiaChiChiTiet: String,
            PhuongXa: String,
            QuanHuyen: String,
            TinhThanh: String
        },
        default: null
    },
    PhiVanChuyen: {
        type: Number,
        default: 0,
        min: [0, 'Phí vận chuyển không được âm']
    },
    PhuongThucThanhToan: {
        type: String,
        required: [true, 'Phương thức thanh toán là bắt buộc'],
        enum: {
            values: ['COD', 'VNPay', 'VNPayQR', 'BANK', 'CARD', 'MoMo', 'Chuyển khoản'],
            message: 'Phương thức thanh toán không hợp lệ'
        }
    },
    TrangThai: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'shipping', 'delivered', 'sent', 'downloaded', 'cancelled'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'pending'
    },
    GhiChu: {
        type: String,
        default: '',
        maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    },
    LyDoHuy: {
        type: String,
        default: null,
        maxlength: [500, 'Lý do hủy không được quá 500 ký tự']
    },
    NgayHuy: {
        type: Date,
        default: null
    },
    /**
     * Trạng thái quy trình hủy đơn hàng (khác với trạng thái vận hành đơn hàng trong TrangThai)
     * - none: không có yêu cầu hủy
     * - requested: khách đã gửi yêu cầu hủy, chờ admin duyệt
     * - approved: yêu cầu đã được admin duyệt và đơn đã bị hủy
     * - rejected: admin từ chối yêu cầu hủy
     */
    TrangThaiHuy: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none'
    },
    /**
     * Lưu trạng thái đơn hàng trước khi khách gửi yêu cầu hủy
     * Dùng để khôi phục lại khi admin từ chối yêu cầu hủy
     */
    TrangThaiTruocKhiHuy: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: null
    },
    /**
     * Thông tin người yêu cầu hủy & admin xử lý (tham chiếu tới bảng tài khoản nếu có)
     */
    NguoiYeuCauHuy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        default: null
    },
    NgayYeuCauHuy: {
        type: Date,
        default: null
    },
    HuyByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taikhoan',
        default: null
    },
    NgayXuLyHuy: {
        type: Date,
        default: null
    },
    LyDoHuyAdmin: {
        type: String,
        default: null,
        maxlength: [500, 'Lý do xử lý hủy của admin không được quá 500 ký tự']
    },
    TrangThaiThanhToan: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'failed', 'refunded'],
            message: 'Trạng thái thanh toán không hợp lệ'
        },
        default: 'pending'
    },
    Voucher: {
        type: String,
        default: null
    },
    // VNPay fields
    VNPayTransactionRef: {
        type: String,
        default: null
    },
    VNPayCreateDate: {
        type: String,
        default: null
    },
    VNPayExpireDate: {
        type: String,
        default: null
    },
    VNPayResponseCode: {
        type: String,
        default: null
    },
    VNPayResponseMessage: {
        type: String,
        default: null
    },
    VNPayTransactionId: {
        type: String,
        default: null
    },
    VNPayBankCode: {
        type: String,
        default: null
    },
    VNPayPayDate: {
        type: String,
        default: null
    },
    // New: Download expiry cho đồ án
    HetHanTai: {
        type: Date,
        default: null
    },
    // New: Đã gửi email download chưa
    DaGuiEmail: {
        type: Boolean,
        default: false
    },
    NgayGuiEmail: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'DonHang'
});

// ============================================
// INDEXES
// ============================================

DonHangSchema.index({ TrangThai: 1 });
DonHangSchema.index({ PhuongThucThanhToan: 1 });
DonHangSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

DonHangSchema.virtual('NgayDat').get(function() {
    return this.createdAt;
});

DonHangSchema.virtual('NgayCapNhat').get(function() {
    return this.updatedAt;
});

/**
 * Tổng cộng (TongTien + PhiVanChuyen)
 */
DonHangSchema.virtual('TongCong').get(function() {
    return this.TongTien + this.PhiVanChuyen;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Kiểm tra có thể hủy đơn không
 */
DonHangSchema.methods.canCancel = function() {
    return ['pending', 'confirmed'].includes(this.TrangThai);
};

/**
 * Hủy đơn hàng
 */
DonHangSchema.methods.cancel = async function(reason = '') {
    if (!this.canCancel()) {
        throw new Error('Không thể hủy đơn hàng ở trạng thái này');
    }
    
    this.TrangThai = 'cancelled';
    this.LyDoHuy = reason;
    this.NgayHuy = new Date();
    
    // Thêm lý do vào ghi chú nếu có
    if (reason) {
        const existingNote = this.GhiChu || '';
        this.GhiChu = existingNote ? `${existingNote}\n\nLý do hủy: ${reason}` : `Lý do hủy: ${reason}`;
    }
    
    return this.save();
};

/**
 * Cập nhật trạng thái
 */
DonHangSchema.methods.updateStatus = async function(status) {
    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái không hợp lệ');
    }
    
    this.TrangThai = status;
    return this.save();
};

/**
 * Xác nhận đơn hàng
 */
DonHangSchema.methods.confirm = async function() {
    if (this.TrangThai !== 'pending') {
        throw new Error('Chỉ có thể xác nhận đơn hàng ở trạng thái pending');
    }
    
    this.TrangThai = 'confirmed';
    return this.save();
};

/**
 * Đánh dấu đang giao hàng
 */
DonHangSchema.methods.ship = async function() {
    if (this.TrangThai !== 'confirmed') {
        throw new Error('Chỉ có thể giao đơn hàng đã xác nhận');
    }
    
    this.TrangThai = 'shipping';
    return this.save();
};

/**
 * Đánh dấu đã gửi file (cho đồ án)
 */
DonHangSchema.methods.markAsSent = async function() {
    if (this.TrangThai !== 'confirmed' && this.TrangThai !== 'paid') {
        throw new Error('Chỉ có thể gửi file cho đơn hàng đã xác nhận hoặc đã thanh toán');
    }
    
    this.TrangThai = 'sent';
    this.DaGuiEmail = true;
    this.NgayGuiEmail = new Date();
    
    // Set expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    this.HetHanTai = expiryDate;
    
    return this.save();
};

/**
 * Đánh dấu đã tải về
 */
DonHangSchema.methods.markAsDownloaded = async function() {
    if (this.TrangThai !== 'sent') {
        throw new Error('Chỉ có thể đánh dấu đã tải cho đơn hàng đã gửi');
    }
    
    this.TrangThai = 'downloaded';
    return this.save();
};

/**
 * Hoàn thành đơn hàng
 */
DonHangSchema.methods.complete = async function() {
    if (this.TrangThai !== 'shipping') {
        throw new Error('Chỉ có thể hoàn thành đơn hàng đang giao');
    }
    
    this.TrangThai = 'delivered';
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Lấy đơn hàng theo trạng thái
 */
DonHangSchema.statics.findByStatus = function(status, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ TrangThai: status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Lấy đơn hàng theo phương thức thanh toán
 */
DonHangSchema.statics.findByPaymentMethod = function(method, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({ PhuongThucThanhToan: method })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Lấy đơn hàng theo khoảng thời gian
 */
DonHangSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Tìm kiếm đơn hàng theo địa chỉ
 */
DonHangSchema.statics.searchByAddress = function(keyword, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({
        DiaChi: { $regex: keyword, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Đếm đơn hàng theo trạng thái
 */
DonHangSchema.statics.countByStatus = function(status) {
    return this.countDocuments({ TrangThai: status });
};

/**
 * Tính tổng doanh thu
 */
DonHangSchema.statics.getTotalRevenue = async function(filter = {}) {
    const result = await this.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                total: { $sum: '$TongTien' }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

/**
 * Tính doanh thu theo ngày
 */
DonHangSchema.statics.getRevenueByDate = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                },
                TrangThai: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                totalRevenue: { $sum: '$TongTien' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

/**
 * Thống kê theo trạng thái
 */
DonHangSchema.statics.getStatisticsByStatus = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$TrangThai',
                count: { $sum: 1 },
                totalAmount: { $sum: '$TongTien' }
            }
        }
    ]);
};

/**
 * Thống kê theo phương thức thanh toán
 */
DonHangSchema.statics.getStatisticsByPaymentMethod = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$PhuongThucThanhToan',
                count: { $sum: 1 },
                totalAmount: { $sum: '$TongTien' }
            }
        }
    ]);
};

/**
 * Lấy với phân trang
 */
DonHangSchema.statics.paginate = async function(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        this.find(filter)
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

module.exports = mongoose.model('DonHang', DonHangSchema);
