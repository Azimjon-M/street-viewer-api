const express = require('express');
const router = express.Router({ mergeParams: true }); // moduleSlug ni olish uchun
const path = require('path');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

// ─── POST /api/modules/:moduleSlug/upload/scene-images ────────
router.post(
    '/scene-images',
    protect,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'full', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const files = req.files || {};
            const baseUrl = `${req.protocol}://${req.get('host')}`;

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

            const mobileDir = path.join(UPLOAD_ROOT, 'mobile');
            const thumbDir = path.join(UPLOAD_ROOT, 'thumb');

            if (!fs.existsSync(mobileDir)) fs.mkdirSync(mobileDir, { recursive: true });
            if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

            const mobileFilename = filename.replace('image-', 'mobile-').replace('full-', 'mobile-');
            const thumbFilename = filename.replace('image-', 'thumb-').replace('full-', 'thumb-');

            const mobileFilePath = path.join(mobileDir, mobileFilename);
            const thumbFilePath = path.join(thumbDir, thumbFilename);

            // 1. Mobile versiya (2048px, 75%)
            await sharp(originalPath)
                .resize({ width: 2048, withoutEnlargement: true })
                .jpeg({ quality: 75 })
                .toFile(mobileFilePath);

            // 2. Thumb (480x360, 4:3, markazdan)
            await sharp(originalPath)
                .resize(480, 360, { fit: 'cover', position: 'centre' })
                .jpeg({ quality: 80 })
                .toFile(thumbFilePath);

            // 3. Original optimallashtirish (max 4000px, 85%)
            const tempOriginalPath = originalPath + '.tmp.jpg';
            await sharp(originalPath)
                .resize({ width: 4000, withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toFile(tempOriginalPath);

            fs.renameSync(tempOriginalPath, originalPath);

            const result = {
                full: `${baseUrl}/uploads/full/${filename}`,
                mobile: `${baseUrl}/uploads/mobile/${mobileFilename}`,
                thumb: `${baseUrl}/uploads/thumb/${thumbFilename}`,
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

// ─── POST /api/modules/:moduleSlug/upload/minimap-image ───────
router.post('/minimap-image', protect, upload.single('mapImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No minimap image provided',
            });
        }
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(200).json({
            success: true,
            message: 'MiniMap image uploaded successfully',
            data: {
                image: `${baseUrl}/uploads/minimap/${req.file.filename}`,
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

// ─── POST /api/modules/:moduleSlug/upload/module-thumbnail ────
router.post('/module-thumbnail', protect, upload.single('thumbnail'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No thumbnail image provided',
            });
        }
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(200).json({
            success: true,
            message: 'Module thumbnail uploaded successfully',
            data: {
                thumbnail: `${baseUrl}/uploads/module-thumb/${req.file.filename}`,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Thumbnail upload failed',
            error: error.message,
        });
    }
});

module.exports = router;
