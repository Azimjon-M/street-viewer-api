const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const dirs = ['full', 'mobile', 'thumb', 'preview', 'minimap', 'module-thumb', 'audio'];
dirs.forEach((dir) => {
    const dirPath = path.join(UPLOAD_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine sub-folder from field name
        const fieldFolderMap = {
            full: 'full',
            mobile: 'mobile',
            thumb: 'thumb',
            mapImage: 'minimap',
            thumbnail: 'module-thumb',
            image: 'full', // Bitta rasm kelganida avval 'full' papkasiga tushadi
            audio_uz: 'audio',
            audio_ru: 'audio',
            audio_en: 'audio',
        };
        const folder = fieldFolderMap[file.fieldname] || 'full';
        cb(null, path.join(UPLOAD_ROOT, folder));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// File type filter (images only)
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|avif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, gif, webp, avif)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 70 * 1024 * 1024 }, // 70 MB max
});

// Audio file type filter
const audioFileFilter = (req, file, cb) => {
    // Rasm fieldlari uchun rasm filtrini, audio fieldlari uchun audio filtrini ishlatish
    if (file.fieldname.startsWith('audio')) {
        const allowed = /mp3|wav|ogg|m4a|webm|mpeg|audio/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = file.mimetype.startsWith('audio/');
        if (extOk || mimeOk) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, webm)'));
        }
    } else {
        // Rasm filtri
        fileFilter(req, file, cb);
    }
};

// Rasm + Audio aralash upload (scene pinlari uchun)
const mixedUpload = multer({
    storage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 70 * 1024 * 1024 },
});

module.exports = upload;
module.exports.mixedUpload = mixedUpload;
