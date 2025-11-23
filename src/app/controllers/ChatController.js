const { ChatRoom, ChatMessage } = require('../models/Chat');
const TaiKhoan = require('../models/Taikhoan');

/**
 * ============================================
 * 💬 CHAT CONTROLLER
 * ============================================
 */
class ChatController {
    /**
     * Get or create chat room for customer
     * Customer tạo hoặc lấy chat room của mình
     */
    getOrCreateChatRoom = async (req, res) => {
        try {
            // ✅ Lấy customerId từ req.user (đã được set bởi authMiddleware)
            const customerId = req.user?.id || req.user?._id?.toString() || req.user?._id;
            
            if (!customerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            // ✅ Convert sang ObjectId nếu cần
            const mongoose = require('mongoose');
            const customerObjectId = mongoose.Types.ObjectId.isValid(customerId)
                ? new mongoose.Types.ObjectId(customerId)
                : customerId;
            
            // Tìm chat room hiện tại của customer
            let chatRoom = await ChatRoom.findOne({
                CustomerId: customerObjectId,
                Status: { $in: ['pending', 'active'] }
            }).populate('AdminId', 'HoTen Email AvatarUrl')
              .populate('CustomerId', 'HoTen Email AvatarUrl');

            // Nếu chưa có, tạo mới
            if (!chatRoom) {
                chatRoom = await ChatRoom.create({
                    CustomerId: customerObjectId,
                    Status: 'pending'
                });
                
                await chatRoom.populate('AdminId', 'HoTen Email AvatarUrl');
                await chatRoom.populate('CustomerId', 'HoTen Email AvatarUrl');
            }

            return res.status(200).json({
                success: true,
                data: chatRoom
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in getOrCreateChatRoom:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo hoặc lấy chat room: ' + error.message
            });
        }
    };

    /**
     * Get all chat rooms for admin
     * Admin xem tất cả các chat rooms
     */
    getChatRooms = async (req, res) => {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;

            const query = {};
            if (status) {
                query.Status = status;
            }

            const chatRooms = await ChatRoom.find(query)
                .populate('CustomerId', 'HoTen Email AvatarUrl TenDangNhap')
                .populate('AdminId', 'HoTen Email AvatarUrl')
                .sort({ LastMessageAt: -1, updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await ChatRoom.countDocuments(query);

            return res.status(200).json({
                success: true,
                data: chatRooms,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in getChatRooms:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách chat rooms: ' + error.message
            });
        }
    };

    /**
     * Get chat room by ID
     */
    getChatRoomById = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id || req.user._id;

            const chatRoom = await ChatRoom.findById(chatRoomId)
                .populate('CustomerId', 'HoTen Email AvatarUrl TenDangNhap')
                .populate('AdminId', 'HoTen Email AvatarUrl');

            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            // Kiểm tra quyền truy cập
            const userRole = req.user.MaVaiTro?.TenVaiTro?.toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'quản trị viên';
            
            if (!isAdmin && chatRoom.CustomerId._id.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chat room này'
                });
            }

            return res.status(200).json({
                success: true,
                data: chatRoom
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in getChatRoomById:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy chat room: ' + error.message
            });
        }
    };

    /**
     * Get messages for a chat room
     */
    getMessages = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (page - 1) * limit;
            const userId = req.user.id || req.user._id;

            // Kiểm tra quyền truy cập chat room
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            const userRole = req.user.MaVaiTro?.TenVaiTro?.toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'quản trị viên';
            
            if (!isAdmin && chatRoom.CustomerId.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chat room này'
                });
            }

            const messages = await ChatMessage.find({ ChatRoomId: chatRoomId })
                .populate('SenderId', 'HoTen Email AvatarUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            // Đảo ngược để hiển thị từ cũ đến mới
            messages.reverse();

            const total = await ChatMessage.countDocuments({ ChatRoomId: chatRoomId });

            return res.status(200).json({
                success: true,
                data: messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in getMessages:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin nhắn: ' + error.message
            });
        }
    };

    /**
     * Assign admin to chat room
     * Admin nhận chat room
     */
    assignAdmin = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const adminId = req.user.id || req.user._id;

            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            chatRoom.AdminId = adminId;
            chatRoom.Status = 'active';
            await chatRoom.save();

            await chatRoom.populate('AdminId', 'HoTen Email AvatarUrl');
            await chatRoom.populate('CustomerId', 'HoTen Email AvatarUrl');

            return res.status(200).json({
                success: true,
                message: 'Đã nhận chat room thành công',
                data: chatRoom
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in assignAdmin:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi nhận chat room: ' + error.message
            });
        }
    };

    /**
     * Close chat room
     */
    closeChatRoom = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id || req.user._id;

            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            // Chỉ admin mới có thể đóng chat room
            const userRole = req.user.MaVaiTro?.TenVaiTro?.toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'quản trị viên';
            
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ admin mới có thể đóng chat room'
                });
            }

            chatRoom.Status = 'closed';
            await chatRoom.save();

            return res.status(200).json({
                success: true,
                message: 'Đã đóng chat room thành công',
                data: chatRoom
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in closeChatRoom:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi đóng chat room: ' + error.message
            });
        }
    };

    /**
     * Mark messages as read
     */
    markAsRead = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id || req.user._id;

            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            const userRole = req.user.MaVaiTro?.TenVaiTro?.toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'quản trị viên';
            
            // Xác định sender type dựa trên role
            const senderType = isAdmin ? 'admin' : 'customer';
            const oppositeSenderType = isAdmin ? 'customer' : 'admin';

            // Đánh dấu các tin nhắn chưa đọc từ người kia là đã đọc
            await ChatMessage.updateMany(
                {
                    ChatRoomId: chatRoomId,
                    SenderType: oppositeSenderType,
                    IsRead: false
                },
                {
                    IsRead: true,
                    ReadAt: new Date()
                }
            );

            // Cập nhật unread count trong chat room
            if (isAdmin) {
                chatRoom.UnreadCount.admin = 0;
            } else {
                chatRoom.UnreadCount.customer = 0;
            }
            await chatRoom.save();

            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu đã đọc'
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in markAsRead:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi đánh dấu đã đọc: ' + error.message
            });
        }
    };

    /**
     * Delete chat room
     * Xóa chat room và tất cả tin nhắn (admin only)
     */
    deleteChatRoom = async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id || req.user._id;

            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room không tồn tại'
                });
            }

            // Chỉ admin mới có thể xóa chat room
            const userRole = req.user.MaVaiTro?.TenVaiTro?.toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'quản trị viên';
            
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ admin mới có thể xóa chat room'
                });
            }

            // Xóa tất cả tin nhắn trong chat room
            await ChatMessage.deleteMany({ ChatRoomId: chatRoomId });

            // Xóa chat room
            await ChatRoom.findByIdAndDelete(chatRoomId);

            return res.status(200).json({
                success: true,
                message: 'Đã xóa chat room thành công'
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error in deleteChatRoom:', error);
            }
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa chat room: ' + error.message
            });
        }
    };
}

module.exports = new ChatController();

