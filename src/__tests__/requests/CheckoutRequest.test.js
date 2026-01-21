/**
 * Test file cho CheckoutRequest
 * Test validation cho checkout đơn hàng
 */

const CheckoutRequest = require('../../app/requests/Order/CheckoutRequest');

describe('CheckoutRequest Validation', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {
                SanPham: [
                    {
                        MaSanPham: '507f1f77bcf86cd799439011',
                        SoLuong: 2
                    }
                ],
                DiaChi: '123 Đường ABC, Quận 1, TP.HCM',
                PhuongThucThanhToan: 'COD',
                GhiChu: 'Giao hàng buổi sáng'
            },
            validated: null
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('✅ Valid Data', () => {
        test('should pass with valid checkout data', async () => {
            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated).toBeDefined();
            expect(mockReq.validated.SanPham).toHaveLength(1);
        });

        test('should pass with multiple products', async () => {
            mockReq.body.SanPham = [
                { MaSanPham: '507f1f77bcf86cd799439011', SoLuong: 1 },
                { MaSanPham: '507f1f77bcf86cd799439012', SoLuong: 2 }
            ];

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated.SanPham).toHaveLength(2);
        });

        test('should pass with selectedDungTich', async () => {
            mockReq.body.SanPham[0].selectedDungTich = {
                value: 100,
                label: '100ml'
            };

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid SanPham', () => {
        test('should fail with empty SanPham array', async () => {
            mockReq.body.SanPham = [];

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.SanPham).toBeDefined();
        });

        test('should fail with missing SanPham', async () => {
            delete mockReq.body.SanPham;

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with invalid MaSanPham format', async () => {
            mockReq.body.SanPham[0].MaSanPham = 'invalid-id';

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors['SanPham.0.MaSanPham']).toBeDefined();
        });

        test('should fail with SoLuong < 1', async () => {
            mockReq.body.SanPham[0].SoLuong = 0;

            const request = new CheckoutRequest(mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with SoLuong not integer', async () => {
            mockReq.body.SanPham[0].SoLuong = 1.5;

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Invalid DiaChi', () => {
        test('should fail with DiaChi < 10 characters', async () => {
            mockReq.body.DiaChi = '123 ABC';

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.DiaChi).toBeDefined();
        });

        test('should fail with DiaChi > 500 characters', async () => {
            mockReq.body.DiaChi = 'A'.repeat(501);

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing DiaChi', async () => {
            delete mockReq.body.DiaChi;

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Invalid PhuongThucThanhToan', () => {
        test('should fail with invalid payment method', async () => {
            mockReq.body.PhuongThucThanhToan = 'INVALID';

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.PhuongThucThanhToan).toBeDefined();
        });

        test('should fail with missing PhuongThucThanhToan', async () => {
            delete mockReq.body.PhuongThucThanhToan;

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with valid payment methods', async () => {
            const validMethods = ['COD', 'VNPay', 'VNPayQR', 'BANK', 'CARD', 'MoMo', 'Chuyển khoản'];

            for (const method of validMethods) {
                mockReq.body.PhuongThucThanhToan = method;
                const request = new CheckoutRequest(mockReq, mockRes, mockNext);
                await request.validate();

                expect(mockRes.status).not.toHaveBeenCalled();
                jest.clearAllMocks();
            }
        });
    });

    describe('❌ Invalid GhiChu', () => {
        test('should fail with GhiChu > 1000 characters', async () => {
            mockReq.body.GhiChu = 'A'.repeat(1001);

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with empty GhiChu', async () => {
            mockReq.body.GhiChu = '';

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('📝 Note: TongTien không có trong Request', () => {
        test('should not have TongTien field in validated data', async () => {
            mockReq.body.TongTien = 1000000; // Client gửi nhưng không validate

            const request = new CheckoutRequest(mockReq, mockRes, mockNext);
            await request.validate();

            // TongTien không được validate, backend sẽ tính lại
            expect(mockReq.validated.TongTien).toBeUndefined();
        });
    });
});
