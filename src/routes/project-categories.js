const express = require('express');
const router = express.Router();
const DoAnController = require('../app/controllers/DoAnController');

/**
 * @swagger
 * /api/project-categories:
 *   get:
 *     summary: Lấy danh sách danh mục đồ án
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subject, level, format]
 *         description: Loại danh mục
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/', DoAnController.getCategories);

module.exports = router;
