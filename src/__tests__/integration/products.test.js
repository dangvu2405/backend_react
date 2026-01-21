/**
 * Integration Tests - Product Endpoints
 */

const request = require('supertest');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/test.db');
const { createTestUser, createTestAdmin, createTestProduct, createTestCategory, createTestToken } = require('../helpers/test.helpers');

let app;

describe('Product API Integration Tests', () => {
    let testAdmin, adminToken, testCategory, testProduct;

    beforeAll(async () => {
        await connectTestDB();
        app = require('../../server');
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        testAdmin = await createTestAdmin();
        adminToken = await createTestToken(testAdmin);
        testCategory = await createTestCategory();
        testProduct = await createTestProduct({ MaLoaiSanPham: testCategory._id });
    });

    describe('GET /api/products', () => {
        test('✅ should get products list with pagination', async () => {
            // Tạo thêm products
            await createTestProduct({ MaLoaiSanPham: testCategory._id });
            await createTestProduct({ MaLoaiSanPham: testCategory._id });

            const response = await request(app)
                .get('/api/products')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total');
        });

        test('✅ should filter products by category', async () => {
            const response = await request(app)
                .get('/api/products')
                .query({ category: testCategory._id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('✅ should filter products by price range', async () => {
            const response = await request(app)
                .get('/api/products')
                .query({ minPrice: 50000, maxPrice: 200000 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('✅ should search products', async () => {
            const response = await request(app)
                .get('/api/products')
                .query({ search: 'Product' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/products/:id', () => {
        test('✅ should get product by id', async () => {
            const response = await request(app)
                .get(`/api/products/${testProduct._id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('TenSanPham');
            expect(response.body.data).not.toHaveProperty('__v');
        });

        test('❌ should return 404 for non-existent product', async () => {
            const fakeId = new require('mongoose').Types.ObjectId();
            const response = await request(app)
                .get(`/api/products/${fakeId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'PROD_001');
        });

        test('❌ should return 400 for invalid ObjectId', async () => {
            const response = await request(app)
                .get('/api/products/invalid-id');

            expect(response.status).toBe(400);
        });
    });

    describe('POST /admin/products', () => {
        test('✅ should create product successfully', async () => {
            const response = await request(app)
                .post('/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    TenSanPham: 'New Product',
                    MaLoaiSanPham: testCategory._id.toString(),
                    Gia: 150000,
                    SoLuong: 50,
                    KhuyenMai: 10,
                    MoTa: 'Test description'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('TenSanPham', 'New Product');
        });

        test('❌ should fail without admin token', async () => {
            const response = await request(app)
                .post('/admin/products')
                .send({
                    TenSanPham: 'New Product',
                    MaLoaiSanPham: testCategory._id.toString(),
                    Gia: 150000,
                    SoLuong: 50
                });

            expect(response.status).toBe(401);
        });

        test('❌ should fail with invalid data', async () => {
            const response = await request(app)
                .post('/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    TenSanPham: 'AB', // < 3 characters
                    Gia: -100 // Negative price
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('PUT /admin/products/:id', () => {
        test('✅ should update product successfully', async () => {
            const response = await request(app)
                .put(`/admin/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    TenSanPham: 'Updated Product',
                    Gia: 200000
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.TenSanPham).toBe('Updated Product');
        });
    });

    describe('DELETE /admin/products/:id', () => {
        test('✅ should soft delete product with orders', async () => {
            // Tạo đơn hàng có sản phẩm này
            const DonHang = require('../../app/models/DonHang');
            await DonHang.create({
                MaKhachHang: testAdmin._id,
                SanPham: [{
                    MaSanPham: testProduct._id,
                    TenSanPham: testProduct.TenSanPham,
                    SoLuong: 1,
                    Gia: testProduct.Gia,
                    TongTien: testProduct.Gia
                }],
                TongTien: testProduct.Gia,
                DiaChi: '123 Test Street',
                PhuongThucThanhToan: 'COD',
                TrangThai: 'pending'
            });

            const response = await request(app)
                .delete(`/admin/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Nên soft delete (inactive) vì có đơn hàng
            expect(response.status).toBe(200);
            
            // Verify product status
            const updatedProduct = await require('../../app/models/SanPham').findById(testProduct._id);
            expect(['inactive', 'deleted']).toContain(updatedProduct.TrangThai);
        });
    });
});
