const mongoose = require('mongoose');
const DonHang = require('../models/DonHang');
const TaiKhoan = require('../models/Taikhoan');
const SanPham = require('../models/SanPham');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } = require('../../constants');

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
    async cancelDonHang(req, res) {
        try {
            const orderId = req.params.id;
            const userId = req.user?.id;
            const { reason } = req.body; // Lý do hủy đơn hàng
            
            if (!orderId) {
                return errorResponse(res, 'Thiếu ID đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }

            // Tìm đơn hàng
            const donHang = await DonHang.findById(orderId);
            
            if (!donHang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Safely populate customer for permission check
            const customer = await populateCustomer(donHang.MaKhachHang);
            if (customer) {
                donHang.MaKhachHang = customer;
            }

            // Kiểm tra quyền: User chỉ có thể hủy đơn của mình, trừ khi là admin
            const isAdmin = req.user?.MaVaiTro?.TenVaiTro === 'admin' || 
                           req.user?.role === 'admin' ||
                           (req.user?.MaVaiTro && typeof req.user.MaVaiTro === 'object' && req.user.MaVaiTro.TenVaiTro === 'admin');
            
            if (!isAdmin) {
                // Kiểm tra user có phải chủ đơn hàng không
                const orderCustomerId = typeof donHang.MaKhachHang === 'string' 
                    ? donHang.MaKhachHang 
                    : (typeof donHang.MaKhachHang === 'object' && donHang.MaKhachHang?._id 
                        ? donHang.MaKhachHang._id.toString() 
                        : donHang.MaKhachHang?.toString() || donHang.MaKhachHang);
                
                if (orderCustomerId !== userId?.toString()) {
                    return errorResponse(res, 'Bạn không có quyền hủy đơn hàng này', HTTP_STATUS.FORBIDDEN);
                }
            }

            // Kiểm tra trạng thái đơn hàng có thể hủy không
            if (!donHang.canCancel()) {
                const statusMessages = {
                    'shipping': 'Đơn hàng đang được giao, không thể hủy',
                    'delivered': 'Đơn hàng đã được giao, không thể hủy',
                    'cancelled': 'Đơn hàng đã được hủy trước đó'
                };
                const message = statusMessages[donHang.TrangThai] || 'Đơn hàng không thể được hủy ở trạng thái này';
                return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
            }

            // Lưu thông tin trước khi hủy để xử lý hoàn tiền và cập nhật kho
            const originalStatus = donHang.TrangThai;
            const originalPaymentStatus = donHang.TrangThaiThanhToan;
            const products = donHang.SanPham || [];

            // Cập nhật lại số lượng sản phẩm trong kho
            const SanPham = require('../models/SanPham');
            const stockUpdates = [];
            
            for (const item of products) {
                try {
                    const productId = item.MaSanPham || item.id || item._id;
                    if (!productId) continue;

                    const product = await SanPham.findById(productId);
                    if (product) {
                        const quantity = item.SoLuong || item.quantity || 1;
                        // Tăng lại số lượng trong kho
                        await product.increaseStock(quantity);
                        stockUpdates.push({ productId, productName: product.TenSanPham, quantity });
                    }
                } catch (stockError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Lỗi khi cập nhật kho cho sản phẩm ${item.MaSanPham}:`, stockError);
                    }
                    // Tiếp tục xử lý các sản phẩm khác
                }
            }

            // Cập nhật trạng thái đơn hàng
            const cancelReason = reason || 'Khách hàng yêu cầu hủy đơn hàng';
            donHang.LyDoHuy = cancelReason;
            donHang.NgayHuy = new Date();
            const existingNote = donHang.GhiChu || '';
            donHang.GhiChu = existingNote ? `${existingNote}\n\nLý do hủy: ${cancelReason}` : `Lý do hủy: ${cancelReason}`;
            donHang.TrangThai = ORDER_STATUS.CANCELLED;
            
            // Xử lý hoàn tiền nếu đã thanh toán
            if (originalPaymentStatus === PAYMENT_STATUS.PAID) {
                donHang.TrangThaiThanhToan = PAYMENT_STATUS.REFUNDED;
                // TODO: Tích hợp với payment gateway để hoàn tiền thực tế
                // Ví dụ: VNPay refund, bank transfer refund, etc.
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
                    // Không fail nếu email lỗi, vẫn hủy đơn thành công
                }
            }

            // Populate lại để trả về đầy đủ thông tin
            const updatedOrder = await DonHang.findById(orderId)
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .lean();
            
            // Safely populate customer
            if (updatedOrder) {
                const customer = await populateCustomer(updatedOrder.MaKhachHang);
                if (customer) {
                    updatedOrder.MaKhachHang = customer;
                }
            }

            return successResponse(res, { 
                donHang: updatedOrder,
                stockUpdates: stockUpdates.length > 0 ? stockUpdates : undefined,
                refundStatus: originalPaymentStatus === PAYMENT_STATUS.PAID ? 'pending' : null
            }, 'Đơn hàng đã được hủy thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi hủy đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi hủy đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async checkout(req, res) {
        try {
            // ✅ Hỗ trợ cả user và guest
            const userId = req.user?.id || req.body?.guestId || generateGuestCode();
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
                const product = await SanPham.findById(productId);
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
                
                // ✅ Tính giá (có khuyến mãi)
                const price = product.KhuyenMai > 0 
                    ? product.Gia * (1 - product.KhuyenMai / 100) 
                    : product.Gia;
                const itemTotal = price * quantity;
                calculatedTotal += itemTotal;
                
                validatedProducts.push({
                    MaSanPham: productId,
                    TenSanPham: product.TenSanPham,
                    SoLuong: quantity,
                    Gia: price,
                    TongTien: itemTotal,
                    HinhAnhChinh: product.HinhAnhChinh
                });
            }
            
            // ✅ Validate tổng tiền (cho phép sai số nhỏ do làm tròn)
            if (Math.abs(calculatedTotal - parseFloat(TongTien || 0)) > 1000) {
                return errorResponse(
                    res,
                    `Tổng tiền không khớp. Tính toán: ${calculatedTotal}, Nhận được: ${TongTien}`,
                    HTTP_STATUS.BAD_REQUEST
                );
            }
            
            // ✅ Xử lý địa chỉ
            const normalizedInfo = normalizeGuestInfo(ThongTinNhanHang);
            const diaChiFinal = buildAddressFromInput(DiaChi, normalizedInfo);
            
            if (!diaChiFinal) {
                return errorResponse(res, 'Địa chỉ giao hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // ✅ Sử dụng Transaction để đảm bảo atomicity
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                // Giảm số lượng tồn kho
                for (const item of validatedProducts) {
                    const product = await SanPham.findById(item.MaSanPham).session(session);
                    await product.decreaseStock(item.SoLuong);
                }
                
                // Tạo đơn hàng
                const donHang = await DonHang.create([{
                    MaKhachHang: userId,
                    SanPham: validatedProducts,
                    TongTien: calculatedTotal,
                    DiaChi: diaChiFinal,
                    ThongTinNhanHang: normalizedInfo,
                    PhiVanChuyen: 0,
                    PhuongThucThanhToan: PhuongThucThanhToan,
                    TrangThaiThanhToan: PhuongThucThanhToan === PAYMENT_METHODS.COD ? 'pending' : 'pending',
                    TrangThai: ORDER_STATUS.PENDING,
                    GhiChu: GhiChu || '',
                    Voucher: Voucher || null
                }], { session });
                
                await session.commitTransaction();
                session.endSession();
                
                const donHangObj = donHang[0].toObject();
                const orderId = donHangObj._id.toString();
                
                const response = {
                    orderId: orderId,
                    donHang: donHangObj,
                    requiresPayment: PhuongThucThanhToan !== PAYMENT_METHODS.COD,
                    paymentMethod: PhuongThucThanhToan
                };
                
                return successResponse(
                    res,
                    response,
                    PhuongThucThanhToan === PAYMENT_METHODS.COD
                        ? 'Đơn hàng đã được tạo'
                        : 'Đơn hàng đã được tạo. Vui lòng thanh toán.',
                    HTTP_STATUS.OK
                );
            } catch (transactionError) {
                await session.abortTransaction();
                session.endSession();
                throw transactionError;
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi thanh toán đơn hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi thanh toán đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
                const product = await SanPham.findById(productId);
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
                
                // ✅ Tính giá (có khuyến mãi)
                const price = product.KhuyenMai > 0 
                    ? product.Gia * (1 - product.KhuyenMai / 100) 
                    : product.Gia;
                const itemTotal = price * quantity;
                calculatedTotal += itemTotal;
                
                validatedProducts.push({
                    MaSanPham: productId,
                    TenSanPham: product.TenSanPham,
                    SoLuong: quantity,
                    Gia: price,
                    TongTien: itemTotal,
                    HinhAnhChinh: product.HinhAnhChinh
                });
            }
            
            // ✅ Validate tổng tiền (cho phép sai số nhỏ do làm tròn)
            if (Math.abs(calculatedTotal - parseFloat(TongTien || 0)) > 1000) {
                return errorResponse(
                    res,
                    `Tổng tiền không khớp. Tính toán: ${calculatedTotal}, Nhận được: ${TongTien}`,
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
                for (const item of validatedProducts) {
                    const product = await SanPham.findById(item.MaSanPham).session(session);
                    await product.decreaseStock(item.SoLuong);
                }
                
                // Tạo đơn hàng
                const donHang = await DonHang.create([{
                    MaKhachHang: guestId,
                    SanPham: validatedProducts,
                    TongTien: calculatedTotal,
                    DiaChi: diaChiFinal,
                    ThongTinNhanHang: normalizedInfo,
                    PhiVanChuyen: 0,
                    PhuongThucThanhToan: PhuongThucThanhToan,
                    TrangThaiThanhToan: PhuongThucThanhToan === PAYMENT_METHODS.COD ? 'pending' : 'pending',
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
                    requiresPayment: PhuongThucThanhToan !== PAYMENT_METHODS.COD,
                    paymentMethod: PhuongThucThanhToan
                };

                const message = PhuongThucThanhToan === PAYMENT_METHODS.COD
                    ? 'Đơn hàng đã được tạo'
                    : 'Đơn hàng đã được tạo. Vui lòng thanh toán.';

                return successResponse(res, response, message, HTTP_STATUS.OK);
            } catch (transactionError) {
                await session.abortTransaction();
                session.endSession();
                throw transactionError;
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi guest checkout:', error);
            }
            return errorResponse(res, 'Lỗi khi thanh toán đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new DonHangController();