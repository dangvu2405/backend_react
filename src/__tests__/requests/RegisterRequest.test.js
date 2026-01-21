/**
 * Test file cho RegisterRequest
 * Test validation cho đăng ký tài khoản
 */

const RegisterRequest = require('../../app/requests/Auth/RegisterRequest');
const TaiKhoan = require('../../app/models/Taikhoan');

// Mock TaiKhoan model
jest.mock('../../app/models/Taikhoan');

describe('RegisterRequest Validation', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                hoten: 'Test User',
                sdt: '0912345678'
            },
            validated: null
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
        TaiKhoan.findOne.mockResolvedValue(null);
    });

    describe('✅ Valid Data', () => {
        test('should pass with valid data', async () => {
            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            const result = await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated).toBeDefined();
            expect(mockReq.validated.username).toBe('testuser');
            expect(mockReq.validated.email).toBe('test@example.com');
        });

        test('should trim spaces from username and hoten', async () => {
            mockReq.body.username = '  testuser  ';
            mockReq.body.hoten = '  Test User  ';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockReq.validated.username).toBe('testuser');
            expect(mockReq.validated.hoten).toBe('Test User');
        });

        test('should lowercase email', async () => {
            mockReq.body.email = 'Test@EXAMPLE.COM';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockReq.validated.email).toBe('test@example.com');
        });
    });

    describe('❌ Invalid Username', () => {
        test('should fail with username < 3 characters', async () => {
            mockReq.body.username = 'ab';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should fail with username > 30 characters', async () => {
            mockReq.body.username = 'a'.repeat(31);

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should fail with special characters in username', async () => {
            mockReq.body.username = 'user@name!';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should pass with underscore in username', async () => {
            mockReq.body.username = 'user_name_123';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid Email', () => {
        test('should fail with invalid email format', async () => {
            mockReq.body.email = 'invalid-email';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.email).toBeDefined();
        });

        test('should fail with missing @ in email', async () => {
            mockReq.body.email = 'test.example.com';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with missing domain in email', async () => {
            mockReq.body.email = 'test@';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Invalid Password', () => {
        test('should fail with password < 8 characters', async () => {
            mockReq.body.password = '1234567';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.password).toBeDefined();
        });

        test('should fail with empty password', async () => {
            mockReq.body.password = '';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Invalid Phone Number', () => {
        test('should fail with phone < 10 digits', async () => {
            mockReq.body.sdt = '091234567';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.sdt).toBeDefined();
        });

        test('should fail with phone > 10 digits', async () => {
            mockReq.body.sdt = '09123456789';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should fail with non-numeric phone', async () => {
            mockReq.body.sdt = '091234567a';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should pass with valid 10-digit phone', async () => {
            mockReq.body.sdt = '0912345678';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('❌ Invalid Full Name', () => {
        test('should fail with hoten < 2 characters', async () => {
            mockReq.body.hoten = 'A';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.hoten).toBeDefined();
        });

        test('should fail with hoten > 100 characters', async () => {
            mockReq.body.hoten = 'A'.repeat(101);

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Missing Required Fields', () => {
        test('should fail with missing username', async () => {
            delete mockReq.body.username;

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should fail with missing email', async () => {
            delete mockReq.body.email;

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.email).toBeDefined();
        });

        test('should fail with missing password', async () => {
            delete mockReq.body.password;

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.password).toBeDefined();
        });

        test('should fail with missing hoten', async () => {
            delete mockReq.body.hoten;

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.hoten).toBeDefined();
        });

        test('should fail with missing sdt', async () => {
            delete mockReq.body.sdt;

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.sdt).toBeDefined();
        });
    });

    describe('🔄 Unique Validation', () => {
        test('should fail when email already exists', async () => {
            TaiKhoan.findOne.mockResolvedValue({
                _id: '123',
                Email: 'test@example.com',
                TenDangNhap: 'other'
            });

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.email).toBeDefined();
            expect(response.errors.email[0]).toContain('đã được sử dụng');
        });

        test('should fail when username already exists', async () => {
            TaiKhoan.findOne.mockResolvedValue({
                _id: '123',
                Email: 'other@example.com',
                TenDangNhap: 'testuser'
            });

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
            expect(response.errors.username[0]).toContain('tồn tại');
        });

        test('should fail when both email and username exist', async () => {
            TaiKhoan.findOne.mockResolvedValue({
                _id: '123',
                Email: 'test@example.com',
                TenDangNhap: 'testuser'
            });

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.email).toBeDefined();
            expect(response.errors.username).toBeDefined();
        });
    });

    describe('📝 Error Message Format', () => {
        test('should return proper error structure', async () => {
            mockReq.body.username = 'ab';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            
            expect(response).toHaveProperty('success', false);
            expect(response).toHaveProperty('message', 'Dữ liệu không hợp lệ');
            expect(response).toHaveProperty('errors');
            expect(Array.isArray(response.errors.username)).toBe(true);
        });

        test('should use Vietnamese attribute names in errors', async () => {
            mockReq.body.username = '';

            const request = new RegisterRequest(mockReq, mockRes, mockNext);
            await request.validate();

            const response = mockRes.json.mock.calls[0][0];
            const errorMsg = response.errors.username[0];
            
            // Message should use Vietnamese attribute name
            expect(errorMsg).toMatch(/Tên đăng nhập/);
        });
    });
});
