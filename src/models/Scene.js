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

// ─── Sub-schema: Pin ──────────────────────────────────────────
const pinSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            // Avtomatik generatsiya — frontend yuborishga hojat yo'q
            default: () => new mongoose.Types.ObjectId().toHexString(),
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
        target: {
            type: String,
            required: [true, 'Pin target (scene id) is required'],
        },
        icon: {
            type: String,
            enum: ['pin', 'circle'],
            default: 'pin',
        },
    },
    { _id: false }
);

// ─── Sub-schema: Image Variants ───────────────────────────────
const imageSchema = new mongoose.Schema(
    {
        full: { type: String, default: '' },
        mobile: { type: String, default: '' },
        thumb: { type: String, default: '' },
    },
    { _id: false }
);

// ─── Main Schema: Scene ───────────────────────────────────────
const sceneSchema = new mongoose.Schema(
    {
        // Qaysi modulga tegishli ekanligi
        moduleSlug: {
            type: String,
            required: [true, 'Module slug is required'],
            trim: true,
            lowercase: true,
        },
        id: {
            type: String,
            required: [true, 'Scene ID is required'],
            trim: true,
        },
        image: {
            type: imageSchema,
            required: [true, 'Scene images are required'],
        },
        initialScene: {
            type: mongoose.Schema.Types.Mixed,
            default: false,
        },
        northOffset: {
            type: Number,
            default: 0,
        },
        lat: {
            type: Number,
            default: null,
        },
        lng: {
            type: Number,
            default: null,
        },
        pins: {
            type: [pinSchema],
            default: [],
        },
        title: {
            type: multiLangSchema,
            default: () => ({ uz: '', ru: '', en: '' }),
        },
        description: {
            type: multiLangSchema,
            default: () => ({ uz: '', ru: '', en: '' }),
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Compound unique: bitta modul ichida scene id takrorlanmaydi
// Lekin turli modullarda bir xil id ishlatilishi mumkin
sceneSchema.index({ moduleSlug: 1, id: 1 }, { unique: true });
// Modul bo'yicha tezkor qidirish
sceneSchema.index({ moduleSlug: 1, createdAt: 1 });

module.exports = mongoose.model('Scene', sceneSchema);
