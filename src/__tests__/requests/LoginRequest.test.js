/**
 * Test file cho LoginRequest
 * Test validation cho đăng nhập
 */

const LoginRequest = require('../../app/requests/Auth/LoginRequest');

describe('LoginRequest Validation', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {
                username: 'testuser@example.com',
                password: 'password123'
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
        test('should pass with valid email and password', async () => {
            mockReq.body.username = 'user@example.com';
            mockReq.body.password = 'password123';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.validated).toBeDefined();
            expect(mockReq.validated.username).toBe('user@example.com');
            expect(mockReq.validated.password).toBe('password123');
        });

        test('should pass with username and password', async () => {
            mockReq.body.username = 'testuser';
            mockReq.body.password = 'password123';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should trim spaces from username', async () => {
            mockReq.body.username = '  testuser  ';
            mockReq.body.password = 'password123';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockReq.validated.username).toBe('testuser');
        });
    });

    describe('❌ Invalid Username', () => {
        test('should fail with empty username', async () => {
            mockReq.body.username = '';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should fail with missing username', async () => {
            delete mockReq.body.username;

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
        });

        test('should fail with null username', async () => {
            mockReq.body.username = null;

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Invalid Password', () => {
        test('should fail with empty password', async () => {
            mockReq.body.password = '';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.password).toBeDefined();
        });

        test('should fail with missing password', async () => {
            delete mockReq.body.password;

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.password).toBeDefined();
        });

        test('should fail with null password', async () => {
            mockReq.body.password = null;

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('❌ Missing Both Fields', () => {
        test('should fail with empty both fields', async () => {
            mockReq.body.username = '';
            mockReq.body.password = '';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(response.errors.username).toBeDefined();
            expect(response.errors.password).toBeDefined();
        });

        test('should fail with missing both fields', async () => {
            mockReq.body = {};

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            expect(Object.keys(response.errors).length).toBeGreaterThan(0);
        });
    });

    describe('📝 Error Message Format', () => {
        test('should return proper error structure', async () => {
            mockReq.body.username = '';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).toHaveBeenCalledWith(400);
            const response = mockRes.json.mock.calls[0][0];
            
            expect(response).toHaveProperty('success', false);
            expect(response).toHaveProperty('message', 'Dữ liệu không hợp lệ');
            expect(response).toHaveProperty('errors');
        });

        test('should use Vietnamese attribute names', async () => {
            mockReq.body.username = '';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            const response = mockRes.json.mock.calls[0][0];
            const errorMsg = response.errors.username[0];
            
            // Should use Vietnamese attribute name
            expect(errorMsg).toMatch(/Tên đăng nhập|Email/);
        });
    });

    describe('🔄 Special Cases', () => {
        test('should allow very long passwords', async () => {
            mockReq.body.password = 'a'.repeat(1000);

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow special characters in password', async () => {
            mockReq.body.password = 'P@ss!word#123$%^&*()';

            const request = new LoginRequest(mockReq, mockRes, mockNext);
            await request.validate();

            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow various username formats', async () => {
            const validUsernames = [
                'user@example.com',
                'testuser',
                'user_name',
                'user123',
                'user-name',
            ];

            for (const username of validUsernames) {
                mockReq.body.username = username;
                const request = new LoginRequest(mockReq, mockRes, mockNext);
                await request.validate();

                expect(mockRes.status).not.toHaveBeenCalled();
                jest.clearAllMocks();
            }
        });
    });
});
