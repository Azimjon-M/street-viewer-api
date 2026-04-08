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

// ─── Main Schema: MiniMap ─────────────────────────────────────
const miniMapSchema = new mongoose.Schema(
    {
        // Qaysi modulga tegishli ekanligi
        // Har bir modul faqat 1 ta MiniMap ga ega bo'ladi (unique index)
        moduleSlug: {
            type: String,
            required: [true, 'Module slug is required'],
            trim: true,
            lowercase: true,
        },
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
miniMapSchema.index({ moduleSlug: 1 }, { unique: true });

module.exports = mongoose.model('MiniMap', miniMapSchema);
