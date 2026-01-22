const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Download = require('../models/Download');
const DoAn = require('../models/DoAn');

/**
 * ============================================
 * 📥 DOWNLOAD SERVICE
 * ============================================
 * Service để quản lý download links và security
 */
class DownloadService {
    constructor() {
        this.SECRET_KEY = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.EXPIRY_HOURS = parseInt(process.env.DOWNLOAD_EXPIRY_HOURS || '168'); // 7 days default
    }

    /**
     * Generate download link với JWT token
     * @param {String} projectId - Mã đồ án
     * @param {String} orderItemId - Mã item trong đơn hàng
     * @param {String} userId - Mã người dùng
     * @returns {Object} { url, expiresAt }
     */
    generateDownloadLink(projectId, orderItemId, userId) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

        const token = jwt.sign(
            {
                project_id: projectId,
                order_item_id: orderItemId,
                user_id: userId,
                expires_at: expiresAt.getTime()
            },
            this.SECRET_KEY,
            { expiresIn: `${this.EXPIRY_HOURS}h` }
        );

        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        const url = `${baseUrl}/api/downloads/${token}`;

        return { url, expiresAt };
    }

    /**
     * Verify và lấy thông tin download
     * @param {String} token - JWT token
     * @returns {Object} Decoded token data
     */
    async verifyAndGetDownloadInfo(token) {
        try {
            const decoded = jwt.verify(token, this.SECRET_KEY);

            // Check expiry
            if (decoded.expires_at && decoded.expires_at < Date.now()) {
                throw new Error('Download link has expired');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Download link has expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid download link');
            }
            throw error;
        }
    }

    /**
     * Verify download access và log download
     * @param {String} token - JWT token
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Object} { project, filePath }
     */
    async verifyAndDownload(token, ipAddress = '', userAgent = '') {
        const decoded = await this.verifyAndGetDownloadInfo(token);

        // Verify project exists
        const project = await DoAn.findById(decoded.project_id);
        if (!project) {
            throw new Error('Đồ án không tồn tại');
        }

        // Verify order item belongs to user
        const DonHang = require('../models/DonHang');
        const order = await DonHang.findOne({
            'DoAn._id': decoded.order_item_id,
            MaKhachHang: decoded.user_id
        });

        if (!order) {
            throw new Error('Không có quyền tải đồ án này');
        }

        // Find the order item
        const orderItem = order.DoAn.find(item => 
            item._id.toString() === decoded.order_item_id
        );

        if (!orderItem) {
            throw new Error('Không tìm thấy item trong đơn hàng');
        }

        // Check if download link is expired
        if (orderItem.HetHanTai && new Date(orderItem.HetHanTai) < new Date()) {
            throw new Error('Link tải đã hết hạn');
        }

        // Log download
        await Download.create({
            MaDonHangItem: decoded.order_item_id,
            MaNguoiDung: decoded.user_id,
            MaDoAn: decoded.project_id,
            DiaChiIP: ipAddress,
            UserAgent: userAgent,
            KichThuocTai: project.KichThuocFile || 0,
            ThanhCong: true
        });

        // Increment download count in order item
        orderItem.SoLuotTai = (orderItem.SoLuotTai || 0) + 1;
        orderItem.NgayTai = new Date();
        await order.save();

        // Increment download count in project
        await project.incrementDownload();

        return {
            project,
            filePath: project.DuongDanFile,
            fileName: project.TieuDe
        };
    }

    /**
     * Generate download links for all items in an order
     * @param {Object} order - Order document
     * @returns {Array} Array of download links
     */
    async generateOrderDownloadLinks(order) {
        if (!order.DoAn || order.DoAn.length === 0) {
            return [];
        }

        const links = [];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

        for (const item of order.DoAn) {
            const { url, expiresAt } = this.generateDownloadLink(
                item.MaDoAn,
                item._id,
                order.MaKhachHang
            );

            item.LinkTai = url;
            item.HetHanTai = expiresAt;

            links.push({
                projectId: item.MaDoAn,
                title: item.TieuDe,
                downloadUrl: url,
                expiresAt: expiresAt
            });
        }

        // Save updated order
        order.HetHanTai = expiryDate;
        await order.save();

        return links;
    }

    /**
     * Get download statistics for a project
     * @param {String} projectId - Project ID
     * @returns {Object} Statistics
     */
    async getDownloadStats(projectId) {
        const stats = await Download.aggregate([
            {
                $match: {
                    MaDoAn: require('mongoose').Types.ObjectId(projectId),
                    ThanhCong: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalDownloads: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$MaNguoiDung' },
                    totalSize: { $sum: '$KichThuocTai' }
                }
            }
        ]);

        if (stats.length === 0) {
            return {
                totalDownloads: 0,
                uniqueUsers: 0,
                totalSize: 0
            };
        }

        return {
            totalDownloads: stats[0].totalDownloads,
            uniqueUsers: stats[0].uniqueUsers.length,
            totalSize: stats[0].totalSize
        };
    }
}

module.exports = new DownloadService();
