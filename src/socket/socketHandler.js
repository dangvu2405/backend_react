const jwt = require('jsonwebtoken');
const { ChatRoom, ChatMessage } = require('../app/models/Chat');
const TaiKhoan = require('../app/models/Taikhoan');

/**
 * ============================================
 * 💬 SOCKET.IO HANDLER
 * ============================================
 * 
 * Module này xử lý tất cả các kết nối Socket.IO cho tính năng chat real-time.
 * Bao gồm:
 * - Xác thực người dùng qua JWT token
 * - Quản lý kết nối socket của từng user
 * - Xử lý các sự kiện chat: join room, send message, mark as read, leave room
 * - Đồng bộ trạng thái chat giữa admin và customer
 */

/**
 * Map lưu trữ mapping giữa userId và socketId hiện tại của user đó
 * Format: userId (string) -> socketId (string)
 * Mục đích: Tìm socketId của user khi cần gửi tin nhắn trực tiếp
 */
const userSockets = new Map(); // userId -> socketId

/**
 * Map lưu trữ thông tin chi tiết của mỗi socket connection
 * Format: socketId (string) -> { userId, userType, chatRoomId }
 * Mục đích: Tra cứu thông tin user và room hiện tại của socket
 */
const socketUsers = new Map(); // socketId -> { userId, userType, chatRoomId }

/**
 * Xác thực kết nối socket trước khi cho phép user kết nối
 * 
 * Middleware này được gọi tự động khi có socket connection mới.
 * Nó kiểm tra JWT token và xác thực user trước khi cho phép kết nối.
 * 
 * @param {Socket} socket - Socket instance từ client
 * @param {Function} next - Callback function để tiếp tục hoặc từ chối kết nối
 * 
 * Flow:
 * 1. Lấy token từ handshake.auth.token hoặc Authorization header
 * 2. Verify token với ACCESS_TOKEN_SECRET
 * 3. Tìm user trong database và kiểm tra trạng thái
 * 4. Lưu thông tin user vào socket object để sử dụng sau này
 * 5. Xác định userType (admin hoặc customer) dựa trên role
 */
async function authenticateSocket(socket, next) {
    try {
        // Lấy token từ 2 nguồn có thể:
        // 1. socket.handshake.auth.token (cách khuyến nghị của Socket.IO)
        // 2. Authorization header (fallback cho HTTP polling)
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        
        if (!token) {
            return next(new Error('Không có token xác thực'));
        }

        // Verify JWT token và decode để lấy user ID
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Tìm user trong database, loại bỏ các field nhạy cảm (password, address)
        // và populate thông tin vai trò
        const user = await TaiKhoan.findById(decoded.id)
            .select('-MatKhau -DiaChi')
            .populate('MaVaiTro', 'TenVaiTro MoTa');

        // Kiểm tra user tồn tại và có trạng thái active
        if (!user || user.TrangThai !== 'active') {
            return next(new Error('Người dùng không hợp lệ hoặc đã bị khóa'));
        }

        // Lưu thông tin user vào socket object để sử dụng trong các event handlers
        socket.user = {
            id: user._id.toString(),
            email: user.Email,
            name: user.HoTen,
            avatar: user.AvatarUrl,
            role: user.MaVaiTro?.TenVaiTro?.toLowerCase()
        };

        // Xác định userType: admin hoặc customer
        // Kiểm tra cả 'admin' và 'quản trị viên' để hỗ trợ đa ngôn ngữ
        socket.userType = socket.user.role === 'admin' || socket.user.role === 'quản trị viên' ? 'admin' : 'customer';

        // Cho phép kết nối tiếp tục
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        // Từ chối kết nối nếu có lỗi (token không hợp lệ, expired, etc.)
        next(new Error('Token không hợp lệ'));
    }
}

/**
 * Khởi tạo và cấu hình tất cả Socket.IO event handlers
 * 
 * Hàm này thiết lập:
 * - Middleware xác thực cho tất cả socket connections
 * - Các event handlers cho connection, disconnect, và các sự kiện chat
 * 
 * @param {Server} io - Socket.IO server instance
 */
function initializeSocket(io) {
    // Áp dụng middleware xác thực cho tất cả socket connections
    // Mọi socket connection sẽ phải qua authenticateSocket trước
    io.use(authenticateSocket);

    /**
     * Event: 'connection'
     * Được gọi khi có client mới kết nối thành công (sau khi authenticate)
     */
    io.on('connection', (socket) => {
        // Lấy thông tin user từ socket (đã được set trong authenticateSocket)
        const userId = socket.user.id;
        const userType = socket.userType;

        console.log(`🔌 User connected: ${socket.user.name} (${userType}) - Socket ID: ${socket.id}`);

        // Lưu mapping userId -> socketId để có thể tìm socket của user sau này
        userSockets.set(userId, socket.id);
        
        // Lưu thông tin chi tiết của socket connection
        socketUsers.set(socket.id, {
            userId,
            userType,
            chatRoomId: null // Chưa join room nào
        });

        // Join user vào room riêng của mình
        // Room này dùng để gửi tin nhắn trực tiếp đến user cụ thể
        // Format: 'user:{userId}'
        socket.join(`user:${userId}`);

        // Nếu là admin, join vào admin-room để nhận thông báo về chat mới
        // Tất cả admin sẽ ở trong room này để có thể nhận thông báo về tin nhắn từ customer
        if (userType === 'admin') {
            socket.join('admin-room');
            console.log(`👨‍💼 Admin joined admin-room`);
        }

        /**
         * Event: 'join-chat-room'
         * 
         * Cho phép user tham gia vào một chat room cụ thể.
         * User chỉ có thể join room mà họ có quyền truy cập:
         * - Admin: có thể join bất kỳ room nào
         * - Customer: chỉ có thể join room của chính họ
         * 
         * @param {Object} data - { chatRoomId: string }
         * 
         * Flow:
         * 1. Kiểm tra chat room có tồn tại không
         * 2. Kiểm tra quyền truy cập (admin hoặc owner)
         * 3. Leave room cũ nếu đang ở room khác
         * 4. Join room mới
         * 5. Thông báo cho các user khác trong room
         */
        socket.on('join-chat-room', async (data) => {
            try {
                const { chatRoomId } = data;

                // Kiểm tra chat room có tồn tại trong database
                const chatRoom = await ChatRoom.findById(chatRoomId);
                if (!chatRoom) {
                    socket.emit('error', { message: 'Chat room không tồn tại' });
                    return;
                }

                // Kiểm tra quyền truy cập:
                // - Admin có quyền truy cập tất cả rooms
                // - Customer chỉ có quyền truy cập room của chính họ
                const isAdmin = userType === 'admin';
                const hasAccess = isAdmin || chatRoom.CustomerId.toString() === userId;

                if (!hasAccess) {
                    socket.emit('error', { message: 'Bạn không có quyền truy cập chat room này' });
                    return;
                }

                // Nếu user đang ở room khác, leave room cũ trước
                // Mỗi socket chỉ nên ở một room tại một thời điểm
                const oldData = socketUsers.get(socket.id);
                if (oldData?.chatRoomId) {
                    socket.leave(`chat-room:${oldData.chatRoomId}`);
                }

                // Join room mới
                // Room name format: 'chat-room:{chatRoomId}'
                socket.join(`chat-room:${chatRoomId}`);
                
                // Cập nhật thông tin socket với chatRoomId mới
                socketUsers.set(socket.id, {
                    userId,
                    userType,
                    chatRoomId
                });

                // Thông báo cho các user khác trong room rằng có user mới join
                // socket.to() gửi đến tất cả socket trong room TRỪ socket hiện tại
                socket.to(`chat-room:${chatRoomId}`).emit('user-joined', {
                    userId,
                    userName: socket.user.name,
                    userType
                });

                console.log(`✅ User ${socket.user.name} joined chat room ${chatRoomId}`);
            } catch (error) {
                console.error('Error joining chat room:', error);
                socket.emit('error', { message: 'Lỗi khi tham gia chat room' });
            }
        });

        /**
         * Event: 'send-message'
         * 
         * Xử lý việc gửi tin nhắn trong chat room.
         * Tin nhắn được lưu vào database và broadcast đến tất cả user trong room.
         * 
         * @param {Object} data - { chatRoomId: string, message: string }
         * 
         * Flow:
         * 1. Validate input (chatRoomId và message không được rỗng)
         * 2. Kiểm tra quyền truy cập chat room
         * 3. Tạo message mới trong database
         * 4. Cập nhật thông tin chat room (last message, unread count, status)
         * 5. Broadcast message đến tất cả user trong room
         * 6. Gửi thông báo riêng cho admin/customer nếu họ không ở trong room
         */
        socket.on('send-message', async (data) => {
            try {
                const { chatRoomId, message } = data;

                // Validate input: chatRoomId và message phải có giá trị
                if (!chatRoomId || !message || message.trim().length === 0) {
                    socket.emit('error', { message: 'Thông tin không hợp lệ' });
                    return;
                }

                // Kiểm tra chat room có tồn tại và user có quyền truy cập
                const chatRoom = await ChatRoom.findById(chatRoomId);
                if (!chatRoom) {
                    socket.emit('error', { message: 'Chat room không tồn tại' });
                    return;
                }

                // Kiểm tra quyền: admin có thể gửi trong mọi room, customer chỉ trong room của mình
                const isAdmin = userType === 'admin';
                const hasAccess = isAdmin || chatRoom.CustomerId.toString() === userId;

                if (!hasAccess) {
                    socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong chat room này' });
                    return;
                }

                // Tạo tin nhắn mới trong database
                const newMessage = await ChatMessage.create({
                    ChatRoomId: chatRoomId,
                    SenderId: userId,
                    SenderType: userType, // 'admin' hoặc 'customer'
                    Message: message.trim(),
                    IsRead: false // Mặc định chưa đọc
                });

                // Populate thông tin người gửi để có đầy đủ thông tin
                await newMessage.populate('SenderId', 'HoTen Email AvatarUrl');

                // Cập nhật thông tin chat room:
                // - LastMessage: tin nhắn cuối cùng
                // - LastMessageAt: thời gian tin nhắn cuối
                chatRoom.LastMessage = message.trim();
                chatRoom.LastMessageAt = new Date();

                // Cập nhật unread count:
                // - Nếu admin gửi: tăng unread count của customer
                // - Nếu customer gửi: tăng unread count của admin
                if (userType === 'admin') {
                    chatRoom.UnreadCount.customer += 1;
                } else {
                    chatRoom.UnreadCount.admin += 1;
                    // Tự động chuyển status từ 'pending' thành 'active' khi customer gửi tin nhắn đầu tiên
                    // Điều này đánh dấu rằng customer đã bắt đầu chat
                    if (chatRoom.Status === 'pending') {
                        chatRoom.Status = 'active';
                    }
                }

                await chatRoom.save();

                // Chuẩn bị dữ liệu message để gửi đến client
                const messageData = {
                    _id: newMessage._id,
                    ChatRoomId: chatRoomId,
                    SenderId: {
                        _id: socket.user.id,
                        HoTen: socket.user.name,
                        Email: socket.user.email,
                        AvatarUrl: socket.user.avatar
                    },
                    SenderType: userType,
                    Message: message.trim(),
                    IsRead: false,
                    createdAt: newMessage.createdAt,
                    updatedAt: newMessage.updatedAt
                };

                // Broadcast message đến TẤT CẢ user đang ở trong room (bao gồm cả người gửi)
                // io.to() gửi đến tất cả socket trong room, kể cả socket hiện tại
                io.to(`chat-room:${chatRoomId}`).emit('new-message', messageData);

                // Gửi thông báo riêng cho user không ở trong room:
                // - Nếu customer gửi: thông báo cho tất cả admin trong admin-room
                // - Nếu admin gửi: thông báo cho customer (nếu customer đang online)
                if (userType === 'customer') {
                    // Customer gửi tin nhắn -> thông báo cho tất cả admin
                    io.to('admin-room').emit('new-chat-message', {
                        chatRoomId,
                        message: messageData,
                        unreadCount: chatRoom.UnreadCount.admin
                    });
                } else {
                    // Admin gửi tin nhắn -> thông báo cho customer cụ thể
                    // Tìm socketId của customer
                    const customerSocketId = userSockets.get(chatRoom.CustomerId.toString());
                    if (customerSocketId) {
                        // Gửi đến room riêng của customer (user:{userId})
                        io.to(`user:${chatRoom.CustomerId}`).emit('new-chat-message', {
                            chatRoomId,
                            message: messageData,
                            unreadCount: chatRoom.UnreadCount.customer
                        });
                    }
                }

                console.log(`💬 Message sent in room ${chatRoomId} by ${socket.user.name}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
            }
        });

        /**
         * Event: 'mark-as-read'
         * 
         * Đánh dấu tất cả tin nhắn chưa đọc từ người kia là đã đọc.
         * Được gọi khi user mở chat room hoặc xem tin nhắn.
         * 
         * @param {Object} data - { chatRoomId: string }
         * 
         * Flow:
         * 1. Tìm chat room
         * 2. Xác định loại user đối diện (opposite sender type)
         * 3. Đánh dấu tất cả tin nhắn chưa đọc từ user đối diện là đã đọc
         * 4. Reset unread count về 0
         * 5. Thông báo cho user đối diện rằng tin nhắn đã được đọc
         */
        socket.on('mark-as-read', async (data) => {
            try {
                const { chatRoomId } = data;

                // Tìm chat room
                const chatRoom = await ChatRoom.findById(chatRoomId);
                if (!chatRoom) {
                    return; // Room không tồn tại, không cần xử lý
                }

                // Xác định loại user đối diện:
                // - Nếu user hiện tại là admin -> đánh dấu tin nhắn từ customer
                // - Nếu user hiện tại là customer -> đánh dấu tin nhắn từ admin
                const oppositeSenderType = userType === 'admin' ? 'customer' : 'admin';

                // Đánh dấu tất cả tin nhắn chưa đọc từ người kia là đã đọc
                // Chỉ đánh dấu tin nhắn từ oppositeSenderType, không đánh dấu tin nhắn của chính mình
                await ChatMessage.updateMany(
                    {
                        ChatRoomId: chatRoomId,
                        SenderType: oppositeSenderType, // Chỉ tin nhắn từ người kia
                        IsRead: false // Chỉ tin nhắn chưa đọc
                    },
                    {
                        IsRead: true,
                        ReadAt: new Date() // Lưu thời gian đọc
                    }
                );

                // Reset unread count về 0:
                // - Nếu admin đọc -> reset unread count của admin
                // - Nếu customer đọc -> reset unread count của customer
                if (userType === 'admin') {
                    chatRoom.UnreadCount.admin = 0;
                } else {
                    chatRoom.UnreadCount.customer = 0;
                }
                await chatRoom.save();

                // Thông báo cho user đối diện trong room rằng tin nhắn đã được đọc
                // Điều này giúp hiển thị "đã đọc" trên UI của người gửi
                socket.to(`chat-room:${chatRoomId}`).emit('messages-read', {
                    chatRoomId,
                    readBy: userId // User nào đã đọc
                });
            } catch (error) {
                console.error('Error marking as read:', error);
                // Không emit error để tránh spam, chỉ log
            }
        });

        /**
         * Event: 'leave-chat-room'
         * 
         * Cho phép user rời khỏi một chat room.
         * User sẽ không nhận tin nhắn từ room này nữa (trừ khi join lại).
         * 
         * @param {Object} data - { chatRoomId: string }
         * 
         * Note: User vẫn có thể nhận thông báo qua 'new-chat-message' event
         * nếu họ đang online, nhưng sẽ không nhận 'new-message' event từ room.
         */
        socket.on('leave-chat-room', (data) => {
            const { chatRoomId } = data;
            
            // Rời khỏi room
            socket.leave(`chat-room:${chatRoomId}`);
            
            // Cập nhật thông tin socket: chatRoomId = null
            socketUsers.set(socket.id, {
                userId,
                userType,
                chatRoomId: null // Không ở room nào nữa
            });
            
            console.log(`👋 User ${socket.user.name} left chat room ${chatRoomId}`);
        });

        /**
         * Event: 'disconnect'
         * 
         * Được gọi tự động khi socket connection bị ngắt (user đóng tab, mất kết nối, etc.)
         * 
         * Cleanup:
         * - Xóa mapping userId -> socketId
         * - Xóa thông tin socket từ socketUsers map
         * 
         * Note: Socket.IO tự động xử lý việc remove socket khỏi các rooms,
         * nên không cần manually leave các rooms.
         */
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.name} - Socket ID: ${socket.id}`);
            
            // Xóa mapping userId -> socketId
            // User sẽ không nhận được tin nhắn trực tiếp nữa cho đến khi reconnect
            userSockets.delete(userId);
            
            // Xóa thông tin socket
            socketUsers.delete(socket.id);
        });
    });
}

/**
 * Export hàm initializeSocket để sử dụng trong server.js hoặc app.js
 * 
 * Usage:
 * const { initializeSocket } = require('./socket/socketHandler');
 * initializeSocket(io);
 */
module.exports = { initializeSocket };

