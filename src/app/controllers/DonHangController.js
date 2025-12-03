const mongoose = require('mongoose');
const DonHang = require('../models/DonHang');
const TaiKhoan = require('../models/Taikhoan');
const SanPham = require('../models/SanPham');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } = require('../../constants');

// ✅ Validate SanPham model được load đúng
if (!SanPham || typeof SanPham.findById !== 'function') {
    console.error('ERROR: SanPham model is not loaded correctly!');
    console.error('SanPham type:', typeof SanPham);
    console.error('SanPham value:', SanPham);
}

// ✅ Helper function để đảm bảo SanPham model hợp lệ
const getSanPhamModel = () => {
    if (!SanPham || typeof SanPham.findById !== 'function') {
        // Fallback: require lại model nếu cần
        const SanPhamModel = require('../models/SanPham');
        if (SanPhamModel && typeof SanPhamModel.findById === 'function') {
            return SanPhamModel;
        }
        throw new Error('SanPham model is not available');
    }
    return SanPham;
};

const normalizeOrderVolumeInput = (input) => {
    if (input === null || input === undefined) {
        return null;
    }

    if (typeof input === 'number' || typeof input === 'string') {
        return { value: input };
    }

    if (typeof input === 'object') {
        return {
            value: input.value ?? input.Value ?? input.dungTich ?? input.DungTich,
            label: input.label ?? input.Label
        };
    }

    return null;
};

const resolveOrderProductVolume = (product, rawInput) => {
    const normalizedOptions = SanPham.normalizeVolumeOptions(
        Array.isArray(product.DungTichOptions) ? product.DungTichOptions : [],
        product.DungTich
    );

    if (!normalizedOptions.length) {
        return { option: null, options: [], explicitRequest: Boolean(rawInput) };
    }

    const normalizedInput = normalizeOrderVolumeInput(rawInput);
    if (!normalizedInput || (normalizedInput.value === undefined && !normalizedInput.label)) {
        const defaultOption = normalizedOptions.find(opt => opt.isDefault) || normalizedOptions[0];
        return { option: defaultOption, options: normalizedOptions, explicitRequest: false };
    }

    const candidateValue = normalizedInput.value;
    let selected = null;

    if (candidateValue !== undefined && candidateValue !== null && candidateValue !== '') {
        selected = normalizedOptions.find(opt => Number(opt.value) === Number(candidateValue));
    }

    if (!selected && normalizedInput.label) {
        const labelText = String(normalizedInput.label).toLowerCase();
        selected = normalizedOptions.find(opt => opt.label?.toLowerCase() === labelText);
    }

    return {
        option: selected || null,
        options: normalizedOptions,
        explicitRequest: true
    };
};

const formatSelectedVolumeForOrder = (option) => {
    if (!option) {
        return undefined;
    }

    return {
        value: option.value,
        label: option.label,
        priceDiff: Number(option.priceDiff) || 0,
        sku: option.sku || ''
    };
};

const computeVariantPriceForOrder = (product, selectedOption) => {
    const basePrice = Number(product.Gia) + Number(selectedOption?.priceDiff || 0);
    const discount = Number(product.KhuyenMai) || 0;
    const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

    return {
        basePrice,
        discount,
        finalPrice
    };
};

const buildAddressFromInput = (DiaChi, ThongTinNhanHang = {}) => {
    if (typeof DiaChi === 'string' && DiaChi.trim()) {
        return DiaChi.trim();
    }

    if (DiaChi && typeof DiaChi === 'object') {
        const addrParts = [
            DiaChi.DiaChiChiTiet,
            DiaChi.PhuongXa,
            DiaChi.QuanHuyen,
            DiaChi.TinhThanh
        ].filter(Boolean);
        if (addrParts.length) {
            return addrParts.join(', ');
        }
    }

    const fallbackParts = [
        ThongTinNhanHang.DiaChiChiTiet,
        ThongTinNhanHang.PhuongXa,
        ThongTinNhanHang.QuanHuyen,
        ThongTinNhanHang.TinhThanh
    ].filter(Boolean);

    return fallbackParts.length ? fallbackParts.join(', ') : '';
};

const normalizeGuestInfo = (info = {}) => ({
    HoTen: info.HoTen?.trim() || '',
    Email: info.Email?.trim() || '',
    SoDienThoai: info.SoDienThoai?.trim() || '',
    DiaChiChiTiet: info.DiaChiChiTiet?.trim() || '',
    PhuongXa: info.PhuongXa?.trim() || '',
    QuanHuyen: info.QuanHuyen?.trim() || '',
    TinhThanh: info.TinhThanh?.trim() || ''
});

const generateGuestCode = () => {
    return `guest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Helper function to safely populate customer info
 * Only populates if MaKhachHang is a valid ObjectId
 */
const populateCustomer = async (maKhachHang) => {
    if (!maKhachHang) {
        return null;
    }
    
    // Check if it's a valid ObjectId (not a guest string)
    if (typeof maKhachHang === 'string' && !mongoose.Types.ObjectId.isValid(maKhachHang)) {
        // It's a guest user, return null
        return null;
    }
    
    // If it's already an object (already populated), return it
    if (typeof maKhachHang === 'object' && maKhachHang._id) {
        return maKhachHang;
    }
    
    // Try to populate from database
    try {
        const customerId = typeof maKhachHang === 'string' ? maKhachHang : maKhachHang.toString();
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return null;
        }
        return await TaiKhoan.findById(customerId)
            .select('HoTen Email SoDienThoai DiaChi')
            .lean();
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error populating customer:', err);
            }
            return null;
        }
};

class DonHangController {
    async getDonHang(req, res) {
        try{
            const userId = req.user.id;
            const donHang = await DonHang.find({ MaKhachHang: userId })
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .sort({ createdAt: -1 })
                .lean();
            
            // Đảm bảo trả về array, ngay cả khi rỗng
            const ordersList = Array.isArray(donHang) ? donHang : [];
            
            return successResponse(res, { donHang: ordersList }, 'Đơn hàng đã được lấy', HTTP_STATUS.OK);
        }
        catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi lấy đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async createDonHang(req, res) {
        try{
            const { userId, productId, quantity } = req.body;
            const donHang = await DonHang.create(req.body);
            if (!donHang) {
                return errorResponse(res, 'Không thể tạo đơn hàng', HTTP_STATUS.NOT_FOUND);
            }
            return successResponse(res, { donHang }, 'Đơn hàng đã được tạo', HTTP_STATUS.OK);
        }
        catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi tạo đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi tạo đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async getDetailDonHang(req, res) {
        try{
            const orderId = req.params.id;
            const donhang = await DonHang.findById(orderId);
            if (!donhang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
            return successResponse(res, { donHang: donhang }, 'Đơn hàng đã được lấy chi tiết', HTTP_STATUS.OK);
        }
        catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy chi tiết đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi lấy chi tiết đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async updateDonHang(req, res) {
        try {
            const orderId = req.params.id;
            const { 
                TrangThai, 
                PhuongThucThanhToan, 
                DiaChi, 
                PhiVanChuyen, 
                GhiChu,
                TongTien 
            } = req.body;

            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }

            const updateFields = {};
            if (TrangThai !== undefined) updateFields.TrangThai = TrangThai;
            if (PhuongThucThanhToan !== undefined) updateFields.PhuongThucThanhToan = PhuongThucThanhToan;
            if (DiaChi !== undefined) updateFields.DiaChi = DiaChi.trim();
            if (PhiVanChuyen !== undefined) updateFields.PhiVanChuyen = PhiVanChuyen;
            if (GhiChu !== undefined) updateFields.GhiChu = GhiChu.trim();
            if (TongTien !== undefined) updateFields.TongTien = TongTien;

            if (Object.keys(updateFields).length === 0) {
                return errorResponse(res, 'Không có dữ liệu để cập nhật', HTTP_STATUS.BAD_REQUEST);
            }

            const updatedOrder = await DonHang.findByIdAndUpdate(
                orderId,
                { $set: updateFields },
                { new: true, runValidators: true }
            )
                .lean();

            if (!updatedOrder) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Safely populate customer
            const customer = await populateCustomer(updatedOrder.MaKhachHang);
            if (customer) {
                updatedOrder.MaKhachHang = customer;
            }

            return successResponse(res, updatedOrder, 'Đơn hàng đã được cập nhật thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi cập nhật đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi cập nhật đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy tất cả đơn hàng với thông tin khách hàng (Admin)
     */
    async getAllOrders(req, res) {
        try {
            const { page = 1, limit = 50, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            
            const filter = {};
            if (status) {
                filter.TrangThai = status;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Lấy đơn hàng và populate customer
            const [orders, total] = await Promise.all([
                DonHang.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                DonHang.countDocuments(filter)
            ]);

            // Populate customer info và sản phẩm cho mỗi đơn hàng
            const ordersWithCustomer = await Promise.all(
                orders.map(async (order) => {
                    // Safely populate customer (only if valid ObjectId)
                    const customer = await populateCustomer(order.MaKhachHang);
                    
                    // Nếu là guest user, sử dụng ThongTinNhanHang
                    const isGuest = !customer && (typeof order.MaKhachHang === 'string' && 
                        (order.MaKhachHang.startsWith('guest-') || !mongoose.Types.ObjectId.isValid(order.MaKhachHang)));

                    // Populate sản phẩm - đảm bảo có TenSanPham
                    const populatedProducts = await Promise.all(
                        (order.SanPham || []).map(async (item) => {
                            // Nếu đã có TenSanPham, giữ nguyên
                            if (item.TenSanPham) {
                                return item;
                            }
                            
                            // Nếu có MaSanPham và là ObjectId hợp lệ, populate từ database
                            const productId = item.MaSanPham || item.IdSanPham || item._id;
                            if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                                try {
                                    const product = await SanPham.findById(productId)
                                        .select('TenSanPham Gia KhuyenMai HinhAnhChinh')
                                        .lean();
                                    if (product) {
                                        return {
                                            ...item,
                                            TenSanPham: product.TenSanPham,
                                            Gia: item.Gia || product.Gia,
                                            HinhAnhChinh: item.HinhAnhChinh || product.HinhAnhChinh
                                        };
                                    }
                                } catch (err) {
                                    console.error(`Error populating product ${productId}:`, err);
                                }
                            }
                            
                            // Fallback: trả về item với TenSanPham mặc định
                            return {
                                ...item,
                                TenSanPham: item.TenSanPham || 'Sản phẩm không xác định'
                            };
                        })
                    );

                    // Tạo mã đơn hàng từ _id
                    const maDonHang = order._id.toString().slice(-8).toUpperCase();

                    return {
                        _id: order._id,
                        MaDonHang: maDonHang,
                        IdKhachHang: customer ? {
                            _id: customer._id,
                            HoTen: customer.HoTen,
                            Email: customer.Email,
                            SoDienThoai: customer.SoDienThoai
                        } : (isGuest && order.ThongTinNhanHang ? {
                            HoTen: order.ThongTinNhanHang.HoTen,
                            Email: order.ThongTinNhanHang.Email,
                            SoDienThoai: order.ThongTinNhanHang.SoDienThoai,
                            isGuest: true
                        } : null),
                        TongTien: order.TongTien || 0,
                        TrangThai: order.TrangThai,
                        PhuongThucThanhToan: order.PhuongThucThanhToan,
                        DiaChi: order.DiaChi,
                        PhiVanChuyen: order.PhiVanChuyen || 0,
                        GhiChu: order.GhiChu || '',
                        SanPham: populatedProducts,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt
                    };
                })
            );

            return paginatedResponse(res, ordersWithCustomer, page, limit, total);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            }
            return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy chi tiết đơn hàng với thông tin khách hàng (Admin)
     */
    async getOrderDetail(req, res) {
        try {
            const orderId = req.params.id;
            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return errorResponse(res, 'ID đơn hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const order = await DonHang.findById(orderId).lean();

            if (!order) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Safely populate customer (only if valid ObjectId)
            const customer = await populateCustomer(order.MaKhachHang);
            
            // Nếu là guest user, sử dụng ThongTinNhanHang
            const isGuest = !customer && (typeof order.MaKhachHang === 'string' && 
                (order.MaKhachHang.startsWith('guest-') || !mongoose.Types.ObjectId.isValid(order.MaKhachHang)));

            // Populate sản phẩm - đảm bảo có TenSanPham
            const populatedProducts = await Promise.all(
                (order.SanPham || []).map(async (item) => {
                    // Nếu đã có TenSanPham, giữ nguyên
                    if (item.TenSanPham) {
                        return item;
                    }
                    
                    // Nếu có MaSanPham và là ObjectId hợp lệ, populate từ database
                    const productId = item.MaSanPham || item.IdSanPham || item._id;
                    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                        try {
                            const product = await SanPham.findById(productId)
                                .select('TenSanPham Gia KhuyenMai HinhAnhChinh')
                                .lean();
                            if (product) {
                                return {
                                    ...item,
                                    TenSanPham: product.TenSanPham,
                                    Gia: item.Gia || product.Gia,
                                    HinhAnhChinh: item.HinhAnhChinh || product.HinhAnhChinh
                                };
                            }
                        } catch (err) {
                            if (process.env.NODE_ENV === 'development') {
                                console.error(`Error populating product ${productId}:`, err);
                            }
                        }
                    }
                    
                    // Fallback: trả về item với TenSanPham mặc định
                    return {
                        ...item,
                        TenSanPham: item.TenSanPham || 'Sản phẩm không xác định'
                    };
                })
            );

            const maDonHang = order._id.toString().slice(-8).toUpperCase();

            return successResponse(res, {
                _id: order._id,
                MaDonHang: maDonHang,
                IdKhachHang: customer ? {
                    _id: customer._id,
                    HoTen: customer.HoTen,
                    Email: customer.Email,
                    SoDienThoai: customer.SoDienThoai,
                    DiaChi: customer.DiaChi
                } : (isGuest && order.ThongTinNhanHang ? {
                    HoTen: order.ThongTinNhanHang.HoTen,
                    Email: order.ThongTinNhanHang.Email,
                    SoDienThoai: order.ThongTinNhanHang.SoDienThoai,
                    DiaChi: buildAddressFromInput(order.DiaChi, order.ThongTinNhanHang),
                    isGuest: true
                } : null),
                TongTien: order.TongTien || 0,
                TrangThai: order.TrangThai,
                PhuongThucThanhToan: order.PhuongThucThanhToan,
                DiaChi: order.DiaChi,
                PhiVanChuyen: order.PhiVanChuyen || 0,
                GhiChu: order.GhiChu || '',
                SanPham: populatedProducts,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }, 'Lấy chi tiết đơn hàng thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            }
            return errorResponse(res, 'Lỗi khi lấy chi tiết đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteDonHang(req, res) {
        return successResponse(res, null, 'Đơn hàng đã được xóa', HTTP_STATUS.OK);
    }
    /**
     * Khách hàng gửi yêu cầu hủy đơn hàng (không hủy ngay)
     * Đơn hàng sẽ được chuyển sang trạng thái yêu cầu hủy (TrangThaiHuy = requested)
     * Admin sẽ xác nhận hủy hoặc từ chối ở các API riêng
     */
    async requestCancelDonHang(req, res) {
        try {
            const orderId = req.params.id;
            const userId = req.user?.id;
            const { reason } = req.body;
            
            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }

            // Tìm đơn hàng
            const donHang = await DonHang.findById(orderId);
            if (!donHang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Kiểm tra quyền: chỉ chủ đơn hàng mới được gửi yêu cầu hủy
            const orderCustomerId = typeof donHang.MaKhachHang === 'string'
                ? donHang.MaKhachHang
                : (typeof donHang.MaKhachHang === 'object' && donHang.MaKhachHang?._id
                    ? donHang.MaKhachHang._id.toString()
                    : donHang.MaKhachHang?.toString() || donHang.MaKhachHang);

            if (!userId || orderCustomerId !== userId.toString()) {
                return errorResponse(res, 'Bạn không có quyền yêu cầu hủy đơn hàng này', HTTP_STATUS.FORBIDDEN);
            }

            // Không cho phép yêu cầu hủy khi đơn đã hủy hoặc đã giao
            if (!donHang.canCancel()) {
                const statusMessages = {
                    shipping: 'Đơn hàng đang được giao, không thể yêu cầu hủy',
                    delivered: 'Đơn hàng đã được giao, không thể yêu cầu hủy',
                    cancelled: 'Đơn hàng đã được hủy trước đó'
                };
                const message = statusMessages[donHang.TrangThai] || 'Đơn hàng không thể được hủy ở trạng thái này';
                return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
            }

            // Nếu đã có yêu cầu hủy đang chờ xử lý
            if (donHang.TrangThaiHuy === 'requested') {
                return errorResponse(res, 'Đơn hàng đã có yêu cầu hủy và đang chờ admin xử lý', HTTP_STATUS.BAD_REQUEST);
            }

            // Lưu trạng thái hiện tại để có thể khôi phục khi admin từ chối
            donHang.TrangThaiTruocKhiHuy = donHang.TrangThai;
            donHang.TrangThaiHuy = 'requested';
            donHang.LyDoHuy = reason || 'Khách hàng yêu cầu hủy đơn hàng';
            donHang.NguoiYeuCauHuy = userId;
            donHang.NgayYeuCauHuy = new Date();

            const existingNote = donHang.GhiChu || '';
            const requestNote = `Khách yêu cầu hủy đơn hàng${reason ? `: ${reason}` : ''}`;
            donHang.GhiChu = existingNote ? `${existingNote}\n\n${requestNote}` : requestNote;

            await donHang.save();

            const updatedOrder = await DonHang.findById(orderId)
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .lean();

            return successResponse(
                res,
                { donHang: updatedOrder },
                'Yêu cầu hủy đơn hàng đã được gửi. Vui lòng chờ admin xác nhận.',
                HTTP_STATUS.OK
            );
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi gửi yêu cầu hủy đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi gửi yêu cầu hủy đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Admin xác nhận hủy đơn hàng (thực hiện hủy thật sự)
     * Được dùng trong route /admin/orders/:id/cancel
     */
    async cancelDonHang(req, res) {
        try {
            const orderId = req.params.id;
            const adminId = req.user?.id;
            const { reason } = req.body; // Lý do hủy thêm của admin (optional)

            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }

            // Tìm đơn hàng
            const donHang = await DonHang.findById(orderId);
            if (!donHang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Chỉ admin mới được gọi API này (route đã có adminMiddleware, đây là lớp bảo vệ bổ sung)
            const isAdmin = req.user?.MaVaiTro?.TenVaiTro === 'admin' || 
                           req.user?.role === 'admin' ||
                           (req.user?.MaVaiTro && typeof req.user.MaVaiTro === 'object' && req.user.MaVaiTro.TenVaiTro === 'admin');
            
            if (!isAdmin) {
                return errorResponse(res, 'Chỉ admin mới có quyền hủy đơn hàng', HTTP_STATUS.FORBIDDEN);
            }

            // Không cho hủy nếu đã hủy trước đó
            if (donHang.TrangThai === ORDER_STATUS.CANCELLED) {
                return errorResponse(res, 'Đơn hàng đã được hủy trước đó', HTTP_STATUS.BAD_REQUEST);
            }

            // Kiểm tra trạng thái đơn hàng có thể hủy không
            if (!donHang.canCancel()) {
                const statusMessages = {
                    shipping: 'Đơn hàng đang được giao, không thể hủy',
                    delivered: 'Đơn hàng đã được giao, không thể hủy'
                };
                const message = statusMessages[donHang.TrangThai] || 'Đơn hàng không thể được hủy ở trạng thái này';
                return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
            }

            // Lưu thông tin trước khi hủy để xử lý hoàn tiền và cập nhật kho
            const originalStatus = donHang.TrangThai;
            const originalPaymentStatus = donHang.TrangThaiThanhToan;
            const products = donHang.SanPham || [];

            const stockUpdates = [];
            
            // Cập nhật lại số lượng sản phẩm trong kho
            for (const item of products) {
                try {
                    const productId = item.MaSanPham || item.id || item._id;
                    if (!productId) continue;

                    const product = await SanPham.findById(productId);
                    if (product) {
                        const quantity = item.SoLuong || item.quantity || 1;
                        await product.increaseStock(quantity);
                        stockUpdates.push({ productId, productName: product.TenSanPham, quantity });
                    }
                } catch (stockError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Lỗi khi cập nhật kho cho sản phẩm ${item.MaSanPham}:`, stockError);
                    }
                }
            }

            // Cập nhật trạng thái đơn hàng
            const cancelReason = reason ||
                donHang.LyDoHuy ||
                (donHang.TrangThaiHuy === 'requested' ? 'Khách hàng yêu cầu hủy đơn hàng' : 'Admin hủy đơn hàng');

            donHang.LyDoHuy = cancelReason;
            donHang.NgayHuy = new Date();
            const existingNote = donHang.GhiChu || '';
            const cancelNote = `Đơn hàng đã được admin hủy${cancelReason ? `: ${cancelReason}` : ''}`;
            donHang.GhiChu = existingNote ? `${existingNote}\n\n${cancelNote}` : cancelNote;
            donHang.TrangThai = ORDER_STATUS.CANCELLED;

            // Cập nhật trạng thái quy trình hủy
            donHang.TrangThaiHuy = 'approved';
            donHang.HuyByAdmin = adminId || null;
            donHang.NgayXuLyHuy = new Date();
            
            // Xử lý hoàn tiền nếu đã thanh toán
            if (originalPaymentStatus === PAYMENT_STATUS.PAID) {
                donHang.TrangThaiThanhToan = PAYMENT_STATUS.REFUNDED;
                // TODO: tích hợp gateway thanh toán để hoàn tiền thực tế (VNPay, MoMo, ...)
            }

            await donHang.save();

            // Gửi email thông báo hủy đơn hàng
            const { sendOrderCancellationEmail } = require('../../utils/email');
            let customerEmail = null;
            
            if (donHang.MaKhachHang) {
                if (typeof donHang.MaKhachHang === 'object' && donHang.MaKhachHang.Email) {
                    customerEmail = donHang.MaKhachHang.Email;
                } else if (donHang.ThongTinNhanHang?.Email) {
                    customerEmail = donHang.ThongTinNhanHang.Email;
                }
            }

            if (customerEmail) {
                try {
                    await sendOrderCancellationEmail(customerEmail, donHang, cancelReason);
                } catch (emailError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Lỗi khi gửi email thông báo hủy đơn hàng:', emailError);
                    }
                }
            }

            // Populate lại để trả về đầy đủ thông tin
            const updatedOrder = await DonHang.findById(orderId)
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .lean();
            
            if (updatedOrder) {
                const customer = await populateCustomer(updatedOrder.MaKhachHang);
                if (customer) {
                    updatedOrder.MaKhachHang = customer;
                }
            }

            return successResponse(
                res,
                {
                donHang: updatedOrder,
                stockUpdates: stockUpdates.length > 0 ? stockUpdates : undefined,
                refundStatus: originalPaymentStatus === PAYMENT_STATUS.PAID ? 'pending' : null
                },
                'Đơn hàng đã được hủy thành công',
                HTTP_STATUS.OK
            );
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi hủy đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi hủy đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Admin từ chối yêu cầu hủy đơn hàng
     * - Đơn hàng quay lại trạng thái trước khi khách yêu cầu hủy (TrangThaiTruocKhiHuy)
     */
    async rejectCancelDonHang(req, res) {
        try {
            const orderId = req.params.id;
            const adminId = req.user?.id;
            const { reason } = req.body;

            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }

            const donHang = await DonHang.findById(orderId);
            if (!donHang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            const isAdmin = req.user?.MaVaiTro?.TenVaiTro === 'admin' ||
                req.user?.role === 'admin' ||
                (req.user?.MaVaiTro && typeof req.user.MaVaiTro === 'object' && req.user.MaVaiTro.TenVaiTro === 'admin');

            if (!isAdmin) {
                return errorResponse(res, 'Chỉ admin mới có quyền xử lý yêu cầu hủy đơn hàng', HTTP_STATUS.FORBIDDEN);
            }

            if (donHang.TrangThaiHuy !== 'requested') {
                return errorResponse(
                    res,
                    'Đơn hàng hiện không có yêu cầu hủy đang chờ xử lý',
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            // Khôi phục trạng thái trước khi khách yêu cầu hủy (nếu có lưu)
            if (donHang.TrangThaiTruocKhiHuy) {
                donHang.TrangThai = donHang.TrangThaiTruocKhiHuy;
            }

            donHang.TrangThaiHuy = 'rejected';
            donHang.HuyByAdmin = adminId || null;
            donHang.NgayXuLyHuy = new Date();
            donHang.LyDoHuyAdmin = reason || 'Admin từ chối yêu cầu hủy đơn hàng';

            const existingNote = donHang.GhiChu || '';
            const rejectNote = `Admin từ chối yêu cầu hủy đơn hàng${reason ? `: ${reason}` : ''}`;
            donHang.GhiChu = existingNote ? `${existingNote}\n\n${rejectNote}` : rejectNote;

            await donHang.save();

            const updatedOrder = await DonHang.findById(orderId)
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .lean();

            return successResponse(
                res,
                { donHang: updatedOrder },
                'Đã từ chối yêu cầu hủy đơn hàng và khôi phục trạng thái cũ',
                HTTP_STATUS.OK
            );
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi từ chối yêu cầu hủy đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi từ chối yêu cầu hủy đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async checkout(req, res) {
        try {
            // ✅ Hỗ trợ cả user và guest
            let userId = req.user?.id || req.user?._id || req.body?.guestId;
            
            // Convert userId sang string nếu là ObjectId
            if (userId) {
                if (typeof userId === 'object' && userId.toString) {
                    userId = userId.toString();
                } else if (typeof userId !== 'string') {
                    userId = String(userId);
                }
            } else {
                userId = generateGuestCode();
            }
            
            const { DiaChi, SanPham, TongTien, PhuongThucThanhToan, GhiChu, Voucher, ThongTinNhanHang } = req.body;
            
            // ✅ Validate input
            if (!SanPham || !Array.isArray(SanPham) || SanPham.length === 0) {
                return errorResponse(res, 'Giỏ hàng trống', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (!PhuongThucThanhToan) {
                return errorResponse(res, 'Vui lòng chọn phương thức thanh toán', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate và kiểm tra tồn kho
            const validatedProducts = [];
            let calculatedTotal = 0;
            
            for (const item of SanPham) {
                const productId = item.MaSanPham || item._id || item.id;
                const quantity = parseInt(item.SoLuong || item.quantity || 1);
                
                if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                    return errorResponse(res, `Sản phẩm không hợp lệ: ${productId}`, HTTP_STATUS.BAD_REQUEST);
                }
                
                if (!quantity || quantity <= 0) {
                    return errorResponse(res, `Số lượng không hợp lệ cho sản phẩm ${productId}`, HTTP_STATUS.BAD_REQUEST);
                }
                
                // ✅ Kiểm tra sản phẩm tồn tại và còn hàng
                const SanPhamModel = getSanPhamModel();
                const product = await SanPhamModel.findById(productId);
                if (!product) {
                    return errorResponse(res, `Sản phẩm không tồn tại: ${productId}`, HTTP_STATUS.NOT_FOUND);
                }
                
                if (!product.hasStock(quantity)) {
                    return errorResponse(
                        res,
                        `Sản phẩm "${product.TenSanPham}" chỉ còn ${product.SoLuong} sản phẩm. Bạn đã chọn ${quantity}.`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }
                
                const selectionInput = item.selectedDungTich || item.SelectedDungTich || item.volume;
                const { option: resolvedVolume, options: volumeOptions, explicitRequest } = resolveOrderProductVolume(product, selectionInput);

                if (volumeOptions.length && explicitRequest && !resolvedVolume) {
                    return errorResponse(
                        res,
                        `Dung tích đã chọn cho sản phẩm "${product.TenSanPham}" không hợp lệ`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }

                const { finalPrice } = computeVariantPriceForOrder(product, resolvedVolume);
                const itemTotal = finalPrice * quantity;
                calculatedTotal += itemTotal;
                
                validatedProducts.push({
                    MaSanPham: productId,
                    TenSanPham: product.TenSanPham,
                    SoLuong: quantity,
                    Gia: finalPrice,
                    TongTien: itemTotal,
                    HinhAnhChinh: product.HinhAnhChinh,
                    SelectedDungTich: formatSelectedVolumeForOrder(resolvedVolume)
                });
            }
            
            // ✅ Validate tổng tiền
            // Frontend có thể đã tính voucher discount, nên nếu frontend total < calculatedTotal
            // và chênh lệch hợp lý (< 20%), thì chấp nhận tổng tiền từ frontend
            const frontendTotal = parseFloat(TongTien || 0);
            const difference = Math.abs(calculatedTotal - frontendTotal);
            const maxDiscountPercent = 0.2; // Cho phép giảm tối đa 20%
            const maxDiscountAmount = calculatedTotal * maxDiscountPercent;
            
            let finalTotal = calculatedTotal;
            
            // Nếu frontend total nhỏ hơn (có thể do voucher hoặc làm tròn)
            if (frontendTotal < calculatedTotal) {
                // Kiểm tra xem chênh lệch có hợp lý không (do voucher hoặc làm tròn)
                if (difference <= maxDiscountAmount) {
                    // Chấp nhận tổng tiền từ frontend (đã tính voucher hoặc làm tròn)
                    finalTotal = frontendTotal;
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Using frontend total (with discount/rounding):', finalTotal);
                        console.log('Difference:', difference, 'Max allowed:', maxDiscountAmount);
                    }
                } else {
                    // Chênh lệch quá lớn, có thể có lỗi
                    if (process.env.NODE_ENV === 'development') {
                        console.log('=== TONG TIEN VALIDATION ERROR ===');
                        console.log('Calculated total (backend):', calculatedTotal);
                        console.log('Received total (frontend):', frontendTotal);
                        console.log('Difference:', difference);
                        console.log('Max allowed discount:', maxDiscountAmount);
                        console.log('Has voucher:', !!Voucher, Voucher);
                        console.log('===================================');
                    }
                    
                return errorResponse(
                    res,
                        `Tổng tiền không khớp. Tính toán: ${calculatedTotal.toLocaleString('vi-VN')}, Nhận được: ${frontendTotal.toLocaleString('vi-VN')}`,
                    HTTP_STATUS.BAD_REQUEST
                );
            }
            } else if (frontendTotal > calculatedTotal) {
                // Frontend total lớn hơn - có thể có lỗi hoặc phí vận chuyển
                // Cho phép sai số nhỏ do làm tròn (1000đ)
                if (difference > 1000) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('=== TONG TIEN VALIDATION ERROR ===');
                        console.log('Frontend total is higher than calculated');
                        console.log('Calculated total (backend):', calculatedTotal);
                        console.log('Received total (frontend):', frontendTotal);
                        console.log('Difference:', difference);
                        console.log('===================================');
                    }
                    
                    return errorResponse(
                        res,
                        `Tổng tiền không khớp. Tính toán: ${calculatedTotal.toLocaleString('vi-VN')}, Nhận được: ${frontendTotal.toLocaleString('vi-VN')}`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }
            }
            // Nếu frontendTotal === calculatedTotal hoặc chênh lệch <= 1000, giữ nguyên calculatedTotal
            
            // ✅ Xử lý địa chỉ
            const normalizedInfo = normalizeGuestInfo(ThongTinNhanHang);
            const diaChiFinal = buildAddressFromInput(DiaChi, normalizedInfo);
            
            if (!diaChiFinal || diaChiFinal.trim().length < 10) {
                return errorResponse(res, 'Địa chỉ giao hàng không hợp lệ (phải có ít nhất 10 ký tự)', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate userId
            if (!userId) {
                return errorResponse(res, 'Không xác định được khách hàng', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Validate userId format (phải là ObjectId hợp lệ hoặc guest code)
            const isValidUserId = mongoose.Types.ObjectId.isValid(userId) || 
                                 (typeof userId === 'string' && userId.startsWith('guest-'));
            if (!isValidUserId) {
                return errorResponse(res, `Mã khách hàng không hợp lệ: ${userId}`, HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Validate PhuongThucThanhToan với enum
            const validPaymentMethods = ['COD', 'VNPay', 'VNPayQR', 'BANK', 'CARD', 'MoMo', 'Chuyển khoản'];
            if (!validPaymentMethods.includes(PhuongThucThanhToan)) {
                return errorResponse(res, `Phương thức thanh toán không hợp lệ: ${PhuongThucThanhToan}`, HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Sử dụng Transaction để đảm bảo atomicity
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // Giảm số lượng tồn kho
                const SanPhamModel = getSanPhamModel();
                
                for (const item of validatedProducts) {
                    const productId = mongoose.Types.ObjectId.isValid(item.MaSanPham) 
                        ? new mongoose.Types.ObjectId(item.MaSanPham)
                        : item.MaSanPham;
                    
                    const product = await SanPhamModel.findById(productId).session(session);
                    
                    if (!product) {
                        throw new Error(`Sản phẩm không tồn tại trong transaction: ${item.MaSanPham}`);
                    }
                    
                    // Kiểm tra lại tồn kho trong transaction (có thể đã thay đổi)
                    if (!product.hasStock(item.SoLuong)) {
                        throw new Error(`Sản phẩm "${product.TenSanPham}" không đủ hàng. Chỉ còn ${product.SoLuong} sản phẩm.`);
                    }
                    
                    await product.decreaseStock(item.SoLuong, { session });
                }
                
                // Convert MaSanPham sang ObjectId cho validatedProducts và đảm bảo tất cả trường required
                const productsForOrder = validatedProducts.map(item => {
                    const productId = mongoose.Types.ObjectId.isValid(item.MaSanPham)
                        ? new mongoose.Types.ObjectId(item.MaSanPham)
                        : item.MaSanPham;
                    
                    return {
                        MaSanPham: productId,
                        TenSanPham: item.TenSanPham || 'Sản phẩm không xác định',
                        SoLuong: item.SoLuong,
                        Gia: item.Gia || 0,
                        TongTien: item.TongTien || 0,
                        HinhAnhChinh: item.HinhAnhChinh || ''
                    };
                });
                
                // Validate dữ liệu trước khi tạo
                const orderData = {
                    MaKhachHang: userId,
                    SanPham: productsForOrder,
                    TongTien: finalTotal,
                    DiaChi: diaChiFinal.trim(),
                    ThongTinNhanHang: Object.keys(normalizedInfo).length > 0 ? normalizedInfo : null,
                    PhiVanChuyen: 0,
                    PhuongThucThanhToan: PhuongThucThanhToan,
                    TrangThaiThanhToan: 'pending',
                    TrangThai: ORDER_STATUS.PENDING,
                    GhiChu: (GhiChu || '').trim(),
                    Voucher: Voucher || null
                };
                
                // Log dữ liệu trong development
                if (process.env.NODE_ENV === 'development') {
                    console.log('Creating order with data:', JSON.stringify({
                        ...orderData,
                        SanPham: orderData.SanPham.map(p => ({ ...p, MaSanPham: p.MaSanPham.toString() }))
                    }, null, 2));
                }
                
                // Tạo đơn hàng
                const donHang = await DonHang.create([orderData], { session });
                
                await session.commitTransaction();
                session.endSession();
                
                const donHangObj = donHang[0].toObject();
                const orderId = donHangObj._id.toString();
                
                const response = {
                    orderId: orderId,
                    donHang: donHangObj,
                    requiresPayment: PhuongThucThanhToan !== PAYMENT_METHODS.COD && PhuongThucThanhToan !== 'COD',
                    paymentMethod: PhuongThucThanhToan
                };
                
                return successResponse(
                    res,
                    response,
                    (PhuongThucThanhToan === PAYMENT_METHODS.COD || PhuongThucThanhToan === 'COD')
                        ? 'Đơn hàng đã được tạo'
                        : 'Đơn hàng đã được tạo. Vui lòng thanh toán.',
                    HTTP_STATUS.OK
                );
            } catch (transactionError) {
                // Đảm bảo abort transaction và đóng session
                try {
                    if (session.inTransaction()) {
                await session.abortTransaction();
                    }
                } catch (abortError) {
                    console.error('Error aborting transaction:', abortError);
                }
                try {
                session.endSession();
                } catch (endError) {
                    console.error('Error ending session:', endError);
                }
                
                // Log chi tiết lỗi transaction
                console.error('=== TRANSACTION ERROR IN CHECKOUT ===');
                console.error('Error name:', transactionError.name);
                console.error('Error message:', transactionError.message);
                if (transactionError.errors) {
                    console.error('Validation errors:', JSON.stringify(transactionError.errors, null, 2));
                }
                console.error('Stack trace:', transactionError.stack);
                console.error('=====================================');
                
                throw transactionError;
            }
        } catch (error) {
            // Log chi tiết lỗi
            console.error('=== CHECKOUT ERROR ===');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            if (error.errors) {
                console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
            }
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            console.error('Request body:', JSON.stringify({
                ...req.body,
                SanPham: req.body?.SanPham?.map(p => ({ MaSanPham: p.MaSanPham, SoLuong: p.SoLuong }))
            }, null, 2));
            console.error('User ID:', req.user?.id);
            console.error('====================');
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Lỗi khi thanh toán đơn hàng';
            let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            
            if (error.name === 'ValidationError') {
                // Lấy tất cả lỗi validation
                const validationErrors = error.errors ? Object.values(error.errors).map(e => e.message).join(', ') : error.message;
                errorMessage = `Dữ liệu không hợp lệ: ${validationErrors}`;
                statusCode = HTTP_STATUS.BAD_REQUEST;
            } else if (error.name === 'CastError') {
                errorMessage = `Dữ liệu không đúng định dạng: ${error.message}`;
                statusCode = HTTP_STATUS.BAD_REQUEST;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return errorResponse(
                res, 
                errorMessage,
                statusCode
            );
        }
    }
    
    async guestCheckout(req, res) {
        try {
            const {
                ThongTinNhanHang,
                DiaChi,
                SanPham,
                TongTien,
                PhuongThucThanhToan,
                GhiChu,
                Voucher
            } = req.body;

            if (!ThongTinNhanHang) {
                return errorResponse(res, 'Vui lòng cung cấp thông tin nhận hàng', HTTP_STATUS.BAD_REQUEST);
            }

            const normalizedInfo = normalizeGuestInfo(ThongTinNhanHang);
            const requiredFields = ['HoTen', 'SoDienThoai', 'DiaChiChiTiet', 'PhuongXa', 'QuanHuyen', 'TinhThanh'];
            const missingFields = requiredFields.filter((field) => !normalizedInfo[field]);

            if (missingFields.length) {
                return errorResponse(res, 'Vui lòng nhập đầy đủ thông tin nhận hàng', HTTP_STATUS.BAD_REQUEST);
            }

            if (!Array.isArray(SanPham) || SanPham.length === 0) {
                return errorResponse(res, MESSAGES.CART_EMPTY, HTTP_STATUS.BAD_REQUEST);
            }

            if (!PhuongThucThanhToan) {
                return errorResponse(res, 'Vui lòng chọn phương thức thanh toán', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Validate và kiểm tra tồn kho (giống checkout)
            const validatedProducts = [];
            let calculatedTotal = 0;
            
            for (const item of SanPham) {
                const productId = item.MaSanPham || item._id || item.id;
                const quantity = parseInt(item.SoLuong || item.quantity || 1);
                
                if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                    return errorResponse(res, `Sản phẩm không hợp lệ: ${productId}`, HTTP_STATUS.BAD_REQUEST);
                }
                
                if (!quantity || quantity <= 0) {
                    return errorResponse(res, `Số lượng không hợp lệ cho sản phẩm ${productId}`, HTTP_STATUS.BAD_REQUEST);
                }
                
                // ✅ Kiểm tra sản phẩm tồn tại và còn hàng
                const SanPhamModel = getSanPhamModel();
                const product = await SanPhamModel.findById(productId);
                if (!product) {
                    return errorResponse(res, `Sản phẩm không tồn tại: ${productId}`, HTTP_STATUS.NOT_FOUND);
                }
                
                if (!product.hasStock(quantity)) {
                    return errorResponse(
                        res,
                        `Sản phẩm "${product.TenSanPham}" chỉ còn ${product.SoLuong} sản phẩm. Bạn đã chọn ${quantity}.`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }
                
                const selectionInput = item.selectedDungTich || item.SelectedDungTich || item.volume;
                const { option: resolvedVolume, options: volumeOptions, explicitRequest } = resolveOrderProductVolume(product, selectionInput);

                if (volumeOptions.length && explicitRequest && !resolvedVolume) {
                    return errorResponse(
                        res,
                        `Dung tích đã chọn cho sản phẩm "${product.TenSanPham}" không hợp lệ`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }

                const { finalPrice } = computeVariantPriceForOrder(product, resolvedVolume);
                const itemTotal = finalPrice * quantity;
                calculatedTotal += itemTotal;
                
                validatedProducts.push({
                    MaSanPham: productId,
                    TenSanPham: product.TenSanPham,
                    SoLuong: quantity,
                    Gia: finalPrice,
                    TongTien: itemTotal,
                    HinhAnhChinh: product.HinhAnhChinh,
                    SelectedDungTich: formatSelectedVolumeForOrder(resolvedVolume)
                });
            }
            
            // ✅ Validate tổng tiền (giống checkout)
            const frontendTotal = parseFloat(TongTien || 0);
            const difference = Math.abs(calculatedTotal - frontendTotal);
            const maxDiscountPercent = 0.2; // Cho phép giảm tối đa 20%
            const maxDiscountAmount = calculatedTotal * maxDiscountPercent;
            
            let finalTotal = calculatedTotal;
            
            if (frontendTotal < calculatedTotal) {
                if (difference <= maxDiscountAmount) {
                    finalTotal = frontendTotal;
                } else {
                return errorResponse(
                    res,
                        `Tổng tiền không khớp. Tính toán: ${calculatedTotal.toLocaleString('vi-VN')}, Nhận được: ${frontendTotal.toLocaleString('vi-VN')}`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }
            } else if (frontendTotal > calculatedTotal && difference > 1000) {
                return errorResponse(
                    res,
                    `Tổng tiền không khớp. Tính toán: ${calculatedTotal.toLocaleString('vi-VN')}, Nhận được: ${frontendTotal.toLocaleString('vi-VN')}`,
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            const diaChiFinal = buildAddressFromInput(DiaChi, normalizedInfo);
            if (!diaChiFinal) {
                return errorResponse(res, 'Địa chỉ giao hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const guestId = req.user?.id || generateGuestCode();

            // ✅ Sử dụng Transaction để đảm bảo atomicity (giống checkout)
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // Giảm số lượng tồn kho
                const SanPhamModel = getSanPhamModel();
                
                for (const item of validatedProducts) {
                    const productId = mongoose.Types.ObjectId.isValid(item.MaSanPham) 
                        ? new mongoose.Types.ObjectId(item.MaSanPham)
                        : item.MaSanPham;
                    
                    const product = await SanPhamModel.findById(productId).session(session);
                    
                    if (!product) {
                        throw new Error(`Sản phẩm không tồn tại trong transaction: ${item.MaSanPham}`);
                    }
                    
                    // Kiểm tra lại tồn kho trong transaction (có thể đã thay đổi)
                    if (!product.hasStock(item.SoLuong)) {
                        throw new Error(`Sản phẩm "${product.TenSanPham}" không đủ hàng. Chỉ còn ${product.SoLuong} sản phẩm.`);
                    }
                    
                    await product.decreaseStock(item.SoLuong, { session });
                }
                
                // Convert MaSanPham sang ObjectId cho validatedProducts
                const productsForOrder = validatedProducts.map(item => ({
                    ...item,
                    MaSanPham: mongoose.Types.ObjectId.isValid(item.MaSanPham)
                        ? new mongoose.Types.ObjectId(item.MaSanPham)
                        : item.MaSanPham
                }));
                
                // Tạo đơn hàng
                const donHang = await DonHang.create([{
                    MaKhachHang: guestId,
                    SanPham: productsForOrder,
                    TongTien: finalTotal,
                    DiaChi: diaChiFinal,
                    ThongTinNhanHang: normalizedInfo,
                    PhiVanChuyen: 0,
                    PhuongThucThanhToan: PhuongThucThanhToan,
                    TrangThaiThanhToan: (PhuongThucThanhToan === PAYMENT_METHODS.COD || PhuongThucThanhToan === 'COD') ? 'pending' : 'pending',
                    TrangThai: ORDER_STATUS.PENDING,
                    GhiChu: GhiChu || '',
                    Voucher: Voucher || null
                }], { session });
                
                await session.commitTransaction();
                session.endSession();
                
                const donHangObj = donHang[0].toObject();
                const orderIdStr = donHangObj._id.toString();

                const response = {
                    orderId: orderIdStr,
                    donHang: donHangObj,
                    requiresPayment: PhuongThucThanhToan !== PAYMENT_METHODS.COD && PhuongThucThanhToan !== 'COD',
                    paymentMethod: PhuongThucThanhToan
                };

                const message = PhuongThucThanhToan === PAYMENT_METHODS.COD
                    ? 'Đơn hàng đã được tạo'
                    : 'Đơn hàng đã được tạo. Vui lòng thanh toán.';

                return successResponse(res, response, message, HTTP_STATUS.OK);
            } catch (transactionError) {
                // Đảm bảo abort transaction và đóng session
                if (session.inTransaction()) {
                await session.abortTransaction();
                }
                session.endSession();
                
                // Log chi tiết lỗi transaction
                if (process.env.NODE_ENV === 'development') {
                    console.error('Transaction error in guestCheckout:', transactionError);
                    console.error('Transaction error stack:', transactionError.stack);
                }
                
                throw transactionError;
            }
        } catch (error) {
            // Log chi tiết lỗi
            if (process.env.NODE_ENV === 'development') {
                console.error('=== GUEST CHECKOUT ERROR ===');
                console.error('Error message:', error.message);
                console.error('Error name:', error.name);
                console.error('Stack trace:', error.stack);
                console.error('Request body:', JSON.stringify(req.body, null, 2));
                console.error('============================');
            }
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Lỗi khi thanh toán đơn hàng';
            
            if (error.name === 'ValidationError') {
                errorMessage = `Dữ liệu không hợp lệ: ${error.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return errorResponse(
                res, 
                process.env.NODE_ENV === 'development' ? errorMessage : 'Lỗi khi thanh toán đơn hàng. Vui lòng thử lại.',
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new DonHangController();