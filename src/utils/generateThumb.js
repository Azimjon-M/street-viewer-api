const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Mobile rasmdan avtomatik thumb (4:3 nisbat) yaratadi.
 *
 * Ishlash tartibi:
 *   1. Mobile rasm o'qiladi.
 *   2. Rasm kengligi bo'yicha 4:3 nisbatda mos balandlik hisoblanadi.
 *   3. Rasmning markazidan crop qilinadi.
 *   4. Natija thumb papkasiga JPEG formatda saqlanadi.
 *
 * @param {string} mobileFilePath  - Mobile rasm fayli absolut yo'li
 * @param {string} thumbDir        - Thumb rasmlar saqlanadigan papka yo'li
 * @param {object} [options]
 * @param {number} [options.width=480]       - Thumb kengligi (px)
 * @param {number} [options.aspectW=4]       - Nisbat bo'yicha kenglik qismi
 * @param {number} [options.aspectH=3]       - Nisbat bo'yicha balandlik qismi
 * @param {number} [options.quality=80]      - WebP sifati (1-100)
 * @returns {Promise<string>} - Yaratilgan thumb fayl nomi
 */
const generateThumb = async (mobileFilePath, thumbDir, options = {}) => {
    const {
        width = 480,
        aspectW = 4,
        aspectH = 3,
        quality = 80,
    } = options;

    // Thumb balandligini 4:3 nisbatga qarab hisoblash
    const height = Math.round((width / aspectW) * aspectH); // 480 / 4 * 3 = 360

    // Thumb fayl nomini mobile fayl nomidan yasash
    const mobileBasename = path.basename(mobileFilePath);
    const ext = path.extname(mobileBasename);
    // "mobile-<timestamp>.<ext>" → "thumb-<timestamp>.webp"
    const thumbFilename = 'thumb-' + mobileBasename.replace(/^mobile-/, '').replace(ext, '') + '.webp';
    const thumbFilePath = path.join(thumbDir, thumbFilename);

    // Papka mavjudligini tekshirish
    if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
    }

    // Sharp orqali crop + resize + saqlash
    await sharp(mobileFilePath)
        .resize(width, height, {
            fit: 'cover',       // Nisbatni saqlagan holda markazdan kesadi
            position: 'centre', // Markazdan kesish
        })
        .webp({ quality })
        .toFile(thumbFilePath);

    return thumbFilename;
};

module.exports = { generateThumb };
