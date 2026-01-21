/**
 * Integration Tests - Order Endpoints
 */

const request = require('supertest');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/test.db');
const { createTestUser, createTestProduct, createTestCategory, createTestToken } = require('../helpers/test.helpers');

let app;

describe('Order API Integration Tests', () => {
    let testUser, userToken, testProduct1, testProduct2;

    beforeAll(async () => {
        await connectTestDB();
        app = require('../../server');
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        testUser = await createTestUser();
        userToken = await createTestToken(testUser);
        
        const category = await createTestCategory();
        testProduct1 = await createTestProduct({ 
            MaLoaiSanPham: category._id,
            Gia: 100000,
            SoLuong: 10
        });
        testProduct2 = await createTestProduct({ 
            MaLoaiSanPham: category._id,
            Gia: 200000,
            SoLuong: 5
        });
    });

    describe('POST /api/checkout', () => {
        test('✅ should create order successfully', async () => {
            // Tính tổng tiền từ backend
            const calculatedTotal = (testProduct1.Gia * 2) + (testProduct2.Gia * 1);

            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    SanPham: [
                        {
                            MaSanPham: testProduct1._id.toString(),
                            SoLuong: 2
                        },
                        {
                            MaSanPham: testProduct2._id.toString(),
                            SoLuong: 1
                        }
                    ],
                    TongTien: calculatedTotal, // Backend sẽ validate
                    DiaChi: '123 Đường ABC, Quận 1, TP.HCM',
                    PhuongThucThanhToan: 'COD',
                    GhiChu: 'Giao hàng buổi sáng'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.donHang).toHaveProperty('_id');
            expect(response.body.data.donHang.TongTien).toBe(calculatedTotal);
        });

        test('❌ should fail with total mismatch', async () => {
            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    SanPham: [
                        {
                            MaSanPham: testProduct1._id.toString(),
                            SoLuong: 2
                        }
                    ],
                    TongTien: 999999, // Sai tổng tiền
                    DiaChi: '123 Đường ABC, Quận 1, TP.HCM',
                    PhuongThucThanhToan: 'COD'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'ORDER_004');
        });

        test('❌ should fail with insufficient stock', async () => {
            const calculatedTotal = testProduct1.Gia * 100; // Vượt quá tồn kho

            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    SanPham: [
                        {
                            MaSanPham: testProduct1._id.toString(),
                            SoLuong: 100 // Vượt quá tồn kho (10)
                        }
                    ],
                    TongTien: calculatedTotal,
                    DiaChi: '123 Đường ABC, Quận 1, TP.HCM',
                    PhuongThucThanhToan: 'COD'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'ORDER_006');
        });

        test('❌ should fail with empty cart', async () => {
            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    SanPham: [],
                    TongTien: 0,
                    DiaChi: '123 Đường ABC',
                    PhuongThucThanhToan: 'COD'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders', () => {
        test('✅ should get user orders', async () => {
            // Tạo đơn hàng trước
            const DonHang = require('../../app/models/DonHang');
            await DonHang.create({
                MaKhachHang: testUser._id,
                SanPham: [{
                    MaSanPham: testProduct1._id,
                    TenSanPham: testProduct1.TenSanPham,
                    SoLuong: 1,
                    Gia: testProduct1.Gia,
                    TongTien: testProduct1.Gia
                }],
                TongTien: testProduct1.Gia,
                DiaChi: '123 Test Street',
                PhuongThucThanhToan: 'COD',
                TrangThai: 'pending'
            });

            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.donHang).toBeInstanceOf(Array);
        });
    });
});
