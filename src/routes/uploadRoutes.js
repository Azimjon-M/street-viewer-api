const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const { generateThumb } = require('../utils/generateThumb');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

// ════════════════════════════════════════════════════════════════
//  SWAGGER DOCUMENTATION
// ════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/upload/scene-images:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload scene panorama images 🔒
 *     description: |
 *       Upload `full` and/or `mobile` panorama images for a scene.
 *
 *       ### ⚙️ Avtomatik yaratiladi (Mobile, Thumb)
 *       Siz faqat 1 ta `image` ni yuborasiz (yoki `full`). Server undan avtomatik:
 *       1. Original optimizatsiya (masalan, kengligi max 4000px, quality 85%) 
 *       2. Mobile versiya (kenglik 2048px, quality 75%)
 *       3. Thumb versiya (480x360 px markazdan qirqib) yaratib beradi.
 *
 *       **Requires authentication** — include `Authorization: Bearer <token>` header.
 *     operationId: uploadSceneImages
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Only single panorama image needs to be uploaded. Outputs full, mobile and thumb.
 *     responses:
 *       200:
 *         description: Images uploaded and all versions generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadSceneImagesResponse'
 *             example:
 *               success: true
 *               message: Bitta rasmdan barchasi (full, mobile, thumb) yaratildi
 *               data:
 *                 full: http://localhost:5000/uploads/full/image-1705320600000.jpg
 *                 mobile: http://localhost:5000/uploads/mobile/mobile-1705320600000-scene1.jpg
 *                 thumb: http://localhost:5000/uploads/thumb/thumb-1705320600000-scene1.jpg
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/scene-images',
    protect,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'full', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const files = req.files || {};

            // 1 ta qabul qilingan rasmni tanlaymiz ("image" yoki eski interfeysdan "full")
            const uploadedFile = (files.image && files.image[0]) || (files.full && files.full[0]);

            if (!uploadedFile) {
                return res.status(400).json({
                    success: false,
                    message: "Bitta rasm yuklang (misol uchun 'image' field bo'yicha)",
                });
            }

            const sharp = require('sharp');
            const fs = require('fs');

            const originalPath = uploadedFile.path;
            const filename = uploadedFile.filename;

            // Kerakli papkalar
            const mobileDir = path.join(UPLOAD_ROOT, 'mobile');
            const thumbDir = path.join(UPLOAD_ROOT, 'thumb');

            if (!fs.existsSync(mobileDir)) fs.mkdirSync(mobileDir, { recursive: true });
            if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

            // Yangi ismlarni yaratish (WebP formatiga o'tkazamiz)
            const mobileFilename = filename.replace('image-', 'mobile-').replace('full-', 'mobile-').replace(/\.[^.]+$/, '.webp');
            const thumbFilename = filename.replace('image-', 'thumb-').replace('full-', 'thumb-').replace(/\.[^.]+$/, '.webp');
            const finalFullFilename = filename.replace(/\.[^.]+$/, '.webp');

            const mobileFilePath = path.join(mobileDir, mobileFilename);
            const thumbFilePath = path.join(thumbDir, thumbFilename);

            // 1. Mobile versiyasini yaratish (Enini 2048px, WebP 70%)
            await sharp(originalPath)
                .resize({ width: 2048, withoutEnlargement: true })
                .webp({ quality: 70 })
                .toFile(mobileFilePath);

            // 2. Thumb qirqib olish (480x360, WebP 80%)
            await sharp(originalPath)
                .resize(480, 360, { fit: 'cover', position: 'centre' })
                .webp({ quality: 80 })
                .toFile(thumbFilePath);

            // 3. Full versiyasini yaratish (Eni max 4000px, WebP 80%)
            const fullFilePath = path.join(UPLOAD_ROOT, 'full', finalFullFilename);
            await sharp(originalPath)
                .resize({ width: 4000, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(fullFilePath);

            // Agar original fayl nomi o'zgargan bo'lsa (masalan .jpg -> .webp), eski faylni o'chirib tashlaymiz
            if (path.join(UPLOAD_ROOT, 'full', filename) !== fullFilePath) {
                fs.unlinkSync(originalPath);
            }

            const result = {
                full: `/uploads/full/${finalFullFilename}`,
                mobile: `/uploads/mobile/${mobileFilename}`,
                thumb: `/uploads/thumb/${thumbFilename}`,
            };

            res.status(200).json({
                success: true,
                message: 'Bitta rasmdan muvaffaqiyatli saqlandi va barcha qisqartmalar (Full, Mobile, Thumb 4x3) avtorejimda yaratildi',
                data: result,
            });
        } catch (error) {
            console.error('Upload Error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload failed',
                error: error.message || 'Unknown processing error',
            });
        }
    }
);



/**
 * @swagger
 * /api/upload/minimap-image:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload mini-map background image 🔒
 *     description: >
 *       Upload the background image used for the mini-map overview panel.
 *       This is typically a Google Maps screenshot or a custom illustrated map.
 *       After uploading, use the returned URL as the `image` field when calling `POST /api/minimap`.
 *       Also note the original pixel `width` and `height` of your image for accurate scene positioning.
 *       **Requires authentication** — include `Authorization: Bearer <token>` header.
 *     operationId: uploadMiniMapImage
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - mapImage
 *             properties:
 *               mapImage:
 *                 type: string
 *                 format: binary
 *                 description: Map background image file (JPEG/PNG)
 *     responses:
 *       200:
 *         description: Mini-map image uploaded successfully
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
 *                   example: MiniMap image uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     image:
 *                       type: string
 *                       example: http://localhost:5000/uploads/minimap/1705320600000-map.jpg
 *       400:
 *         description: No image provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: No minimap image provided
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/minimap-image', protect, upload.single('mapImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No minimap image provided',
            });
        }
        res.status(200).json({
            success: true,
            message: 'MiniMap image uploaded successfully',
            data: {
                image: `/uploads/minimap/${req.file.filename}`,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message,
        });
    }
});

module.exports = router;
