/**
 * Unit Tests - Swagger Configuration
 * Test Swagger configuration file
 */

const swaggerSpec = require('../../config/swagger');

describe('Swagger Configuration Unit Tests', () => {
    describe('Swagger Spec Structure', () => {
        test('✅ should export swagger spec', () => {
            expect(swaggerSpec).toBeDefined();
            expect(typeof swaggerSpec).toBe('object');
        });

        test('✅ should have OpenAPI version 3.0.0', () => {
            expect(swaggerSpec.openapi).toBe('3.0.0');
        });

        test('✅ should have info object', () => {
            expect(swaggerSpec.info).toBeDefined();
            expect(typeof swaggerSpec.info).toBe('object');
        });

        test('✅ should have components object', () => {
            expect(swaggerSpec.components).toBeDefined();
            expect(typeof swaggerSpec.components).toBe('object');
        });

        test('✅ should have paths object', () => {
            expect(swaggerSpec.paths).toBeDefined();
            expect(typeof swaggerSpec.paths).toBe('object');
        });
    });

    describe('Info Object', () => {
        test('✅ should have title', () => {
            expect(swaggerSpec.info.title).toBe('Backend API Documentation');
        });

        test('✅ should have version', () => {
            expect(swaggerSpec.info.version).toBe('1.0.0');
        });

        test('✅ should have description', () => {
            expect(swaggerSpec.info.description).toBeDefined();
            expect(typeof swaggerSpec.info.description).toBe('string');
        });

        test('✅ should have contact information', () => {
            expect(swaggerSpec.info.contact).toBeDefined();
            expect(swaggerSpec.info.contact.name).toBeDefined();
            expect(swaggerSpec.info.contact.email).toBeDefined();
        });
    });

    describe('Servers Configuration', () => {
        test('✅ should have at least one server', () => {
            expect(swaggerSpec.servers).toBeDefined();
            expect(Array.isArray(swaggerSpec.servers)).toBe(true);
            expect(swaggerSpec.servers.length).toBeGreaterThan(0);
        });

        test('✅ should have development server', () => {
            const devServer = swaggerSpec.servers.find(
                server => server.description === 'Development server'
            );
            expect(devServer).toBeDefined();
            expect(devServer.url).toBeDefined();
        });

        test('✅ should have production server', () => {
            const prodServer = swaggerSpec.servers.find(
                server => server.description === 'Production server'
            );
            expect(prodServer).toBeDefined();
            expect(prodServer.url).toBe('https://api.dtv2405.id.vn');
        });
    });

    describe('Security Schemes', () => {
        test('✅ should have bearerAuth scheme', () => {
            const bearerAuth = swaggerSpec.components.securitySchemes.bearerAuth;
            expect(bearerAuth).toBeDefined();
            expect(bearerAuth.type).toBe('http');
            expect(bearerAuth.scheme).toBe('bearer');
            expect(bearerAuth.bearerFormat).toBe('JWT');
        });

        test('✅ should have cookieAuth scheme', () => {
            const cookieAuth = swaggerSpec.components.securitySchemes.cookieAuth;
            expect(cookieAuth).toBeDefined();
            expect(cookieAuth.type).toBe('apiKey');
            expect(cookieAuth.in).toBe('cookie');
            expect(cookieAuth.name).toBe('connect.sid');
        });
    });

    describe('Common Schemas', () => {
        test('✅ should have Error schema', () => {
            const errorSchema = swaggerSpec.components.schemas.Error;
            expect(errorSchema).toBeDefined();
            expect(errorSchema.type).toBe('object');
            expect(errorSchema.properties).toBeDefined();
        });

        test('✅ should have Success schema', () => {
            const successSchema = swaggerSpec.components.schemas.Success;
            expect(successSchema).toBeDefined();
            expect(successSchema.type).toBe('object');
            expect(successSchema.properties).toBeDefined();
        });

        test('✅ Error schema should have correct properties', () => {
            const errorSchema = swaggerSpec.components.schemas.Error;
            expect(errorSchema.properties.success).toBeDefined();
            expect(errorSchema.properties.success.type).toBe('boolean');
            expect(errorSchema.properties.message).toBeDefined();
            expect(errorSchema.properties.message.type).toBe('string');
        });

        test('✅ Success schema should have correct properties', () => {
            const successSchema = swaggerSpec.components.schemas.Success;
            expect(successSchema.properties.success).toBeDefined();
            expect(successSchema.properties.success.type).toBe('boolean');
            expect(successSchema.properties.message).toBeDefined();
            expect(successSchema.properties.message.type).toBe('string');
            expect(successSchema.properties.data).toBeDefined();
            expect(successSchema.properties.data.type).toBe('object');
        });
    });

    describe('Global Security', () => {
        test('✅ should have default security defined', () => {
            expect(swaggerSpec.security).toBeDefined();
            expect(Array.isArray(swaggerSpec.security)).toBe(true);
            expect(swaggerSpec.security.length).toBeGreaterThan(0);
        });

        test('✅ should include bearerAuth in default security', () => {
            const hasBearerAuth = swaggerSpec.security.some(
                sec => sec.bearerAuth !== undefined
            );
            expect(hasBearerAuth).toBe(true);
        });

        test('✅ should include cookieAuth in default security', () => {
            const hasCookieAuth = swaggerSpec.security.some(
                sec => sec.cookieAuth !== undefined
            );
            expect(hasCookieAuth).toBe(true);
        });
    });

    describe('Paths Documentation', () => {
        test('✅ should have authentication paths', () => {
            const authPaths = [
                '/auth/login',
                '/auth/register',
                '/auth/logout',
                '/auth/refresh-token'
            ];

            authPaths.forEach(path => {
                expect(swaggerSpec.paths[path]).toBeDefined();
            });
        });

        test('✅ should have API paths', () => {
            const apiPaths = [
                '/api/health',
                '/api/products',
                '/api/categories'
            ];

            apiPaths.forEach(path => {
                expect(swaggerSpec.paths[path]).toBeDefined();
            });
        });

        test('✅ login endpoint should have POST method', () => {
            const loginPath = swaggerSpec.paths['/auth/login'];
            expect(loginPath.post).toBeDefined();
        });

        test('✅ register endpoint should have POST method', () => {
            const registerPath = swaggerSpec.paths['/auth/register'];
            expect(registerPath.post).toBeDefined();
        });

        test('✅ health endpoint should have GET method', () => {
            const healthPath = swaggerSpec.paths['/api/health'];
            expect(healthPath.get).toBeDefined();
        });
    });

    describe('Endpoint Documentation Quality', () => {
        test('✅ endpoints should have summaries', () => {
            Object.keys(swaggerSpec.paths).forEach(path => {
                const pathObj = swaggerSpec.paths[path];
                Object.keys(pathObj).forEach(method => {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        expect(pathObj[method].summary).toBeDefined();
                        expect(typeof pathObj[method].summary).toBe('string');
                        expect(pathObj[method].summary.length).toBeGreaterThan(0);
                    }
                });
            });
        });

        test('✅ endpoints should have tags', () => {
            Object.keys(swaggerSpec.paths).forEach(path => {
                const pathObj = swaggerSpec.paths[path];
                Object.keys(pathObj).forEach(method => {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        expect(pathObj[method].tags).toBeDefined();
                        expect(Array.isArray(pathObj[method].tags)).toBe(true);
                        expect(pathObj[method].tags.length).toBeGreaterThan(0);
                    }
                });
            });
        });

        test('✅ POST endpoints that require body should have requestBody', () => {
            // Only check endpoints that typically require request body
            const endpointsRequiringBody = [
                '/auth/login',
                '/auth/register',
                '/auth/refresh-token',
                '/auth/reset-password',
                '/auth/forgot-password'
            ];

            endpointsRequiringBody.forEach(path => {
                if (swaggerSpec.paths[path]?.post) {
                    expect(swaggerSpec.paths[path].post.requestBody).toBeDefined();
                }
            });
        });

        test('✅ endpoints should have responses defined', () => {
            Object.keys(swaggerSpec.paths).forEach(path => {
                const pathObj = swaggerSpec.paths[path];
                Object.keys(pathObj).forEach(method => {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        expect(pathObj[method].responses).toBeDefined();
                        expect(typeof pathObj[method].responses).toBe('object');
                        expect(Object.keys(pathObj[method].responses).length).toBeGreaterThan(0);
                    }
                });
            });
        });
    });
});
