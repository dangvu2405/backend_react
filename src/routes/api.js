const express = require('express');
const router = express.Router();
const { uploadLimiter } = require('../app/middlewares/rateLimit.middleware');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Kiểm tra trạng thái API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    });
});

// Routes cho SanPham và LoaiSanPham đã được xóa
// Sử dụng DoAn và LoaiDoAn thay thế
router.post('/upload', uploadLimiter, async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu dữ liệu ảnh để upload',
            });
        }

        // Validate image là string
        if (typeof image !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu ảnh không hợp lệ. Phải là chuỗi base64.',
            });
        }

        // ✅ Validate base64 size (ước tính)
        const base64Size = (image.length * 3) / 4;
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (base64Size > MAX_SIZE) {
            return res.status(400).json({
                success: false,
                message: `Kích thước file không được vượt quá ${MAX_SIZE / 1024 / 1024}MB`,
            });
        }

        // ✅ Validate file type từ base64
        const matches = image.match(/^data:image\/(\w+);base64,/);
        if (!matches) {
            // Nếu không có data:image prefix, thử upload trực tiếp (có thể đã là base64 thuần)
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Image không có data:image prefix, thử upload trực tiếp');
            }
        }

        const fileType = matches ? matches[1].toLowerCase() : null;
        const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
        if (fileType && !allowedTypes.includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`,
            });
        }

        // Kiểm tra Cloudinary config
        const missingConfigs = [];
        if (!process.env.CLOUDINARY_CLOUD_NAME) missingConfigs.push('CLOUDINARY_CLOUD_NAME');
        if (!process.env.CLOUDINARY_API_KEY) missingConfigs.push('CLOUDINARY_API_KEY');
        if (!process.env.CLOUDINARY_API_SECRET) missingConfigs.push('CLOUDINARY_API_SECRET');
        
        if (missingConfigs.length > 0) {
            console.error('❌ Cloudinary config missing:', {
                cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
                api_key: !!process.env.CLOUDINARY_API_KEY,
                api_secret: !!process.env.CLOUDINARY_API_SECRET,
                missing: missingConfigs
            });
            return res.status(500).json({
                success: false,
                message: `Cấu hình Cloudinary chưa được thiết lập. Vui lòng thêm các biến môi trường sau vào file .env: ${missingConfigs.join(', ')}`,
                missingConfigs: missingConfigs
            });
        }

        // Upload lên Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'product_images',
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' }
            ]
        });

        if (!result || !result.secure_url) {
            throw new Error('Cloudinary không trả về URL hợp lệ');
        }

        res.json({
            success: true,
            message: 'Upload thành công',
            data: {
                url: result.secure_url,
                public_id: result.public_id,
            },
        });
    } catch (error) {
        console.error('❌ Upload image error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            http_code: error.http_code,
            response: error.response
        });
        
        // Xử lý lỗi Cloudinary cụ thể
        if (error.http_code) {
            return res.status(error.http_code).json({
                success: false,
                message: error.message || 'Upload thất bại',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Upload thất bại',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



module.exports = router;

