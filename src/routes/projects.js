const express = require('express');
const router = express.Router();
const DoAnController = require('../app/controllers/DoAnController');

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Lấy danh sách đồ án
 *     tags: [Projects]
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID danh mục (MaLoaiDoAn)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           enum: [Web Development, Mobile App, AI/ML, Full-stack, Backend, Frontend, Other]
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ]
 *       - in: query
 *         name: techStack
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
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
 *           enum: [newest, price_asc, price_desc, popular, rating, downloads]
 *           default: newest
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách đồ án
 */
router.get('/', DoAnController.getProjects);

/**
 * @swagger
 * /api/projects/top:
 *   get:
 *     summary: Lấy top đồ án
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [downloads, rating]
 *           default: downloads
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top đồ án
 */
router.get('/top', DoAnController.getTopProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Lấy chi tiết đồ án
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết đồ án
 *       404:
 *         description: Đồ án không tồn tại
 */
router.get('/:id', DoAnController.getProject);

/**
 * @swagger
 * /api/projects/{id}/similar:
 *   get:
 *     summary: Lấy danh sách đồ án tương tự
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Danh sách đồ án tương tự
 */
router.get('/:id/similar', DoAnController.getSimilarProjects);

module.exports = router;
