const DonHang = require('../models/DonHang');
const TaiKhoan = require('../models/Taikhoan');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES, ORDER_STATUS, PAYMENT_METHODS } = require('../../constants');

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
            console.error('Lỗi khi lấy đơn hàng: ', error);
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
            console.error('Lỗi khi tạo đơn hàng: ', error);
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
            console.error('Lỗi khi lấy chi tiết đơn hàng: ', error);
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
                .populate('MaKhachHang', 'HoTen Email SoDienThoai')
                .lean();

            if (!updatedOrder) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            return successResponse(res, updatedOrder, 'Đơn hàng đã được cập nhật thành công', HTTP_STATUS.OK);
        } catch (error) {
            console.error('Lỗi khi cập nhật đơn hàng: ', error);
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

            // Populate customer info cho mỗi đơn hàng
            const ordersWithCustomer = await Promise.all(
                orders.map(async (order) => {
                    let customer = null;
                    // MaKhachHang có thể là string (userId) hoặc ObjectId
                    if (order.MaKhachHang) {
                        try {
                            customer = await TaiKhoan.findById(order.MaKhachHang)
                                .select('HoTen Email SoDienThoai')
                                .lean();
                        } catch (err) {
                            console.error('Error populating customer:', err);
                        }
                    }

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
                        } : null,
                        TongTien: order.TongTien || 0,
                        TrangThai: order.TrangThai,
                        PhuongThucThanhToan: order.PhuongThucThanhToan,
                        DiaChi: order.DiaChi,
                        PhiVanChuyen: order.PhiVanChuyen || 0,
                        GhiChu: order.GhiChu || '',
                        SanPham: order.SanPham || [],
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt
                    };
                })
            );

            return paginatedResponse(res, ordersWithCustomer, page, limit, total);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
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
                return res.status(400).json({ message: 'Thiếu ID đơn hàng' });
            }

            const order = await DonHang.findById(orderId).lean();

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Populate customer
            let customer = null;
            if (order.MaKhachHang) {
                try {
                    customer = await TaiKhoan.findById(order.MaKhachHang)
                        .select('HoTen Email SoDienThoai DiaChi')
                        .lean();
                } catch (err) {
                    console.error('Error populating customer:', err);
                }
            }

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
                } : null,
                TongTien: order.TongTien || 0,
                TrangThai: order.TrangThai,
                PhuongThucThanhToan: order.PhuongThucThanhToan,
                DiaChi: order.DiaChi,
                PhiVanChuyen: order.PhiVanChuyen || 0,
                GhiChu: order.GhiChu || '',
                SanPham: order.SanPham || [],
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }, 'Lấy chi tiết đơn hàng thành công', HTTP_STATUS.OK);
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
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
            const donHang = await DonHang.findById(orderId)
                .populate('MaKhachHang', 'HoTen Email SoDienThoai');
            
            if (!donHang) {
                return errorResponse(res, MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            // Kiểm tra quyền: User chỉ có thể hủy đơn của mình, trừ khi là admin
            const isAdmin = req.user?.MaVaiTro?.TenVaiTro === 'admin' || 
                           req.user?.role === 'admin' ||
                           (req.user?.MaVaiTro && typeof req.user.MaVaiTro === 'object' && req.user.MaVaiTro.TenVaiTro === 'admin');
            
            if (!isAdmin) {
                // Kiểm tra user có phải chủ đơn hàng không
                const orderCustomerId = typeof donHang.MaKhachHang === 'string' 
                    ? donHang.MaKhachHang 
                    : donHang.MaKhachHang?._id?.toString() || donHang.MaKhachHang?.toString();
                
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
                    console.error(`Lỗi khi cập nhật kho cho sản phẩm ${item.MaSanPham}:`, stockError);
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
                    console.error('Lỗi khi gửi email thông báo hủy đơn hàng:', emailError);
                    // Không fail nếu email lỗi, vẫn hủy đơn thành công
                }
            }

            // Populate lại để trả về đầy đủ thông tin
            const updatedOrder = await DonHang.findById(orderId)
                .populate('MaKhachHang', 'HoTen Email SoDienThoai')
                .populate('SanPham.MaSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh')
                .lean();

            return successResponse(res, { 
                donHang: updatedOrder,
                stockUpdates: stockUpdates.length > 0 ? stockUpdates : undefined,
                refundStatus: originalPaymentStatus === PAYMENT_STATUS.PAID ? 'pending' : null
            }, 'Đơn hàng đã được hủy thành công', HTTP_STATUS.OK);
        } catch (error) {
            console.error('Lỗi khi hủy đơn hàng: ', error);
            return errorResponse(res, 'Lỗi khi hủy đơn hàng: ' + error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async checkout(req,res){
        try {
            console.log('=== CHECKOUT REQUEST ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('User ID:', req.user?.id);
            
            const userId = req.user?.id;
            const { DiaChi, SanPham, TongTien, PhuongThucThanhToan, GhiChu, Voucher, ThongTinNhanHang } = req.body;
            
            if(!SanPham || !TongTien || !PhuongThucThanhToan){
                console.log('Validation failed - missing required fields');
                return errorResponse(res, 'Thiếu thông tin để thanh toán', HTTP_STATUS.BAD_REQUEST);
            }

            // Tạo đơn hàng
            // Xử lý DiaChi - có thể là ObjectId (string) hoặc object (địa chỉ mới)
            const normalizedInfo = normalizeGuestInfo(ThongTinNhanHang);
            const diaChiFinal = buildAddressFromInput(DiaChi, normalizedInfo);

            if (!diaChiFinal) {
                return errorResponse(res, 'Địa chỉ giao hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const donHang = await DonHang.create({
                MaKhachHang: userId || 'guest',
                SanPham: SanPham,
                TongTien: TongTien,
                DiaChi: diaChiFinal,
                ThongTinNhanHang: normalizedInfo,
                PhiVanChuyen: 0,
                PhuongThucThanhToan: PhuongThucThanhToan,
                TrangThaiThanhToan: PhuongThucThanhToan === PAYMENT_METHODS.COD ? 'pending' : 'pending',
                TrangThai: ORDER_STATUS.PENDING,
                GhiChu: GhiChu || '',
                Voucher: Voucher || null
            });

            // Convert Mongoose document to plain object để đảm bảo _id được serialize đúng
            const donHangObj = donHang.toObject ? donHang.toObject() : donHang;
            
            // Đảm bảo _id tồn tại và là string
            const orderIdStr = (donHang._id?.toString() || donHangObj._id?.toString() || donHangObj._id || donHang._id).toString();
            if (donHangObj._id) {
                donHangObj._id = orderIdStr;
            }

            console.log('Order created successfully:', {
                orderId: orderIdStr,
                orderIdType: typeof orderIdStr,
                paymentMethod: PhuongThucThanhToan
            });

            // Đảm bảo orderId có trong response và là string
            const orderId = orderIdStr;

            // Nếu là COD, trả về đơn hàng luôn
            if (PhuongThucThanhToan === PAYMENT_METHODS.COD) {
                const response = { 
                    orderId: orderId,
                    donHang: donHangObj,
                    requiresPayment: false
                };
                console.log('Sending COD response:', JSON.stringify(response, null, 2));
                return successResponse(res, response, 'Đơn hàng đã được tạo', HTTP_STATUS.OK);
            }

            // Nếu là VNPay, trả về đơn hàng và yêu cầu thanh toán
            const response = { 
                orderId: orderId,
                donHang: donHangObj,
                requiresPayment: true,
                paymentMethod: PhuongThucThanhToan
            };
            console.log('Sending payment response:', JSON.stringify(response, null, 2));
            return successResponse(res, response, 'Đơn hàng đã được tạo. Vui lòng thanh toán.', HTTP_STATUS.OK);
        }
        catch(error){
            console.error('Lỗi khi thanh toán đơn hàng: ', error);
            return errorResponse(res, 'Lỗi khi thanh toán đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    async guestCheckout(req, res) {
        try {
            console.log('=== GUEST CHECKOUT REQUEST ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));

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

            if (!TongTien || Number(TongTien) <= 0) {
                return errorResponse(res, 'Tổng tiền không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            if (!PhuongThucThanhToan) {
                return errorResponse(res, 'Vui lòng chọn phương thức thanh toán', HTTP_STATUS.BAD_REQUEST);
            }

            const diaChiFinal = buildAddressFromInput(DiaChi, normalizedInfo);
            if (!diaChiFinal) {
                return errorResponse(res, 'Địa chỉ giao hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const guestId = req.user?.id || generateGuestCode();

            const donHang = await DonHang.create({
                MaKhachHang: guestId,
                SanPham,
                TongTien,
                DiaChi: diaChiFinal,
                ThongTinNhanHang: normalizedInfo,
                PhiVanChuyen: 0,
                PhuongThucThanhToan,
                TrangThaiThanhToan: PhuongThucThanhToan === PAYMENT_METHODS.COD ? 'pending' : 'pending',
                TrangThai: ORDER_STATUS.PENDING,
                GhiChu: GhiChu || '',
                Voucher: Voucher || null
            });

            const donHangObj = donHang.toObject ? donHang.toObject() : donHang;
            const orderIdStr = (donHang._id?.toString() || donHangObj._id?.toString() || donHangObj._id || donHang._id).toString();
            if (donHangObj._id) {
                donHangObj._id = orderIdStr;
            }

            const response = {
                orderId: orderIdStr,
                donHang: donHangObj,
                requiresPayment: PhuongThucThanhToan !== PAYMENT_METHODS.COD,
                paymentMethod: PhuongThucThanhToan
            };

            const message = PhuongThucThanhToan === PAYMENT_METHODS.COD
                ? 'Đơn hàng đã được tạo'
                : 'Đơn hàng đã được tạo. Vui lòng thanh toán.';

            console.log('Guest order created:', JSON.stringify(response, null, 2));
            return successResponse(res, response, message, HTTP_STATUS.OK);
        } catch (error) {
            console.error('Lỗi khi guest checkout:', error);
            return errorResponse(res, 'Lỗi khi thanh toán đơn hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new DonHangController();