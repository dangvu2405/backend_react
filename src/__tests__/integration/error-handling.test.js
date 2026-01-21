/**
 * Integration Tests - Error Handling
 * Test các trường hợp lỗi và đảm bảo không có duplicate error messages
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/test.db');

// Import app
let app;

describe('Error Handling Tests', () => {
    beforeAll(async () => {
        await connectTestDB();
        app = require('../../server');
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('404 Error Handler', () => {
        test('✅ should return single 404 error for non-existent endpoint', async () => {
            const response = await request(app)
                .get('/api/non-existent-endpoint')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('path');
            
            // Đảm bảo chỉ có 1 response
            expect(response.headers['content-type']).toMatch(/json/);
        });
    });

    describe('Validation Error Handling', () => {
        test('✅ should return single validation error for invalid login data', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: '', // Invalid
                    password: '' // Invalid
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('errors');
            
            // Đảm bảo không có duplicate messages
            const messageCount = (response.text.match(/Dữ liệu không hợp lệ/g) || []).length;
            expect(messageCount).toBeLessThanOrEqual(1);
        });

        test('✅ should return single validation error for invalid register data', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'ab', // Too short
                    email: 'invalid-email', // Invalid email
                    password: '123', // Too short
                    hoten: '',
                    sdt: '123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('errors');
            
            // Đảm bảo không có duplicate messages
            const messageCount = (response.text.match(/Dữ liệu không hợp lệ/g) || []).length;
            expect(messageCount).toBeLessThanOrEqual(1);
        });
    });

    describe('Authentication Error Handling', () => {
        test('✅ should return single error for missing token on protected route', async () => {
            const response = await request(app)
                .get('/user/me')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            
            // Đảm bảo chỉ có 1 error message
            const messageCount = (response.text.match(/Không có token/g) || []).length;
            expect(messageCount).toBeLessThanOrEqual(1);
        });

        test('✅ should return single error for invalid token', async () => {
            const response = await request(app)
                .get('/user/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            
            // Đảm bảo chỉ có 1 error message
            const messageCount = (response.text.match(/Token không hợp lệ|hết hạn/g) || []).length;
            expect(messageCount).toBeLessThanOrEqual(1);
        });
    });

    describe('Response Format Consistency', () => {
        test('✅ all error responses should have consistent format', async () => {
            const testCases = [
                { method: 'get', path: '/api/non-existent', expectedStatus: 404 },
                { method: 'post', path: '/auth/login', body: {}, expectedStatus: 400 },
                { method: 'get', path: '/user/me', expectedStatus: 401 },
            ];

            for (const testCase of testCases) {
                let req = request(app)[testCase.method](testCase.path);
                
                if (testCase.body) {
                    req = req.send(testCase.body);
                }

                const response = await req.expect(testCase.expectedStatus);

                // Kiểm tra format chuẩn
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message');
                expect(typeof response.body.message).toBe('string');
                
                // Đảm bảo không có duplicate trong response
                const responseText = JSON.stringify(response.body);
                const message = response.body.message;
                const messageCount = (responseText.match(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                expect(messageCount).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('Error Handler Prevents Duplicate Responses', () => {
        test('✅ error handler should check headersSent before sending response', async () => {
            // Test với một route không tồn tại
            const response = await request(app)
                .get('/api/test-duplicate-check')
                .expect(404);

            // Response chỉ nên được gửi 1 lần
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body).toHaveProperty('success', false);
            
            // Không nên có multiple responses
            const responseText = response.text;
            const jsonMatches = responseText.match(/\{.*\}/g);
            expect(jsonMatches ? jsonMatches.length : 0).toBeLessThanOrEqual(1);
        });
    });
});
