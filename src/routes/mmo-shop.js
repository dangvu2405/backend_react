const express = require('express');
const router = express.Router();
const MMOShopController = require('../app/controllers/MMOShopController');

/**
 * @swagger
 * components:
 *   schemas:
 *     MMOProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *           enum: [gold, items, accounts, services]
 *         game:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, out_of_stock]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/mmo-shop/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm MMO
 *     tags: [MMO Shop]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [gold, items, accounts, services, all]
 *           default: all
 *       - in: query
 *         name: game
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, popular, name_asc]
 *           default: newest
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MMOProduct'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 */
router.get('/products', MMOShopController.getProducts);

/**
 * @swagger
 * /api/mmo-shop/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm MMO
 *     tags: [MMO Shop]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MMOProduct'
 *       404:
 *         description: Sản phẩm không tồn tại
 */
router.get('/products/:id', MMOShopController.getProduct);

/**
 * @swagger
 * /api/mmo-shop/games:
 *   get:
 *     summary: Lấy danh sách games
 *     tags: [MMO Shop]
 *     responses:
 *       200:
 *         description: Danh sách games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/games', MMOShopController.getGames);

/**
 * @swagger
 * /api/mmo-shop/categories:
 *   get:
 *     summary: Lấy danh sách categories với số lượng sản phẩm
 *     tags: [MMO Shop]
 *     responses:
 *       200:
 *         description: Danh sách categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get('/categories', MMOShopController.getCategories);

module.exports = router;
