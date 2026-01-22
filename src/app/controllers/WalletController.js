const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../../constants');

class WalletController {
    /**
     * Lấy số dư ví của user hiện tại
     * GET /api/wallet
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            
            if (!userId) {
                return errorResponse(res, 'Không tìm thấy thông tin người dùng', HTTP_STATUS.UNAUTHORIZED);
            }
            
            const wallet = await Wallet.getOrCreate(userId);
            
            return successResponse(res, {
                balance: wallet.SoDu,
                status: wallet.TrangThai,
                walletId: wallet._id
            }, 'Lấy số dư ví thành công');
        } catch (error) {
            console.error('Lỗi khi lấy số dư ví:', error);
            return errorResponse(res, 'Lỗi khi lấy số dư ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Nạp tiền vào ví
     * POST /api/wallet/deposit
     */
    async deposit(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            const { amount, paymentMethod, transactionId } = req.body;
            
            if (!userId) {
                return errorResponse(res, 'Không tìm thấy thông tin người dùng', HTTP_STATUS.UNAUTHORIZED);
            }
            
            // Validate amount
            const depositAmount = parseFloat(amount);
            if (!depositAmount || depositAmount <= 0) {
                return errorResponse(res, 'Số tiền nạp phải lớn hơn 0', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (depositAmount > 100000000) { // 100 triệu
                return errorResponse(res, 'Số tiền nạp không được vượt quá 100,000,000 VNĐ', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Get or create wallet
            const wallet = await Wallet.getOrCreate(userId);
            
            // Check wallet status
            if (wallet.TrangThai !== 'active') {
                return errorResponse(res, 'Ví đang bị khóa, không thể nạp tiền', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Create pending transaction first
            const transaction = await WalletTransaction.create({
                MaVi: wallet._id,
                MaNguoiDung: userId,
                Loai: 'deposit',
                SoTien: depositAmount,
                SoDuTruoc: wallet.SoDu,
                SoDuSau: wallet.SoDu, // Will update after payment success
                TrangThai: 'pending',
                PhuongThuc: paymentMethod || 'vnpay',
                MaGiaoDich: transactionId || '',
                MoTa: `Nạp tiền vào ví - ${depositAmount.toLocaleString('vi-VN')} VNĐ`
            });
            
            // TODO: Integrate with payment gateway (VNPay, MoMo, etc.)
            // For now, we'll simulate successful payment
            // In production, this should call payment gateway and update transaction status
            
            // Simulate payment success (remove this in production)
            await wallet.deposit(depositAmount, transaction._id.toString());
            
            // Update transaction status
            transaction.TrangThai = 'completed';
            transaction.SoDuSau = wallet.SoDu;
            await transaction.save();
            
            return successResponse(res, {
                wallet: {
                    balance: wallet.SoDu,
                    previousBalance: wallet.SoDu - depositAmount
                },
                transaction: {
                    id: transaction._id,
                    amount: depositAmount,
                    status: transaction.TrangThai
                }
            }, 'Nạp tiền thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            console.error('Lỗi khi nạp tiền:', error);
            
            if (error.message.includes('khóa')) {
                return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
            }
            
            return errorResponse(res, 'Lỗi khi nạp tiền vào ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy lịch sử giao dịch
     * GET /api/wallet/transactions
     */
    async getTransactions(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            
            if (!userId) {
                return errorResponse(res, 'Không tìm thấy thông tin người dùng', HTTP_STATUS.UNAUTHORIZED);
            }
            
            const {
                page = PAGINATION.DEFAULT_PAGE,
                limit = PAGINATION.DEFAULT_LIMIT,
                type,
                status,
                startDate,
                endDate
            } = req.query;
            
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT));
            
            const transactions = await WalletTransaction.getUserTransactions(userId, {
                page: pageNum,
                limit: limitNum,
                type,
                status,
                startDate,
                endDate
            });
            
            const total = await WalletTransaction.countUserTransactions(userId, {
                ...(type && { Loai: type }),
                ...(status && { TrangThai: status })
            });
            
            return paginatedResponse(
                res,
                transactions,
                pageNum,
                limitNum,
                total,
                { message: 'Lấy lịch sử giao dịch thành công' }
            );
        } catch (error) {
            console.error('Lỗi khi lấy lịch sử giao dịch:', error);
            return errorResponse(res, 'Lỗi khi lấy lịch sử giao dịch', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Thanh toán bằng số dư ví
     * POST /api/wallet/pay
     */
    async pay(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            const { orderId, amount } = req.body;
            
            if (!userId) {
                return errorResponse(res, 'Không tìm thấy thông tin người dùng', HTTP_STATUS.UNAUTHORIZED);
            }
            
            if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
                return errorResponse(res, 'ID đơn hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            const payAmount = parseFloat(amount);
            if (!payAmount || payAmount <= 0) {
                return errorResponse(res, 'Số tiền thanh toán phải lớn hơn 0', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Get wallet
            const wallet = await Wallet.getByUserId(userId);
            if (!wallet) {
                return errorResponse(res, 'Ví không tồn tại', HTTP_STATUS.NOT_FOUND);
            }
            
            // Check balance
            if (!wallet.hasEnoughBalance(payAmount)) {
                return errorResponse(res, 'Số dư ví không đủ để thanh toán', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Get order
            const DonHang = require('../models/DonHang');
            const order = await DonHang.findById(orderId);
            
            if (!order) {
                return errorResponse(res, 'Đơn hàng không tồn tại', HTTP_STATUS.NOT_FOUND);
            }
            
            // Verify order belongs to user
            const orderUserId = order.MaKhachHang.toString();
            const currentUserId = userId.toString();
            
            if (orderUserId !== currentUserId) {
                return errorResponse(res, 'Không có quyền thanh toán đơn hàng này', HTTP_STATUS.FORBIDDEN);
            }
            
            // Verify order amount
            if (Math.abs(order.TongTien - payAmount) > 1000) { // Allow 1000 VNĐ difference
                return errorResponse(res, 'Số tiền thanh toán không khớp với tổng tiền đơn hàng', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Check order status
            if (order.TrangThaiThanhToan === 'paid') {
                return errorResponse(res, 'Đơn hàng đã được thanh toán', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Withdraw from wallet
            await wallet.withdraw(payAmount, orderId);
            
            // Update order payment status
            order.TrangThaiThanhToan = 'paid';
            order.PhuongThucThanhToan = 'Wallet';
            await order.save();
            
            return successResponse(res, {
                wallet: {
                    balance: wallet.SoDu,
                    previousBalance: wallet.SoDu + payAmount
                },
                order: {
                    id: order._id,
                    totalAmount: order.TongTien,
                    paymentStatus: order.TrangThaiThanhToan
                }
            }, 'Thanh toán thành công');
        } catch (error) {
            console.error('Lỗi khi thanh toán bằng ví:', error);
            
            if (error.message.includes('không đủ') || error.message.includes('khóa')) {
                return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
            }
            
            return errorResponse(res, 'Lỗi khi thanh toán bằng ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy thống kê giao dịch
     * GET /api/wallet/statistics
     */
    async getStatistics(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            
            if (!userId) {
                return errorResponse(res, 'Không tìm thấy thông tin người dùng', HTTP_STATUS.UNAUTHORIZED);
            }
            
            const { startDate, endDate } = req.query;
            
            const stats = await WalletTransaction.getStatistics(userId, {
                startDate,
                endDate
            });
            
            const wallet = await Wallet.getByUserId(userId);
            
            return successResponse(res, {
                balance: wallet ? wallet.SoDu : 0,
                statistics: stats
            }, 'Lấy thống kê thành công');
        } catch (error) {
            console.error('Lỗi khi lấy thống kê:', error);
            return errorResponse(res, 'Lỗi khi lấy thống kê', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new WalletController();
