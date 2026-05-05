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
            const previewDir = path.join(UPLOAD_ROOT, 'preview');

            if (!fs.existsSync(mobileDir)) fs.mkdirSync(mobileDir, { recursive: true });
            if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
            if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

            // Yangi ismlarni yaratish (WebP formatiga o'tkazamiz)
            const mobileFilename = filename.replace('image-', 'mobile-').replace('full-', 'mobile-').replace(/\.[^.]+$/, '.webp');
            const thumbFilename = filename.replace('image-', 'thumb-').replace('full-', 'thumb-').replace(/\.[^.]+$/, '.webp');
            const previewFilename = filename.replace('image-', 'preview-').replace('full-', 'preview-').replace(/\.[^.]+$/, '.webp');
            const finalFullFilename = filename.replace(/\.[^.]+$/, '.webp');

            const mobileFilePath = path.join(mobileDir, mobileFilename);
            const thumbFilePath = path.join(thumbDir, thumbFilename);
            const previewFilePath = path.join(previewDir, previewFilename);

            // 1. Mobile versiya (2048px, WebP 70%)
            await sharp(originalPath)
                .resize({ width: 2048, withoutEnlargement: true })
                .webp({ quality: 70 })
                .toFile(mobileFilePath);

            // 2. Thumb (480x360, WebP 80%)
            await sharp(originalPath)
                .resize(480, 360, { fit: 'cover', position: 'centre' })
                .webp({ quality: 80 })
                .toFile(thumbFilePath);

            // 3. Preview versiya (Progressive load uchun) (1024px, WebP 60%)
            await sharp(originalPath)
                .resize({ width: 1024, withoutEnlargement: true })
                .webp({ quality: 60 })
                .toFile(previewFilePath);

            // 3. Full versiya (max 4000px, WebP 80%)
            const fullFilePath = path.join(UPLOAD_ROOT, 'full', finalFullFilename);
            await sharp(originalPath)
                .resize({ width: 4000, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(fullFilePath);

            // Eski formatdagi originalni o'chiramiz (agar u .webp bo'lib saqlangan bo'lsa)
            if (path.join(UPLOAD_ROOT, 'full', filename) !== fullFilePath) {
                fs.unlinkSync(originalPath);
            }

            const result = {
                full: `/uploads/full/${finalFullFilename}`,
                mobile: `/uploads/mobile/${mobileFilename}`,
                thumb: `/uploads/thumb/${thumbFilename}`,
                preview: `/uploads/preview/${previewFilename}`,
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
router.post('/minimap-image', protect, upload.single('mapImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No minimap image provided',
            });
        }

        // Rasmning o'lchamlarini avtomatik aniqlash
        const sharp = require('sharp');
        const metadata = await sharp(req.file.path).metadata();

        res.status(200).json({
            success: true,
            message: 'MiniMap image uploaded successfully',
            data: {
                image: `/uploads/minimap/${req.file.filename}`,
                width: metadata.width || 1920,
                height: metadata.height || 1080,
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
        res.status(200).json({
            success: true,
            message: 'Module thumbnail uploaded successfully',
            data: {
                thumbnail: `/uploads/module-thumb/${req.file.filename}`,
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

// ─── POST /api/modules/:moduleSlug/upload/pin-audio ───────────
router.post(
    '/pin-audio',
    protect,
    (req, res, next) => {
        const { mixedUpload } = require('../middleware/upload');
        mixedUpload.fields([
            { name: 'audio_uz', maxCount: 1 },
            { name: 'audio_ru', maxCount: 1 },
            { name: 'audio_en', maxCount: 1 },
        ])(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Audio yuklashda xato',
                });
            }
            next();
        });
    },
    (req, res) => {
        try {
            const files = req.files || {};
            const result = {};

            if (files.audio_uz && files.audio_uz[0]) {
                result.uz = `/uploads/audio/${files.audio_uz[0].filename}`;
            }
            if (files.audio_ru && files.audio_ru[0]) {
                result.ru = `/uploads/audio/${files.audio_ru[0].filename}`;
            }
            if (files.audio_en && files.audio_en[0]) {
                result.en = `/uploads/audio/${files.audio_en[0].filename}`;
            }

            if (Object.keys(result).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Kamida bitta audio fayl yuklang (audio_uz, audio_ru yoki audio_en)',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Audio fayl(lar) muvaffaqiyatli yuklandi',
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Audio upload failed',
                error: error.message,
            });
        }
    }
);

module.exports = router;
