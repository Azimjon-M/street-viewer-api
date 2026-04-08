const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const dirs = ['full', 'mobile', 'thumb', 'minimap', 'module-thumb'];
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
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

module.exports = upload;
