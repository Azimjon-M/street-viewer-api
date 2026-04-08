const mongoose = require('mongoose');

// ─── Sub-schema: Multilingual Text ────────────────────────────
const multiLangSchema = new mongoose.Schema(
    {
        uz: { type: String, default: '' },
        ru: { type: String, default: '' },
        en: { type: String, default: '' },
    },
    { _id: false }
);

// ─── Main Schema: Module ──────────────────────────────────────
const moduleSchema = new mongoose.Schema(
    {
        // URL-friendly unikal identifikator (masalan: "fizmat", "texnika")
        slug: {
            type: String,
            required: [true, 'Module slug is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                'Slug faqat kichik lotin harflari, raqamlar va defis (-) dan iborat bo\'lishi kerak',
            ],
        },
        // Ko'p tilli nom
        name: {
            type: multiLangSchema,
            required: [true, 'Module name is required'],
            default: () => ({ uz: '', ru: '', en: '' }),
        },
        // Ko'p tilli tavsif
        description: {
            type: multiLangSchema,
            default: () => ({ uz: '', ru: '', en: '' }),
        },
        // Modul rasmi (fakultet binosi rasmi va hokazo)
        thumbnail: {
            type: String,
            default: '',
        },
        // Tartib raqami (ro'yxatda ko'rsatish uchun)
        order: {
            type: Number,
            default: 0,
        },
        // Faol/nofaol holat
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Index: tartib bo'yicha saralash
moduleSchema.index({ order: 1 });

module.exports = mongoose.model('Module', moduleSchema);
