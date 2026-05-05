const MiniMap = require('../models/MiniMap');
const Module = require('../models/Module');

// ─── Helper: moduleSlug dan Module ni olish ───────────────────
const resolveModule = async (req) => {
    const slug = req.params.moduleSlug || 'default';
    const mod = await Module.findOne({ slug });
    return mod;
};

// ─── Ensure MiniMap exists for a module (called on server start) ──
const ensureDefaultMiniMap = async (moduleSlug = 'default') => {
    const mod = await Module.findOne({ slug: moduleSlug });
    if (!mod) return;

    const existing = await MiniMap.findOne({ moduleId: mod._id });
    if (!existing) {
        await MiniMap.create({
            moduleId: mod._id,
            moduleSlug: mod.slug,
            image: '', width: 0, height: 0, scenes: [], floors: [], defaultFloor: 1
        });
        console.log(`🗺️  [MiniMap] "${moduleSlug}" modul uchun MiniMap yaratildi.`);
    }
};

// ─── GET /minimap ─────────────────────────────────────────────
// Modul bo'yicha MiniMap ni olish
const getMiniMap = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" modul topilmadi.`,
            });
        }

        const miniMap = await MiniMap.findOne({ moduleId: mod._id });
        if (!miniMap) {
            return res.status(404).json({
                success: false,
                message: `"${mod.slug}" modul uchun MiniMap topilmadi.`,
            });
        }
        res.status(200).json({ success: true, data: miniMap });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch minimap', error: error.message });
    }
};

// ─── POST /minimap ────────────────────────────────────────────
// Modul MiniMap asosiy datasini o'rnatish (eski format — backward compat)
const setMiniMap = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" modul topilmadi.`,
            });
        }

        const { image, width, height } = req.body;

        if (!image || !width || !height) {
            return res.status(400).json({
                success: false,
                message: '`image`, `width` va `height` majburiy fieldlar.',
            });
        }

        const miniMap = await MiniMap.findOneAndUpdate(
            { moduleId: mod._id },
            { $set: { image, width, height, moduleSlug: mod.slug } },
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
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" modul topilmadi.`,
            });
        }

        const allowed = ['image', 'width', 'height', 'scenes', 'floors', 'defaultFloor'];
        const updates = {};

        allowed.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Hech qanday yangilanadigan field yo'q. Ruxsat etilganlar: " + allowed.join(', '),
            });
        }

        const miniMap = await MiniMap.findOneAndUpdate(
            { moduleId: mod._id },
            { $set: { ...updates, moduleSlug: mod.slug } },
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
