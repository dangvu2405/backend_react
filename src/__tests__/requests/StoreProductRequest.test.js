/**
 * Test file cho StoreProductRequest
 * Test validation cho tạo sản phẩm mới
 */

const StoreProductRequest = require('../../app/requests/Product/StoreProductRequest');

describe('StoreProductRequest Validation', () => {
    let mockReq, mockRes, mockNext;
    const validObjectId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
        mockReq = {
            body: {
                TenSanPham: 'Sản phẩm test',
                MaLoaiSanPham: validObjectId,
                Gia: 100000,
                SoLuong: 10,
                KhuyenMai: 10,
                DungTich: 100,
                MoTa: 'Mô tả sản phẩm',
                HinhAnhChinh: 'https://example.com/image.jpg',
                HinhAnhPhu: ['https://example.com/image1.jpg'],
                DungTichOptions: [
                    { value: 100, label: '100ml' },
                    { value: 200, label: '200ml' }
                ]
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
        test('should pass with valid data', async () => {
            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated).toBeDefined();
            expect(mockReq.validated.TenSanPham).toBe('Sản phẩm test');
            expect(mockReq.validated.Gia).toBe(100000);
            expect(mockReq.validated.SoLuong).toBe(10);
        });

        test('should trim spaces from TenSanPham', async () => {
            mockReq.body.TenSanPham = '  Sản phẩm test  ';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockReq.validated.TenSanPham).toBe('Sản phẩm test');
        });

        test('should work with minimal required fields', async () => {
            mockReq.body = {
                TenSanPham: 'Sản phẩm',
                MaLoaiSanPham: validObjectId,
                Gia: 50000,
                SoLuong: 5
            };

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated.MoTa).toBe('');
            expect(mockReq.validated.KhuyenMai).toBe(0);
            expect(mockReq.validated.HinhAnhChinh).toBe('');
            expect(mockReq.validated.HinhAnhPhu).toEqual([]);
        });
    });

    describe('❌ Invalid TenSanPham', () => {
        test('should fail with TenSanPham < 3 characters', async () => {
            mockReq.body.TenSanPham = 'ab';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.TenSanPham).toBeDefined();
        });

        test('should fail with TenSanPham > 200 characters', async () => {
            mockReq.body.TenSanPham = 'a'.repeat(201);

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.TenSanPham).toBeDefined();
        });

        test('should fail with empty TenSanPham', async () => {
            mockReq.body.TenSanPham = '';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing TenSanPham', async () => {
            delete mockReq.body.TenSanPham;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.TenSanPham).toBeDefined();
        });
    });

    describe('❌ Invalid MaLoaiSanPham', () => {
        test('should fail with invalid ObjectId', async () => {
            mockReq.body.MaLoaiSanPham = 'invalid-id';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.MaLoaiSanPham).toBeDefined();
        });

        test('should fail with empty MaLoaiSanPham', async () => {
            mockReq.body.MaLoaiSanPham = '';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing MaLoaiSanPham', async () => {
            delete mockReq.body.MaLoaiSanPham;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with valid ObjectId', async () => {
            mockReq.body.MaLoaiSanPham = '507f1f77bcf86cd799439011';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid Gia (Price)', () => {
        test('should fail with Gia < 0', async () => {
            mockReq.body.Gia = -100;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.Gia).toBeDefined();
        });

        test('should fail with non-numeric Gia', async () => {
            mockReq.body.Gia = 'abc';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing Gia', async () => {
            delete mockReq.body.Gia;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with Gia = 0', async () => {
            mockReq.body.Gia = 0;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid SoLuong (Quantity)', () => {
        test('should fail with SoLuong < 0', async () => {
            mockReq.body.SoLuong = -5;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.SoLuong).toBeDefined();
        });

        test('should fail with non-integer SoLuong', async () => {
            mockReq.body.SoLuong = 10.5;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with non-numeric SoLuong', async () => {
            mockReq.body.SoLuong = 'abc';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing SoLuong', async () => {
            delete mockReq.body.SoLuong;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with SoLuong = 0', async () => {
            mockReq.body.SoLuong = 0;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid KhuyenMai (Discount)', () => {
        test('should fail with KhuyenMai < 0', async () => {
            mockReq.body.KhuyenMai = -1;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.KhuyenMai).toBeDefined();
        });

        test('should fail with KhuyenMai > 100', async () => {
            mockReq.body.KhuyenMai = 101;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with KhuyenMai = 0', async () => {
            mockReq.body.KhuyenMai = 0;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated.KhuyenMai).toBe(0);
        });

        test('should pass with KhuyenMai = 100', async () => {
            mockReq.body.KhuyenMai = 100;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid DungTich (Volume)', () => {
        test('should fail with DungTich < 0', async () => {
            mockReq.body.DungTich = -10;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.DungTich).toBeDefined();
        });

        test('should fail with non-numeric DungTich', async () => {
            mockReq.body.DungTich = 'abc';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with DungTich = null', async () => {
            mockReq.body.DungTich = null;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid HinhAnhPhu (Images)', () => {
        test('should fail with invalid URL', async () => {
            mockReq.body.HinhAnhPhu = ['not-a-url'];

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail if HinhAnhPhu is not array', async () => {
            mockReq.body.HinhAnhPhu = 'single-url.jpg';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with valid URLs in array', async () => {
            mockReq.body.HinhAnhPhu = [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg'
            ];

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should pass with empty HinhAnhPhu array', async () => {
            mockReq.body.HinhAnhPhu = [];

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated.HinhAnhPhu).toEqual([]);
        });
    });

    describe('📝 Validation Messages', () => {
        test('should return Vietnamese attribute names', async () => {
            mockReq.body.TenSanPham = 'ab';
            mockReq.body.Gia = -100;

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            const response = mockRes.json.mock.calls[0][0];
            const tenSanPhamError = response.errors.TenSanPham[0];
            const giaError = response.errors.Gia[0];

            expect(tenSanPhamError).toMatch(/Tên sản phẩm/);
            expect(giaError).toMatch(/Giá/);
        });

        test('should show proper error structure', async () => {
            mockReq.body.TenSanPham = 'ab';

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            const response = mockRes.json.mock.calls[0][0];
            
            expect(response).toHaveProperty('success', false);
            expect(response).toHaveProperty('message', 'Dữ liệu không hợp lệ');
            expect(response).toHaveProperty('errors');
            expect(Array.isArray(response.errors.TenSanPham)).toBe(true);
        });
    });

    describe('🔄 Optional Fields', () => {
        test('should handle missing optional fields', async () => {
            mockReq.body = {
                TenSanPham: 'Sản phẩm',
                MaLoaiSanPham: validObjectId,
                Gia: 100000,
                SoLuong: 10
            };

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated.MoTa).toBe('');
            expect(mockReq.validated.HinhAnhChinh).toBe('');
            expect(mockReq.validated.HinhAnhPhu).toEqual([]);
        });

        test('should allow DungTichOptions array', async () => {
            mockReq.body.DungTichOptions = [
                { value: 100, label: '100ml' },
                { value: 200, label: '200ml' }
            ];

            const request = new StoreProductRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });
});
