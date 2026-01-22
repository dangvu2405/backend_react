const express = require('express');
const router = express.Router();
const AdminController = require('../app/controllers/AdminController');
const adminMiddleware = require('../app/middlewares/admin.middleware');
const authMiddleware = require('../app/middlewares/auth.middleware');
// ==========================
// PRODUCTS & CATEGORIES (SanPham & LoaiSanPham)
// ==========================
// Đã xóa - Sử dụng DoAn và LoaiDoAn thay thế

// ==========================
// ROLES
// ==========================

/**
 * @swagger
 * /admin/roles:
 *   post:
 *     summary: Tạo vai trò mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tạo vai trò thành công
 */
router.post('/roles', authMiddleware, adminMiddleware, AdminController.createRole);

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: Lấy danh sách vai trò (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách vai trò
 */
router.get('/roles', authMiddleware, adminMiddleware, AdminController.getAllRoles);

/**
 * @swagger
 * /admin/roles/{id}:
 *   get:
 *     summary: Lấy thông tin vai trò (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin vai trò
 */
router.get('/roles/:id', authMiddleware, adminMiddleware, AdminController.getRole);

/**
 * @swagger
 * /admin/roles/{id}:
 *   put:
 *     summary: Cập nhật vai trò (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/roles/:id', authMiddleware, adminMiddleware, AdminController.updateRole);

/**
 * @swagger
 * /admin/roles/{id}:
 *   delete:
 *     summary: Xóa vai trò (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/roles/:id', authMiddleware, adminMiddleware, AdminController.deleteRole);

// ==========================
// USERS (self info endpoints from TaiKhoanController)
// ==========================
// ✅ Đặt routes cụ thể (/users/me) TRƯỚC routes có params (/users/:id) để tránh conflict

/**
 * @swagger
 * /admin/users/me:
 *   get:
 *     summary: Lấy thông tin admin hiện tại
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thông tin admin
 */
router.get('/users/me', authMiddleware, AdminController.getUser);

/**
 * @swagger
 * /admin/users/me:
 *   put:
 *     summary: Cập nhật thông tin admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/users/me', authMiddleware, AdminController.updateUser);

/**
 * @swagger
 * /admin/users/me:
 *   delete:
 *     summary: Xóa tài khoản admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/users/me', authMiddleware, AdminController.deleteUser);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Tạo người dùng mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 */
router.post('/users', authMiddleware, adminMiddleware, AdminController.createUser);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/users', authMiddleware, adminMiddleware, AdminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/users/:id', authMiddleware, adminMiddleware, AdminController.updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Xóa người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, AdminController.deleteUser);

// ==========================
// CUSTOMERS (only Customer role accounts)
// ==========================

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách khách hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khách hàng
 */
router.get('/customers', authMiddleware, adminMiddleware, AdminController.getCustomers);

/**
 * @swagger
 * /admin/customers/{id}:
 *   put:
 *     summary: Cập nhật thông tin khách hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/customers/:id', authMiddleware, adminMiddleware, AdminController.updateCustomer);

/**
 * @swagger
 * /admin/customers/{id}:
 *   delete:
 *     summary: Xóa khách hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/customers/:id', authMiddleware, adminMiddleware, AdminController.deleteCustomer);

/**
 * @swagger
 * /admin/customers/{id}/lock:
 *   post:
 *     summary: Khóa tài khoản khách hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khóa tài khoản thành công
 */
router.post('/customers/:id/lock', authMiddleware, adminMiddleware, AdminController.lockCustomer);

/**
 * @swagger
 * /admin/customers/{id}/change-role:
 *   post:
 *     summary: Thay đổi vai trò khách hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thay đổi vai trò thành công
 */
router.post('/customers/:id/change-role', authMiddleware, adminMiddleware, AdminController.changeCustomerRole);

// ==========================
// ORDERS
// ==========================
// ✅ Đặt route cụ thể (/orders/checkout) TRƯỚC route có params (/orders/:id) để tránh conflict

/**
 * @swagger
 * /admin/orders/checkout:
 *   post:
 *     summary: Thanh toán đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 */
router.post('/orders/checkout', authMiddleware, adminMiddleware, AdminController.checkout);

/**
 * @swagger
 * /admin/orders:
 *   post:
 *     summary: Tạo đơn hàng mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 */
router.post('/orders', authMiddleware, adminMiddleware, AdminController.createOrder);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Lấy danh sách tất cả đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/orders', authMiddleware, adminMiddleware, AdminController.getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin đơn hàng
 */
router.get('/orders/:id', authMiddleware, adminMiddleware, AdminController.getOrder);

/**
 * @swagger
 * /admin/orders/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/orders/:id', authMiddleware, adminMiddleware, AdminController.updateOrder);

/**
 * @swagger
 * /admin/orders/{id}:
 *   delete:
 *     summary: Xóa đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/orders/:id', authMiddleware, adminMiddleware, AdminController.deleteOrder);

/**
 * @swagger
 * /admin/orders/{id}/cancel:
 *   post:
 *     summary: Hủy đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 */
router.post('/orders/:id/cancel', authMiddleware, adminMiddleware, AdminController.cancelOrder);

/**
 * @swagger
 * /admin/orders/{id}/cancel/reject:
 *   post:
 *     summary: Từ chối yêu cầu hủy đơn hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Từ chối yêu cầu hủy thành công
 */
router.post('/orders/:id/cancel/reject', authMiddleware, adminMiddleware, AdminController.rejectCancelOrder);

// ==========================
// CART
// ==========================
// ✅ Đặt route cụ thể (/cart) TRƯỚC route có params (/cart/items/:id) để tránh conflict

/**
 * @swagger
 * /admin/cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
 */
router.post('/cart/items', authMiddleware, adminMiddleware, AdminController.addToCart);

/**
 * @swagger
 * /admin/cart:
 *   get:
 *     summary: Lấy giỏ hàng admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 */
router.get('/cart', authMiddleware, adminMiddleware, AdminController.getCart);

/**
 * @swagger
 * /admin/cart:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
 */
router.delete('/cart', authMiddleware, adminMiddleware, AdminController.clearCart);

/**
 * @swagger
 * /admin/cart/items/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm trong giỏ hàng admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cart/items/:id', authMiddleware, adminMiddleware, AdminController.updateCart);

/**
 * @swagger
 * /admin/cart/items/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/cart/items/:id', authMiddleware, adminMiddleware, AdminController.deleteCartItem);

// ==========================
// INVENTORY
// ==========================
// ✅ Đặt routes cụ thể (/inventory/:id/increase, /inventory/:id/decrease) TRƯỚC route tổng quát (/inventory/:id)

/**
 * @swagger
 * /admin/inventory:
 *   get:
 *     summary: Lấy danh sách tồn kho (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tồn kho
 */
router.get('/inventory', authMiddleware, adminMiddleware, AdminController.getInventory);

/**
 * @swagger
 * /admin/inventory/{id}/increase:
 *   post:
 *     summary: Tăng số lượng tồn kho (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tăng tồn kho thành công
 */
router.post('/inventory/:id/increase', authMiddleware, adminMiddleware, AdminController.increaseStock);

/**
 * @swagger
 * /admin/inventory/{id}/decrease:
 *   post:
 *     summary: Giảm số lượng tồn kho (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Giảm tồn kho thành công
 */
router.post('/inventory/:id/decrease', authMiddleware, adminMiddleware, AdminController.decreaseStock);

/**
 * @swagger
 * /admin/inventory/{id}:
 *   get:
 *     summary: Lấy thông tin tồn kho sản phẩm (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin tồn kho
 */
router.get('/inventory/:id', authMiddleware, adminMiddleware, AdminController.getInventoryItem);

/**
 * @swagger
 * /admin/inventory/{id}:
 *   put:
 *     summary: Đặt số lượng tồn kho (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đặt tồn kho thành công
 */
router.put('/inventory/:id', authMiddleware, adminMiddleware, AdminController.setStock);

/**
 * @swagger
 * /admin/inventory/{id}:
 *   delete:
 *     summary: Xóa tồn kho (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa tồn kho thành công
 */
router.delete('/inventory/:id', authMiddleware, adminMiddleware, AdminController.clearStock);

// ==========================
// STATISTICS
// ==========================

/**
 * @swagger
 * /admin/stats/summary:
 *   get:
 *     summary: Lấy thống kê tổng quan (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
 */
router.get('/stats/summary', authMiddleware, adminMiddleware, AdminController.getSummaryStats);

/**
 * @swagger
 * /admin/stats/revenue:
 *   get:
 *     summary: Lấy thống kê doanh thu (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê doanh thu
 */
router.get('/stats/revenue', authMiddleware, adminMiddleware, AdminController.getRevenueStats);

/**
 * @swagger
 * /admin/stats/top-products:
 *   get:
 *     summary: Lấy danh sách sản phẩm bán chạy (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm bán chạy
 */
router.get('/stats/top-products', authMiddleware, adminMiddleware, AdminController.getTopSellingProducts);

/**
 * @swagger
 * /admin/stats/low-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm sắp hết hàng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm sắp hết hàng
 */
router.get('/stats/low-stock', authMiddleware, adminMiddleware, AdminController.getLowStockProducts);

/**
 * @swagger
 * /admin/stats/monthly-orders:
 *   get:
 *     summary: Lấy thống kê đơn hàng theo tháng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê đơn hàng theo tháng
 */
router.get('/stats/monthly-orders', authMiddleware, adminMiddleware, AdminController.getMonthlyOrdersStats);

/**
 * @swagger
 * /admin/stats/top-customers:
 *   get:
 *     summary: Lấy danh sách khách hàng mua nhiều nhất (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khách hàng top
 */
router.get('/stats/top-customers', authMiddleware, adminMiddleware, AdminController.getTopCustomersByOrders);

// ==========================
// REVIEWS (ĐÁNH GIÁ)
// ==========================
// ✅ Đặt route cụ thể (/reviews/stats) và route không có params (/reviews) TRƯỚC route có params (/reviews/:id)

/**
 * @swagger
 * /admin/reviews/stats:
 *   get:
 *     summary: Lấy thống kê đánh giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê đánh giá
 */
router.get('/reviews/stats', authMiddleware, adminMiddleware, AdminController.getReviewStats);

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Lấy danh sách tất cả đánh giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
router.get('/reviews', authMiddleware, adminMiddleware, AdminController.getAllReviews);

/**
 * @swagger
 * /admin/reviews:
 *   delete:
 *     summary: Xóa nhiều đánh giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/reviews', authMiddleware, adminMiddleware, AdminController.deleteMultipleReviews);

/**
 * @swagger
 * /admin/reviews/{id}:
 *   get:
 *     summary: Lấy thông tin đánh giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin đánh giá
 */
router.get('/reviews/:id', authMiddleware, adminMiddleware, AdminController.getReview);

/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     summary: Xóa đánh giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/reviews/:id', authMiddleware, adminMiddleware, AdminController.deleteReview);

// ==========================
// VOUCHERS (MÃ GIẢM GIÁ)
// ==========================
// ✅ Đặt route cụ thể (/vouchers/stats) TRƯỚC route có params (/vouchers/:id) để tránh conflict

/**
 * @swagger
 * /admin/vouchers:
 *   post:
 *     summary: Tạo mã giảm giá mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount
 *             properties:
 *               code:
 *                 type: string
 *               discount:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo mã giảm giá thành công
 */
router.post('/vouchers', authMiddleware, adminMiddleware, AdminController.createVoucher);

/**
 * @swagger
 * /admin/vouchers/stats:
 *   get:
 *     summary: Lấy thống kê mã giảm giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê mã giảm giá
 */
router.get('/vouchers/stats', authMiddleware, adminMiddleware, AdminController.getVoucherStats);

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Lấy danh sách tất cả mã giảm giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách mã giảm giá
 */
router.get('/vouchers', authMiddleware, adminMiddleware, AdminController.getAllVouchers);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   get:
 *     summary: Lấy thông tin mã giảm giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin mã giảm giá
 */
router.get('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.getVoucher);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   put:
 *     summary: Cập nhật mã giảm giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.updateVoucher);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   delete:
 *     summary: Xóa mã giảm giá (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.deleteVoucher);

// ==========================
// WALLET MANAGEMENT
// ==========================

const AdminWalletController = require('../app/controllers/AdminWalletController');
const { AdjustBalanceRequest } = require('../app/requests');

/**
 * @swagger
 * /admin/wallets:
 *   get:
 *     summary: Lấy danh sách tất cả ví (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, frozen, suspended]
 *       - in: query
 *         name: minBalance
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxBalance
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Danh sách ví
 */
router.get('/wallets', authMiddleware, adminMiddleware, AdminWalletController.getAllWallets);

/**
 * @swagger
 * /admin/wallets/statistics:
 *   get:
 *     summary: Thống kê tổng quan ví (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thống kê ví
 */
router.get('/wallets/statistics', authMiddleware, adminMiddleware, AdminWalletController.getStatistics);

/**
 * @swagger
 * /admin/wallets/{userId}:
 *   get:
 *     summary: Lấy chi tiết ví của user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin ví
 */
router.get('/wallets/:userId', authMiddleware, adminMiddleware, AdminWalletController.getWalletByUserId);

/**
 * @swagger
 * /admin/wallets/{userId}/adjust:
 *   post:
 *     summary: Điều chỉnh số dư ví (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [deposit, withdraw]
 *     responses:
 *       200:
 *         description: Điều chỉnh thành công
 */
router.post('/wallets/:userId/adjust', authMiddleware, adminMiddleware, AdjustBalanceRequest.handle(), AdminWalletController.adjustBalance);

/**
 * @swagger
 * /admin/wallets/{userId}/status:
 *   put:
 *     summary: Khóa/Mở khóa ví (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, frozen, suspended]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.put('/wallets/:userId/status', authMiddleware, adminMiddleware, AdminWalletController.updateWalletStatus);

/**
 * @swagger
 * /admin/wallets/{userId}/transactions:
 *   get:
 *     summary: Lấy lịch sử giao dịch của user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdraw, refund, adjustment]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *     responses:
 *       200:
 *         description: Lịch sử giao dịch
 */
router.get('/wallets/:userId/transactions', authMiddleware, adminMiddleware, AdminWalletController.getUserTransactions);

// ==========================
// MMO SHOP MANAGEMENT
// ==========================

const AdminMMOShopController = require('../app/controllers/AdminMMOShopController');
const { CreateMMOProductRequest, UpdateMMOProductRequest } = require('../app/requests');

/**
 * @swagger
 * /admin/mmo-shop/products:
 *   post:
 *     summary: Tạo sản phẩm MMO mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Ten
 *               - Loai
 *               - Game
 *               - Gia
 *               - SoLuong
 *             properties:
 *               Ten:
 *                 type: string
 *               Loai:
 *                 type: string
 *                 enum: [gold, items, accounts, services]
 *               Game:
 *                 type: string
 *               Gia:
 *                 type: number
 *               SoLuong:
 *                 type: number
 *               MoTa:
 *                 type: string
 *               HinhAnh:
 *                 type: string
 *               TrangThai:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/mmo-shop/products', authMiddleware, adminMiddleware, CreateMMOProductRequest.handle(), AdminMMOShopController.createProduct);

/**
 * @swagger
 * /admin/mmo-shop/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm MMO (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               Ten:
 *                 type: string
 *               Loai:
 *                 type: string
 *                 enum: [gold, items, accounts, services]
 *               Game:
 *                 type: string
 *               Gia:
 *                 type: number
 *               SoLuong:
 *                 type: number
 *               MoTa:
 *                 type: string
 *               HinhAnh:
 *                 type: string
 *               TrangThai:
 *                 type: string
 *                 enum: [active, inactive, out_of_stock]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 */
router.put('/mmo-shop/products/:id', authMiddleware, adminMiddleware, UpdateMMOProductRequest.handle(), AdminMMOShopController.updateProduct);

/**
 * @swagger
 * /admin/mmo-shop/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm MMO (Admin only - soft delete)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 */
router.delete('/mmo-shop/products/:id', authMiddleware, adminMiddleware, AdminMMOShopController.deleteProduct);

/**
 * @swagger
 * /admin/mmo-shop/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm MMO (Admin only - có thể xem tất cả)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: game
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, out_of_stock, all]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/mmo-shop/products', authMiddleware, adminMiddleware, AdminMMOShopController.getProducts);

/**
 * @swagger
 * /admin/mmo-shop/stats:
 *   get:
 *     summary: Lấy thống kê MMO Shop (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thống kê MMO Shop
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                     totalByCategory:
 *                       type: object
 *                     totalByStatus:
 *                       type: object
 *                     totalRevenue:
 *                       type: number
 *                     totalOrders:
 *                       type: integer
 *                     lowStockProducts:
 *                       type: integer
 *                     topGames:
 *                       type: array
 */
router.get('/mmo-shop/stats', authMiddleware, adminMiddleware, AdminMMOShopController.getStats);

module.exports = router;