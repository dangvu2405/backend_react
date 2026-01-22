const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const TaiKhoan = require('../models/Taikhoan');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../../constants');

class AdminWalletController {
    /**
     * Lấy danh sách tất cả ví
     * GET /admin/wallets
     */
    async getAllWallets(req, res) {
        try {
            const {
                page = PAGINATION.DEFAULT_PAGE,
                limit = PAGINATION.DEFAULT_LIMIT,
                search,
                status,
                minBalance,
                maxBalance
            } = req.query;
            
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT));
            const skip = (pageNum - 1) * limitNum;
            
            const filter = {};
            
            if (status) {
                filter.TrangThai = status;
            }
            
            if (minBalance !== undefined || maxBalance !== undefined) {
                filter.SoDu = {};
                if (minBalance !== undefined) filter.SoDu.$gte = parseFloat(minBalance);
                if (maxBalance !== undefined) filter.SoDu.$lte = parseFloat(maxBalance);
            }
            
            let wallets;
            let total;
            
            if (search) {
                // Search by user name or email
                const users = await TaiKhoan.find({
                    $or: [
                        { HoTen: { $regex: search, $options: 'i' } },
                        { Email: { $regex: search, $options: 'i' } },
                        { TenDangNhap: { $regex: search, $options: 'i' } }
                    ]
                }).select('_id');
                
                const userIds = users.map(u => u._id);
                filter.MaNguoiDung = { $in: userIds };
                
                [wallets, total] = await Promise.all([
                    Wallet.find(filter)
                        .populate('MaNguoiDung', 'HoTen Email TenDangNhap')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limitNum),
                    Wallet.countDocuments(filter)
                ]);
            } else {
                [wallets, total] = await Promise.all([
                    Wallet.find(filter)
                        .populate('MaNguoiDung', 'HoTen Email TenDangNhap')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limitNum),
                    Wallet.countDocuments(filter)
                ]);
            }
            
            return paginatedResponse(
                res,
                wallets,
                pageNum,
                limitNum,
                total,
                { message: 'Lấy danh sách ví thành công' }
            );
        } catch (error) {
            console.error('Lỗi khi lấy danh sách ví:', error);
            return errorResponse(res, 'Lỗi khi lấy danh sách ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy chi tiết ví của một user
     * GET /admin/wallets/:userId
     */
    async getWalletByUserId(req, res) {
        try {
            const { userId } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return errorResponse(res, 'ID người dùng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            const wallet = await Wallet.getByUserId(userId);
            
            if (!wallet) {
                return errorResponse(res, 'Ví không tồn tại', HTTP_STATUS.NOT_FOUND);
            }
            
            await wallet.populate('MaNguoiDung', 'HoTen Email TenDangNhap SoDienThoai');
            
            // Get recent transactions
            const recentTransactions = await WalletTransaction.find({ MaNguoiDung: userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('MaDonHang', 'MaDonHang TongTien');
            
            return successResponse(res, {
                wallet,
                recentTransactions
            }, 'Lấy thông tin ví thành công');
        } catch (error) {
            console.error('Lỗi khi lấy thông tin ví:', error);
            return errorResponse(res, 'Lỗi khi lấy thông tin ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Điều chỉnh số dư ví (Admin only)
     * POST /admin/wallets/:userId/adjust
     */
    async adjustBalance(req, res) {
        try {
            const { userId } = req.params;
            const { amount, reason, type } = req.body;
            const adminId = req.user.id || req.user._id;
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return errorResponse(res, 'ID người dùng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            const adjustAmount = parseFloat(amount);
            if (!adjustAmount || adjustAmount === 0) {
                return errorResponse(res, 'Số tiền điều chỉnh phải khác 0', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (!reason || reason.trim().length === 0) {
                return errorResponse(res, 'Lý do điều chỉnh là bắt buộc', HTTP_STATUS.BAD_REQUEST);
            }
            
            const wallet = await Wallet.getByUserId(userId);
            if (!wallet) {
                return errorResponse(res, 'Ví không tồn tại', HTTP_STATUS.NOT_FOUND);
            }
            
            const soDuTruoc = wallet.SoDu;
            const adjustmentType = type || (adjustAmount > 0 ? 'deposit' : 'withdraw');
            
            if (adjustmentType === 'withdraw' && wallet.SoDu < Math.abs(adjustAmount)) {
                return errorResponse(res, 'Số dư không đủ để điều chỉnh', HTTP_STATUS.BAD_REQUEST);
            }
            
            // Adjust balance
            if (adjustmentType === 'deposit') {
                wallet.SoDu += Math.abs(adjustAmount);
            } else {
                wallet.SoDu -= Math.abs(adjustAmount);
            }
            
            await wallet.save();
            
            // Create transaction record
            const transaction = await WalletTransaction.create({
                MaVi: wallet._id,
                MaNguoiDung: userId,
                Loai: 'adjustment',
                SoTien: Math.abs(adjustAmount),
                SoDuTruoc: soDuTruoc,
                SoDuSau: wallet.SoDu,
                TrangThai: 'completed',
                PhuongThuc: 'admin',
                MoTa: `Điều chỉnh số dư bởi admin: ${reason}`,
                NguoiThucHien: adminId
            });
            
            return successResponse(res, {
                wallet: {
                    balance: wallet.SoDu,
                    previousBalance: soDuTruoc,
                    adjustment: adjustAmount
                },
                transaction: {
                    id: transaction._id,
                    type: adjustmentType,
                    amount: Math.abs(adjustAmount)
                }
            }, 'Điều chỉnh số dư thành công');
        } catch (error) {
            console.error('Lỗi khi điều chỉnh số dư:', error);
            return errorResponse(res, 'Lỗi khi điều chỉnh số dư', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Khóa/Mở khóa ví
     * PUT /admin/wallets/:userId/status
     */
    async updateWalletStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status, reason } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return errorResponse(res, 'ID người dùng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            if (!['active', 'frozen', 'suspended'].includes(status)) {
                return errorResponse(res, 'Trạng thái không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
            const wallet = await Wallet.getByUserId(userId);
            if (!wallet) {
                return errorResponse(res, 'Ví không tồn tại', HTTP_STATUS.NOT_FOUND);
            }
            
            const oldStatus = wallet.TrangThai;
            wallet.TrangThai = status;
            
            if (reason) {
                wallet.GhiChu = reason;
            }
            
            await wallet.save();
            
            return successResponse(res, {
                wallet: {
                    id: wallet._id,
                    status: wallet.TrangThai,
                    previousStatus: oldStatus
                }
            }, 'Cập nhật trạng thái ví thành công');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái ví:', error);
            return errorResponse(res, 'Lỗi khi cập nhật trạng thái ví', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy lịch sử giao dịch của một user (Admin)
     * GET /admin/wallets/:userId/transactions
     */
    async getUserTransactions(req, res) {
        try {
            const { userId } = req.params;
            const {
                page = PAGINATION.DEFAULT_PAGE,
                limit = PAGINATION.DEFAULT_LIMIT,
                type,
                status,
                startDate,
                endDate
            } = req.query;
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return errorResponse(res, 'ID người dùng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
            
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
     * Thống kê tổng quan ví
     * GET /admin/wallets/statistics
     */
    async getStatistics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            const matchFilter = {
                TrangThai: 'completed'
            };
            
            if (startDate || endDate) {
                matchFilter.createdAt = {};
                if (startDate) {
                    matchFilter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    matchFilter.createdAt.$lte = new Date(endDate);
                }
            }
            
            const stats = await WalletTransaction.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: '$Loai',
                        totalAmount: { $sum: '$SoTien' },
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const totalWallets = await Wallet.countDocuments();
            const activeWallets = await Wallet.countDocuments({ TrangThai: 'active' });
            const totalBalance = await Wallet.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$SoDu' }
                    }
                }
            ]);
            
            const result = {
                totalWallets,
                activeWallets,
                frozenWallets: await Wallet.countDocuments({ TrangThai: 'frozen' }),
                suspendedWallets: await Wallet.countDocuments({ TrangThai: 'suspended' }),
                totalBalance: totalBalance.length > 0 ? totalBalance[0].total : 0,
                transactions: {
                    totalDeposit: 0,
                    totalWithdraw: 0,
                    totalRefund: 0,
                    depositCount: 0,
                    withdrawCount: 0,
                    refundCount: 0
                }
            };
            
            stats.forEach(stat => {
                if (stat._id === 'deposit') {
                    result.transactions.totalDeposit = stat.totalAmount;
                    result.transactions.depositCount = stat.count;
                } else if (stat._id === 'withdraw') {
                    result.transactions.totalWithdraw = stat.totalAmount;
                    result.transactions.withdrawCount = stat.count;
                } else if (stat._id === 'refund') {
                    result.transactions.totalRefund = stat.totalAmount;
                    result.transactions.refundCount = stat.count;
                }
            });
            
            return successResponse(res, result, 'Lấy thống kê thành công');
        } catch (error) {
            console.error('Lỗi khi lấy thống kê:', error);
            return errorResponse(res, 'Lỗi khi lấy thống kê', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new AdminWalletController();
