/**
 * Test Helpers - Utility functions cho testing
 */

const mongoose = require('mongoose');
const TaiKhoan = require('../../app/models/Taikhoan');
const Role = require('../../app/models/Role');
const SanPham = require('../../app/models/SanPham');
const LoaiSanPham = require('../../app/models/LoaiSanPham');
const { hashPassword } = require('../../utils/password');

/**
 * Tạo user test
 */
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        TenDangNhap: `testuser_${Date.now()}`,
        Email: `test_${Date.now()}@example.com`,
        MatKhau: await hashPassword('password123'),
        HoTen: 'Test User',
        SoDienThoai: '0912345678',
        TrangThai: 'active',
        ...overrides
    };

    // Lấy role customer nếu chưa có
    if (!defaultUser.MaVaiTro) {
        let customerRole = await Role.findOne({ TenVaiTro: 'customer' });
        if (!customerRole) {
            customerRole = await Role.create({ TenVaiTro: 'customer', MoTa: 'Khách hàng' });
        }
        defaultUser.MaVaiTro = customerRole._id;
    }

    return await TaiKhoan.create(defaultUser);
};

/**
 * Tạo admin user test
 */
const createTestAdmin = async (overrides = {}) => {
    let adminRole = await Role.findOne({ TenVaiTro: 'admin' });
    if (!adminRole) {
        adminRole = await Role.create({ TenVaiTro: 'admin', MoTa: 'Quản trị viên' });
    }

    return await createTestUser({
        TenDangNhap: `admin_${Date.now()}`,
        Email: `admin_${Date.now()}@example.com`,
        MaVaiTro: adminRole._id,
        ...overrides
    });
};

/**
 * Tạo category test
 */
const createTestCategory = async (overrides = {}) => {
    const defaultCategory = {
        TenLoaiSanPham: `Category ${Date.now()}`,
        MoTa: 'Test category',
        HinhAnh: 'https://example.com/image.jpg',
        ...overrides
    };

    return await LoaiSanPham.create(defaultCategory);
};

/**
 * Tạo product test
 */
const createTestProduct = async (overrides = {}) => {
    // Tạo category nếu chưa có
    let category = overrides.MaLoaiSanPham;
    if (!category) {
        const testCategory = await createTestCategory();
        category = testCategory._id;
    }

    const defaultProduct = {
        TenSanPham: `Product ${Date.now()}`,
        MaLoaiSanPham: category,
        Gia: 100000,
        SoLuong: 100,
        KhuyenMai: 0,
        MoTa: 'Test product',
        HinhAnhChinh: 'https://example.com/image.jpg',
        TrangThai: 'active',
        ...overrides
    };

    return await SanPham.create(defaultProduct);
};

/**
 * Tạo JWT token cho test
 */
const createTestToken = async (user) => {
    const { generateTokenPair } = require('../../utils/token');
    const tokens = generateTokenPair(user);
    return tokens.accessToken;
};

/**
 * Mock request object với user
 */
const createMockRequest = (overrides = {}) => {
    return {
        body: {},
        query: {},
        params: {},
        headers: {},
        cookies: {},
        user: null,
        validated: null,
        ...overrides
    };
};

/**
 * Mock response object
 */
const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };
    return res;
};

/**
 * Mock next function
 */
const createMockNext = () => {
    return jest.fn();
};

module.exports = {
    createTestUser,
    createTestAdmin,
    createTestCategory,
    createTestProduct,
    createTestToken,
    createMockRequest,
    createMockResponse,
    createMockNext
};
