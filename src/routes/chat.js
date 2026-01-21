const express = require('express');
const router = express.Router();
const ChatController = require('../app/controllers/ChatController');
const authMiddleware = require('../app/middlewares/auth.middleware');
const adminMiddleware = require('../app/middlewares/admin.middleware');

// ============================================
// 💬 CHAT ROUTES
// ============================================

// ✅ Customer routes - CẦN authMiddleware để đảm bảo user đã login

/**
 * @swagger
 * /chat/room:
 *   get:
 *     summary: Lấy hoặc tạo phòng chat cho khách hàng
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thông tin phòng chat
 */
router.get('/room', authMiddleware, ChatController.getOrCreateChatRoom);

/**
 * @swagger
 * /chat/room/{chatRoomId}:
 *   get:
 *     summary: Lấy thông tin phòng chat theo ID
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin phòng chat
 */
router.get('/room/:chatRoomId', authMiddleware, ChatController.getChatRoomById);

/**
 * @swagger
 * /chat/room/{chatRoomId}/messages:
 *   get:
 *     summary: Lấy danh sách tin nhắn trong phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn
 */
router.get('/room/:chatRoomId/messages', authMiddleware, ChatController.getMessages);

/**
 * @swagger
 * /chat/room/{chatRoomId}/read:
 *   post:
 *     summary: Đánh dấu tin nhắn đã đọc
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đánh dấu đã đọc thành công
 */
router.post('/room/:chatRoomId/read', authMiddleware, ChatController.markAsRead);

// ✅ Admin routes - CẦN authMiddleware + adminMiddleware

/**
 * @swagger
 * /chat/rooms:
 *   get:
 *     summary: Lấy danh sách tất cả phòng chat (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng chat
 */
router.get('/rooms', authMiddleware, adminMiddleware, ChatController.getChatRooms);

/**
 * @swagger
 * /chat/room/{chatRoomId}/assign:
 *   post:
 *     summary: Gán admin cho phòng chat (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gán admin thành công
 */
router.post('/room/:chatRoomId/assign', authMiddleware, adminMiddleware, ChatController.assignAdmin);

/**
 * @swagger
 * /chat/room/{chatRoomId}/close:
 *   post:
 *     summary: Đóng phòng chat (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đóng phòng chat thành công
 */
router.post('/room/:chatRoomId/close', authMiddleware, adminMiddleware, ChatController.closeChatRoom);

/**
 * @swagger
 * /chat/room/{chatRoomId}:
 *   delete:
 *     summary: Xóa phòng chat (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa phòng chat thành công
 */
router.delete('/room/:chatRoomId', authMiddleware, adminMiddleware, ChatController.deleteChatRoom);

module.exports = router;

