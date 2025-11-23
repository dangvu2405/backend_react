const express = require('express');
const router = express.Router();
const ChatController = require('../app/controllers/ChatController');
const authMiddleware = require('../app/middlewares/auth.middleware');
const adminMiddleware = require('../app/middlewares/admin.middleware');

// ============================================
// 💬 CHAT ROUTES
// ============================================

// ✅ Customer routes - CẦN authMiddleware để đảm bảo user đã login
// GET /chat/room - Get or create chat room for customer
router.get('/room', authMiddleware, ChatController.getOrCreateChatRoom);

// GET /chat/room/:chatRoomId - Get chat room by ID
router.get('/room/:chatRoomId', authMiddleware, ChatController.getChatRoomById);

// GET /chat/room/:chatRoomId/messages - Get messages for a chat room
router.get('/room/:chatRoomId/messages', authMiddleware, ChatController.getMessages);

// POST /chat/room/:chatRoomId/read - Mark messages as read
router.post('/room/:chatRoomId/read', authMiddleware, ChatController.markAsRead);

// ✅ Admin routes - CẦN authMiddleware + adminMiddleware
// GET /chat/rooms - Get all chat rooms (admin only)
router.get('/rooms', authMiddleware, adminMiddleware, ChatController.getChatRooms);

// POST /chat/room/:chatRoomId/assign - Assign admin to chat room
router.post('/room/:chatRoomId/assign', authMiddleware, adminMiddleware, ChatController.assignAdmin);

// POST /chat/room/:chatRoomId/close - Close chat room (admin only)
router.post('/room/:chatRoomId/close', authMiddleware, adminMiddleware, ChatController.closeChatRoom);

// DELETE /chat/room/:chatRoomId - Delete chat room (admin only)
router.delete('/room/:chatRoomId', authMiddleware, adminMiddleware, ChatController.deleteChatRoom);

module.exports = router;

