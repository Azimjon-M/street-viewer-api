const Module = require('../models/Module');
const Scene = require('../models/Scene');
const MiniMap = require('../models/MiniMap');

// ─── GET /api/modules ─────────────────────────────────────────
// Barcha modullarni olish (faqat faol modullar, tartib bo'yicha)
const getAllModules = async (req, res) => {
    try {
        const filter = {};
        // Agar query da ?all=true bo'lmasa, faqat faol modullarni ko'rsatadi
        if (req.query.all !== 'true') {
            filter.isActive = true;
        }

        const modules = await Module.find(filter).sort({ order: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            count: modules.length,
            data: modules,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch modules',
            error: error.message,
        });
    }
};

// ─── GET /api/modules/:moduleSlug ─────────────────────────────
// Bitta modulni slug bo'yicha olish
const getModuleBySlug = async (req, res) => {
    try {
        const mod = await Module.findOne({ slug: req.params.moduleSlug });
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug}" slug li modul topilmadi`,
            });
        }
        res.status(200).json({ success: true, data: mod });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch module',
            error: error.message,
        });
    }
};

// ─── POST /api/modules ────────────────────────────────────────
// Yangi modul yaratish
const createModule = async (req, res) => {
    try {
        // Slug ni trim va lowercase
        if (req.body.slug && typeof req.body.slug === 'string') {
            req.body.slug = req.body.slug.trim().toLowerCase();
        }

        // Dublikat tekshirish
        const existing = await Module.findOne({ slug: req.body.slug });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `"${req.body.slug}" slug li modul allaqachon mavjud`,
            });
        }

        const mod = await Module.create(req.body);

        // Modul uchun bo'sh MiniMap yaratish
        await MiniMap.findOneAndUpdate(
            { moduleSlug: mod.slug },
            { $setOnInsert: { moduleSlug: mod.slug, image: '', width: 0, height: 0, scenes: [] } },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: 'Modul muvaffaqiyatli yaratildi',
            data: mod,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages,
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `"${req.body.slug}" slug li modul allaqachon mavjud`,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create module',
            error: error.message,
        });
    }
};

// ─── PATCH /api/modules/:moduleSlug ───────────────────────────
// Modulni yangilash (slug o'zgartirib bo'lmaydi)
const updateModule = async (req, res) => {
    try {
        // Slug o'zgartirishga ruxsat bermaydi
        if (req.body.slug && req.body.slug !== req.params.moduleSlug) {
            return res.status(400).json({
                success: false,
                message: 'Modul slug ini o\'zgartirish mumkin emas',
            });
        }

        const updates = { ...req.body };
        delete updates.slug; // Slug o'zgartirishni bloklash

        const mod = await Module.findOneAndUpdate(
            { slug: req.params.moduleSlug },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug}" slug li modul topilmadi`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Modul yangilandi',
            data: mod,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update module',
            error: error.message,
        });
    }
};

// ─── DELETE /api/modules/:moduleSlug ──────────────────────────
// Modulni o'chirish (faqat bo'sh modul — sahnalari yo'q bo'lganda)
const deleteModule = async (req, res) => {
    try {
        const { moduleSlug } = req.params;

        // Default modulni o'chirishga ruxsat bermaydi
        if (moduleSlug === 'default') {
            return res.status(400).json({
                success: false,
                message: 'Default modulni o\'chirish mumkin emas',
            });
        }

        // Modulga tegishli sahnalar mavjudligini tekshirish
        const sceneCount = await Scene.countDocuments({ moduleSlug });
        if (sceneCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Modulda ${sceneCount} ta sahna mavjud. Avval sahnalarni o'chiring.`,
            });
        }

        const mod = await Module.findOneAndDelete({ slug: moduleSlug });
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${moduleSlug}" slug li modul topilmadi`,
            });
        }

        // Modulga tegishli MiniMap ni ham o'chirish
        await MiniMap.deleteOne({ moduleSlug });

        res.status(200).json({
            success: true,
            message: `"${moduleSlug}" moduli muvaffaqiyatli o'chirildi`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete module',
            error: error.message,
        });
    }
};

// ─── Ensure default module exists (called on server start) ────
const ensureDefaultModule = async () => {
    const existing = await Module.findOne({ slug: 'default' });
    if (!existing) {
        await Module.create({
            slug: 'default',
            name: { uz: 'Asosiy', ru: 'Основной', en: 'Default' },
            description: { uz: 'Asosiy modul', ru: 'Основной модуль', en: 'Default module' },
            order: 0,
            isActive: true,
        });
        console.log('📦 [Module] Default modul yaratildi.');
    }
};

module.exports = {
    getAllModules,
    getModuleBySlug,
    createModule,
    updateModule,
    deleteModule,
    ensureDefaultModule,
};
