const MiniMap = require('../models/MiniMap');

// ─── Helper: moduleSlug ni olish ──────────────────────────────
const getModuleSlug = (req) => req.params.moduleSlug || 'default';

// ─── Ensure MiniMap exists for a module (called on server start) ──
const ensureDefaultMiniMap = async (moduleSlug = 'default') => {
    const existing = await MiniMap.findOne({ moduleSlug });
    if (!existing) {
        await MiniMap.create({ moduleSlug, image: '', width: 0, height: 0, scenes: [] });
        console.log(`🗺️  [MiniMap] "${moduleSlug}" modul uchun MiniMap yaratildi.`);
    }
};

// ─── GET /minimap ─────────────────────────────────────────────
// Modul bo'yicha MiniMap ni olish
const getMiniMap = async (req, res) => {
    try {
        const moduleSlug = getModuleSlug(req);
        const miniMap = await MiniMap.findOne({ moduleSlug });
        if (!miniMap) {
            return res.status(404).json({
                success: false,
                message: `"${moduleSlug}" modul uchun MiniMap topilmadi.`,
            });
        }
        res.status(200).json({ success: true, data: miniMap });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch minimap', error: error.message });
    }
};

// ─── POST /minimap ────────────────────────────────────────────
// Modul MiniMap asosiy datasini o'rnatish
const setMiniMap = async (req, res) => {
    try {
        const moduleSlug = getModuleSlug(req);
        const { image, width, height } = req.body;

        if (!image || !width || !height) {
            return res.status(400).json({
                success: false,
                message: '`image`, `width` va `height` majburiy fieldlar.',
            });
        }

        const miniMap = await MiniMap.findOneAndUpdate(
            { moduleSlug },
            { $set: { image, width, height } },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'MiniMap asosiy data saqlandi.',
            data: miniMap,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
        }
        res.status(500).json({ success: false, message: 'Failed to set minimap', error: error.message });
    }
};

// ─── PATCH /minimap ───────────────────────────────────────────
// Modul MiniMap ni qisman yangilash
const patchMiniMap = async (req, res) => {
    try {
        const moduleSlug = getModuleSlug(req);
        const allowed = ['image', 'width', 'height', 'scenes'];
        const updates = {};

        allowed.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Hech qanday yangilanadigan field yo'q. Ruxsat etilganlar: image, width, height, scenes",
            });
        }

        const miniMap = await MiniMap.findOneAndUpdate(
            { moduleSlug },
            { $set: updates },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'MiniMap yangilandi.',
            updatedFields: Object.keys(updates),
            data: miniMap,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
        }
        res.status(500).json({ success: false, message: 'Failed to patch minimap', error: error.message });
    }
};

module.exports = { getMiniMap, setMiniMap, patchMiniMap, ensureDefaultMiniMap };
