/**
 * Integration Tests - Swagger Documentation
 * Test Swagger spec validation và structure
 */

const swaggerSpec = require('../../config/swagger');

describe('Swagger Documentation Tests', () => {

    describe('Swagger Spec Structure', () => {
        test('✅ should be valid OpenAPI 3.0 spec', () => {
            expect(swaggerSpec).toBeDefined();
            expect(swaggerSpec.openapi).toBe('3.0.0');
        });

        test('✅ should have all required top-level properties', () => {
            expect(swaggerSpec.info).toBeDefined();
            expect(swaggerSpec.servers).toBeDefined();
            expect(swaggerSpec.paths).toBeDefined();
            expect(swaggerSpec.components).toBeDefined();
        });
    });

    describe('Swagger Spec Validation', () => {
        test('✅ should have valid OpenAPI structure', () => {
            expect(swaggerSpec).toBeDefined();
            expect(swaggerSpec.openapi).toBe('3.0.0');
            expect(swaggerSpec.info).toBeDefined();
            expect(swaggerSpec.info.title).toBeDefined();
            expect(swaggerSpec.info.version).toBeDefined();
        });

        test('✅ should have servers configured', () => {
            expect(swaggerSpec.servers).toBeDefined();
            expect(Array.isArray(swaggerSpec.servers)).toBe(true);
            expect(swaggerSpec.servers.length).toBeGreaterThan(0);
        });

        test('✅ should have security schemes defined', () => {
            expect(swaggerSpec.components).toBeDefined();
            expect(swaggerSpec.components.securitySchemes).toBeDefined();
            expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
            expect(swaggerSpec.components.securitySchemes.cookieAuth).toBeDefined();
        });

        test('✅ should have common schemas defined', () => {
            expect(swaggerSpec.components.schemas).toBeDefined();
            expect(swaggerSpec.components.schemas.Error).toBeDefined();
            expect(swaggerSpec.components.schemas.Success).toBeDefined();
        });

        test('✅ should have paths defined', () => {
            expect(swaggerSpec.paths).toBeDefined();
            expect(typeof swaggerSpec.paths).toBe('object');
        });

        test('✅ should have authentication endpoints documented', () => {
            const paths = swaggerSpec.paths;
            expect(paths['/auth/login']).toBeDefined();
            expect(paths['/auth/register']).toBeDefined();
            expect(paths['/auth/logout']).toBeDefined();
        });

        test('✅ should have API endpoints documented', () => {
            const paths = swaggerSpec.paths;
            expect(paths['/api/health']).toBeDefined();
            expect(paths['/api/products']).toBeDefined();
            expect(paths['/api/categories']).toBeDefined();
        });

        test('✅ should have proper request/response schemas for login', () => {
            const loginPath = swaggerSpec.paths['/auth/login'];
            expect(loginPath).toBeDefined();
            expect(loginPath.post).toBeDefined();
            expect(loginPath.post.requestBody).toBeDefined();
            expect(loginPath.post.responses).toBeDefined();
            expect(loginPath.post.responses['200']).toBeDefined();
            expect(loginPath.post.responses['400']).toBeDefined();
            expect(loginPath.post.responses['401']).toBeDefined();
        });

        test('✅ should have proper request/response schemas for register', () => {
            const registerPath = swaggerSpec.paths['/auth/register'];
            expect(registerPath).toBeDefined();
            expect(registerPath.post).toBeDefined();
            expect(registerPath.post.requestBody).toBeDefined();
            expect(registerPath.post.responses).toBeDefined();
            expect(registerPath.post.responses['201']).toBeDefined();
            expect(registerPath.post.responses['400']).toBeDefined();
        });

        test('✅ should have tags defined', () => {
            const paths = swaggerSpec.paths;
            const loginPath = paths['/auth/login'];
            expect(loginPath.post.tags).toBeDefined();
            expect(Array.isArray(loginPath.post.tags)).toBe(true);
            expect(loginPath.post.tags).toContain('Authentication');
        });

        test('✅ should have summary for each endpoint', () => {
            const paths = swaggerSpec.paths;
            Object.keys(paths).forEach(path => {
                const pathObj = paths[path];
                Object.keys(pathObj).forEach(method => {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        expect(pathObj[method].summary).toBeDefined();
                        expect(typeof pathObj[method].summary).toBe('string');
                    }
                });
            });
        });
    });

    describe('Swagger Spec Content', () => {
        test('✅ should have correct info metadata', () => {
            expect(swaggerSpec.info.title).toBe('Backend API Documentation');
            expect(swaggerSpec.info.version).toBe('1.0.0');
            expect(swaggerSpec.info.description).toBeDefined();
        });

        test('✅ should have bearerAuth security scheme configured correctly', () => {
            const bearerAuth = swaggerSpec.components.securitySchemes.bearerAuth;
            expect(bearerAuth.type).toBe('http');
            expect(bearerAuth.scheme).toBe('bearer');
            expect(bearerAuth.bearerFormat).toBe('JWT');
        });

        test('✅ should have cookieAuth security scheme configured correctly', () => {
            const cookieAuth = swaggerSpec.components.securitySchemes.cookieAuth;
            expect(cookieAuth.type).toBe('apiKey');
            expect(cookieAuth.in).toBe('cookie');
            expect(cookieAuth.name).toBe('connect.sid');
        });

        test('✅ should have Error schema with correct structure', () => {
            const errorSchema = swaggerSpec.components.schemas.Error;
            expect(errorSchema.type).toBe('object');
            expect(errorSchema.properties.success).toBeDefined();
            expect(errorSchema.properties.message).toBeDefined();
            expect(errorSchema.properties.success.type).toBe('boolean');
            expect(errorSchema.properties.message.type).toBe('string');
        });

        test('✅ should have Success schema with correct structure', () => {
            const successSchema = swaggerSpec.components.schemas.Success;
            expect(successSchema.type).toBe('object');
            expect(successSchema.properties.success).toBeDefined();
            expect(successSchema.properties.message).toBeDefined();
            expect(successSchema.properties.data).toBeDefined();
        });
    });

    describe('Swagger Spec Completeness', () => {
        test('✅ should document all major endpoints', () => {
            const paths = swaggerSpec.paths;
            const requiredPaths = [
                '/auth/login',
                '/auth/register',
                '/auth/logout',
                '/api/health',
                '/api/products',
                '/api/categories'
            ];

            requiredPaths.forEach(path => {
                expect(paths[path]).toBeDefined();
            });
        });

        test('✅ should have proper response codes for each endpoint', () => {
            Object.keys(swaggerSpec.paths).forEach(path => {
                const pathObj = swaggerSpec.paths[path];
                Object.keys(pathObj).forEach(method => {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        const responses = pathObj[method].responses;
                        expect(responses).toBeDefined();
                        // Should have at least 200 or 201 for success
                        const hasSuccessResponse = Object.keys(responses).some(
                            code => ['200', '201'].includes(code)
                        );
                        expect(hasSuccessResponse).toBe(true);
                    }
                });
            });
        });
    });
});
