/**
 * Integration Tests - Auth Endpoints
 * Test các API endpoint authentication
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/test.db');
const { createTestUser, createTestAdmin } = require('../helpers/test.helpers');

// Import app
let app;

describe('Auth API Integration Tests', () => {
    let testUser, testAdmin;

    beforeAll(async () => {
        await connectTestDB();
        
        // Setup Express app
        app = require('../../server');
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        testUser = await createTestUser({
            TenDangNhap: 'testuser',
            Email: 'test@example.com',
            MatKhau: await require('../../utils/password').hashPassword('password123')
        });
    });

    describe('POST /auth/register', () => {
        test('✅ should register new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com',
                    password: 'password123',
                    hoten: 'New User',
                    sdt: '0912345678'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user).not.toHaveProperty('MatKhau');
            expect(response.body.data.user).not.toHaveProperty('password');
        });

        test('❌ should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'differentuser',
                    email: 'test@example.com', // Đã tồn tại
                    password: 'password123',
                    hoten: 'Test User',
                    sdt: '0912345678'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.email).toBeDefined();
        });

        test('❌ should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'newuser',
                    email: 'invalid-email',
                    password: 'password123',
                    hoten: 'Test User',
                    sdt: '0912345678'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.email).toBeDefined();
        });

        test('❌ should fail with password < 8 characters', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com',
                    password: '1234567', // < 8
                    hoten: 'Test User',
                    sdt: '0912345678'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.password).toBeDefined();
        });
    });

    describe('POST /auth/login', () => {
        test('✅ should login with email successfully', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data.user).not.toHaveProperty('MatKhau');
        });

        test('✅ should login with username successfully', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('❌ should fail with wrong password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'AUTH_001');
        });

        test('❌ should fail with non-existent user', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/refresh-token', () => {
        test('✅ should refresh token successfully', async () => {
            // Login first
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    username: 'test@example.com',
                    password: 'password123'
                });

            const cookies = loginResponse.headers['set-cookie'];
            const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));

            // Refresh token
            const response = await request(app)
                .post('/auth/refresh-token')
                .set('Cookie', refreshTokenCookie);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
        });

        test('❌ should fail with invalid refresh token', async () => {
            const response = await request(app)
                .post('/auth/refresh-token')
                .set('Cookie', 'refreshToken=invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/logout', () => {
        test('✅ should logout successfully', async () => {
            // Login first
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    username: 'test@example.com',
                    password: 'password123'
                });

            const accessToken = loginResponse.body.data.accessToken;
            const cookies = loginResponse.headers['set-cookie'];
            const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));

            // Logout
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', refreshTokenCookie);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
