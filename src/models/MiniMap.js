const mongoose = require('mongoose');

// ─── Sub-schema: Scene Node on Mini Map ───────────────────────
const mapSceneSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: [true, 'Scene node ID is required'],
        },
        xPercent: {
            type: Number,
            required: [true, 'xPercent is required'],
            min: 0,
            max: 100,
        },
        yPercent: {
            type: Number,
            required: [true, 'yPercent is required'],
            min: 0,
            max: 100,
        },
        icon: {
            type: String,
            enum: ['pin', 'circle'],
            default: 'circle',
        },
    },
    { _id: false }
);

// ─── Sub-schema: Floor (qavat) ────────────────────────────────
const floorSchema = new mongoose.Schema(
    {
        floor: {
            type: Number,
            required: [true, 'Floor number is required'],
        },
        label: {
            uz: { type: String, default: '' },
            ru: { type: String, default: '' },
            en: { type: String, default: '' },
        },
        image: {
            type: String,
            required: [true, 'Floor plan image is required'],
        },
        width: {
            type: Number,
            default: 1920,
        },
        height: {
            type: Number,
            default: 1080,
        },
        defaultScene: {
            type: String,
            default: '',
        },
        scenes: {
            type: [mapSceneSchema],
            default: [],
        },
    },
    { _id: false }
);

// ─── Main Schema: MiniMap ─────────────────────────────────────
const miniMapSchema = new mongoose.Schema(
    {
        // Qaysi modulga tegishli ekanligi — o'zgarmas ID orqali
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            required: [true, 'Module ID is required'],
        },
        // Eski format uchun backward compatibility (migratsiyagacha)
        moduleSlug: {
            type: String,
            trim: true,
            lowercase: true,
        },

        // ─── Ko'p qavatli tizim (YANGI) ───────────────────────
        floors: {
            type: [floorSchema],
            default: [],
        },
        defaultFloor: {
            type: Number,
            default: 1,
        },

        // ─── Eski format (backward compatibility) ─────────────
        // Agar floors bo'sh bo'lsa, bu fieldlar ishlatiladi
        image: {
            type: String,
            default: '',
        },
        width: {
            type: Number,
            default: 0,
        },
        height: {
            type: Number,
            default: 0,
        },
        scenes: {
            type: [mapSceneSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Har bir modul uchun faqat 1 ta MiniMap bo'lishi mumkin
miniMapSchema.index({ moduleId: 1 }, { unique: true });
// Eski format uchun index (backward compatibility)
miniMapSchema.index({ moduleSlug: 1 });

module.exports = mongoose.model('MiniMap', miniMapSchema);
