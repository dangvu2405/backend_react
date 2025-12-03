const express = require('express');
const router = express.Router();
const AdminController = require('../app/controllers/AdminController');
const adminMiddleware = require('../app/middlewares/admin.middleware');
const authMiddleware = require('../app/middlewares/auth.middleware');

// ==========================
// PRODUCTS
// ==========================
router.post('/products', authMiddleware, adminMiddleware, AdminController.createProduct);
router.get('/products', authMiddleware, adminMiddleware, AdminController.getAllProducts);
router.get('/products/:id', authMiddleware, adminMiddleware, AdminController.getProduct);
router.put('/products/:id', authMiddleware, adminMiddleware, AdminController.updateProduct);
router.delete('/products/:id', authMiddleware, adminMiddleware, AdminController.deleteProduct);

// ==========================
// CATEGORIES
// ==========================
router.post('/categories', authMiddleware, adminMiddleware, AdminController.createCategory);
router.get('/categories', AdminController.getAllCategories); // Public - không cần middleware
router.get('/categories/:id', AdminController.getCategory); // Public - không cần middleware
router.put('/categories/:id', authMiddleware, adminMiddleware, AdminController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, AdminController.deleteCategory);

// ==========================
// ROLES
// ==========================
router.post('/roles', authMiddleware, adminMiddleware, AdminController.createRole);
router.get('/roles', authMiddleware, adminMiddleware, AdminController.getAllRoles);
router.get('/roles/:id', authMiddleware, adminMiddleware, AdminController.getRole);
router.put('/roles/:id', authMiddleware, adminMiddleware, AdminController.updateRole);
router.delete('/roles/:id', authMiddleware, adminMiddleware, AdminController.deleteRole);

// ==========================
// USERS (self info endpoints from TaiKhoanController)
// ==========================
// ✅ Đặt routes cụ thể (/users/me) TRƯỚC routes có params (/users/:id) để tránh conflict
router.get('/users/me', authMiddleware, AdminController.getUser);
router.put('/users/me', authMiddleware, AdminController.updateUser);
router.delete('/users/me', authMiddleware, AdminController.deleteUser);

router.post('/users', authMiddleware, adminMiddleware, AdminController.createUser);
router.get('/users', authMiddleware, adminMiddleware, AdminController.getAllUsers);
router.put('/users/:id', authMiddleware, adminMiddleware, AdminController.updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, AdminController.deleteUser);

// ==========================
// CUSTOMERS (only Customer role accounts)
// ==========================
router.get('/customers', authMiddleware, adminMiddleware, AdminController.getCustomers);
router.put('/customers/:id', authMiddleware, adminMiddleware, AdminController.updateCustomer);
router.delete('/customers/:id', authMiddleware, adminMiddleware, AdminController.deleteCustomer);
router.post('/customers/:id/lock', authMiddleware, adminMiddleware, AdminController.lockCustomer);
router.post('/customers/:id/change-role', authMiddleware, adminMiddleware, AdminController.changeCustomerRole);

// ==========================
// ORDERS
// ==========================
// ✅ Đặt route cụ thể (/orders/checkout) TRƯỚC route có params (/orders/:id) để tránh conflict
router.post('/orders/checkout', authMiddleware, adminMiddleware, AdminController.checkout);

router.post('/orders', authMiddleware, adminMiddleware, AdminController.createOrder);
router.get('/orders', authMiddleware, adminMiddleware, AdminController.getAllOrders);
router.get('/orders/:id', authMiddleware, adminMiddleware, AdminController.getOrder);
router.put('/orders/:id', authMiddleware, adminMiddleware, AdminController.updateOrder);
router.delete('/orders/:id', authMiddleware, adminMiddleware, AdminController.deleteOrder);
router.post('/orders/:id/cancel', authMiddleware, adminMiddleware, AdminController.cancelOrder);
router.post('/orders/:id/cancel/reject', authMiddleware, adminMiddleware, AdminController.rejectCancelOrder);

// ==========================
// CART
// ==========================
// ✅ Đặt route cụ thể (/cart) TRƯỚC route có params (/cart/items/:id) để tránh conflict
router.post('/cart/items', authMiddleware, adminMiddleware, AdminController.addToCart);
router.get('/cart', authMiddleware, adminMiddleware, AdminController.getCart);
router.delete('/cart', authMiddleware, adminMiddleware, AdminController.clearCart);
router.put('/cart/items/:id', authMiddleware, adminMiddleware, AdminController.updateCart);
router.delete('/cart/items/:id', authMiddleware, adminMiddleware, AdminController.deleteCartItem);

// ==========================
// INVENTORY
// ==========================
// ✅ Đặt routes cụ thể (/inventory/:id/increase, /inventory/:id/decrease) TRƯỚC route tổng quát (/inventory/:id)
router.get('/inventory', authMiddleware, adminMiddleware, AdminController.getInventory);
router.post('/inventory/:id/increase', authMiddleware, adminMiddleware, AdminController.increaseStock);
router.post('/inventory/:id/decrease', authMiddleware, adminMiddleware, AdminController.decreaseStock);
router.get('/inventory/:id', authMiddleware, adminMiddleware, AdminController.getInventoryItem);
router.put('/inventory/:id', authMiddleware, adminMiddleware, AdminController.setStock);
router.delete('/inventory/:id', authMiddleware, adminMiddleware, AdminController.clearStock);

// ==========================
// STATISTICS
// ==========================
router.get('/stats/summary', authMiddleware, adminMiddleware, AdminController.getSummaryStats);
router.get('/stats/revenue', authMiddleware, adminMiddleware, AdminController.getRevenueStats);
router.get('/stats/top-products', authMiddleware, adminMiddleware, AdminController.getTopSellingProducts);
router.get('/stats/low-stock', authMiddleware, adminMiddleware, AdminController.getLowStockProducts);
router.get('/stats/monthly-orders', authMiddleware, adminMiddleware, AdminController.getMonthlyOrdersStats);
router.get('/stats/top-customers', authMiddleware, adminMiddleware, AdminController.getTopCustomersByOrders);

// ==========================
// REVIEWS (ĐÁNH GIÁ)
// ==========================
// ✅ Đặt route cụ thể (/reviews/stats) và route không có params (/reviews) TRƯỚC route có params (/reviews/:id)
router.get('/reviews/stats', authMiddleware, adminMiddleware, AdminController.getReviewStats);
router.get('/reviews', authMiddleware, adminMiddleware, AdminController.getAllReviews);
router.delete('/reviews', authMiddleware, adminMiddleware, AdminController.deleteMultipleReviews);
router.get('/reviews/:id', authMiddleware, adminMiddleware, AdminController.getReview);
router.delete('/reviews/:id', authMiddleware, adminMiddleware, AdminController.deleteReview);

// ==========================
// VOUCHERS (MÃ GIẢM GIÁ)
// ==========================
// ✅ Đặt route cụ thể (/vouchers/stats) TRƯỚC route có params (/vouchers/:id) để tránh conflict
router.post('/vouchers', authMiddleware, adminMiddleware, AdminController.createVoucher);
router.get('/vouchers/stats', authMiddleware, adminMiddleware, AdminController.getVoucherStats);
router.get('/vouchers', authMiddleware, adminMiddleware, AdminController.getAllVouchers);
router.get('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.getVoucher);
router.put('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.updateVoucher);
router.delete('/vouchers/:id', authMiddleware, adminMiddleware, AdminController.deleteVoucher);

module.exports = router;