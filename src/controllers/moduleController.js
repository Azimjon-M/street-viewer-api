const Module = require('../models/Module');
const Scene = require('../models/Scene');
const MiniMap = require('../models/MiniMap');

// ─── Helper: moduleSlug dan moduleId olish ────────────────────
const resolveModuleId = async (slug) => {
    const mod = await Module.findOne({ slug });
    if (!mod) return null;
    return mod._id;
};

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

        // Modul uchun bo'sh MiniMap yaratish (moduleId bilan)
        await MiniMap.findOneAndUpdate(
            { moduleId: mod._id },
            { $setOnInsert: { moduleId: mod._id, moduleSlug: mod.slug, image: '', width: 0, height: 0, scenes: [] } },
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
// Modulni yangilash (slug o'zgartirish mumkin!)
const updateModule = async (req, res) => {
    try {
        const oldSlug = req.params.moduleSlug;

        // Modulni topish
        const mod = await Module.findOne({ slug: oldSlug });
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${oldSlug}" slug li modul topilmadi`,
            });
        }

        // Yangi slug tekshirish (agar o'zgartirilayotgan bo'lsa)
        let newSlug = null;
        if (req.body.slug && typeof req.body.slug === 'string') {
            newSlug = req.body.slug.trim().toLowerCase();
            
            if (newSlug !== oldSlug) {
                // Yangi slug validatsiya
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Slug faqat kichik lotin harflari, raqamlar va defis (-) dan iborat bo\'lishi kerak',
                    });
                }

                // Dublikat tekshirish
                const existingWithNewSlug = await Module.findOne({ slug: newSlug });
                if (existingWithNewSlug) {
                    return res.status(400).json({
                        success: false,
                        message: `"${newSlug}" slug li modul allaqachon mavjud`,
                    });
                }
            } else {
                newSlug = null; // Slug o'zgartirilmayapti
            }
        }

        // Modulni yangilash
        const updates = { ...req.body };
        if (newSlug) {
            updates.slug = newSlug;
        }

        const updatedMod = await Module.findByIdAndUpdate(
            mod._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Agar slug o'zgartirilgan bo'lsa — bog'langan Scene va MiniMap lardagi moduleSlug ni ham yangilash
        if (newSlug) {
            await Scene.updateMany(
                { moduleId: mod._id },
                { $set: { moduleSlug: newSlug } }
            );
            await MiniMap.updateMany(
                { moduleId: mod._id },
                { $set: { moduleSlug: newSlug } }
            );
        }

        res.status(200).json({
            success: true,
            message: newSlug
                ? `Modul yangilandi. Slug "${oldSlug}" → "${newSlug}" ga o'zgartirildi.`
                : 'Modul yangilandi',
            data: updatedMod,
            slugChanged: !!newSlug,
            newSlug: newSlug || oldSlug,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `Bu slug allaqachon band`,
            });
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

        const mod = await Module.findOne({ slug: moduleSlug });
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${moduleSlug}" slug li modul topilmadi`,
            });
        }

        // Oxirgi qolgan modulni o'chirishga ruxsat bermaydi
        const totalModules = await Module.countDocuments();
        if (totalModules <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Oxirgi modulni o\'chirish mumkin emas. Kamida bitta modul bo\'lishi kerak.',
            });
        }

        // Modulga tegishli sahnalar mavjudligini tekshirish
        const sceneCount = await Scene.countDocuments({ moduleId: mod._id });
        if (sceneCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Modulda ${sceneCount} ta sahna mavjud. Avval sahnalarni o'chiring.`,
            });
        }

        await Module.findByIdAndDelete(mod._id);

        // Modulga tegishli MiniMap ni ham o'chirish
        await MiniMap.deleteOne({ moduleId: mod._id });

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

// ─── Ensure at least one module exists (called on server start) ────
const ensureAtLeastOneModule = async () => {
    const count = await Module.countDocuments();
    if (count === 0) {
        await Module.create({
            slug: 'default',
            name: { uz: 'Asosiy', ru: 'Основной', en: 'Default' },
            description: { uz: 'Asosiy modul', ru: 'Основной модуль', en: 'Default module' },
            order: 0,
            isActive: true,
        });
        console.log('📦 [Module] Hech qanday modul topilmadi, standart modul yaratildi.');
    }
};

// ─── Migratsiya: moduleSlug → moduleId (server startda ishlatiladi) ──
const migrateModuleReferences = async () => {
    // 1. moduleId yo'q bo'lgan Scene larni topib, moduleSlug orqali moduleId qo'yish
    const scenesWithoutModuleId = await Scene.find({ moduleId: { $exists: false } });
    if (scenesWithoutModuleId.length > 0) {
        console.log(`🔄 [Migration] ${scenesWithoutModuleId.length} ta scene moduleId ga migratsiya qilinmoqda...`);
        for (const scene of scenesWithoutModuleId) {
            const mod = await Module.findOne({ slug: scene.moduleSlug });
            if (mod) {
                await Scene.updateOne(
                    { _id: scene._id },
                    { $set: { moduleId: mod._id } }
                );
            } else {
                console.warn(`⚠️ [Migration] "${scene.moduleSlug}" slug li modul topilmadi. Scene ID: ${scene.id}`);
            }
        }
        console.log('✅ [Migration] Scene migratsiyasi yakunlandi.');
    }

    // 2. moduleId yo'q bo'lgan MiniMap larni topib, moduleSlug orqali moduleId qo'yish
    const mapsWithoutModuleId = await MiniMap.find({ moduleId: { $exists: false } });
    if (mapsWithoutModuleId.length > 0) {
        console.log(`🔄 [Migration] ${mapsWithoutModuleId.length} ta MiniMap moduleId ga migratsiya qilinmoqda...`);
        for (const map of mapsWithoutModuleId) {
            const mod = await Module.findOne({ slug: map.moduleSlug });
            if (mod) {
                await MiniMap.updateOne(
                    { _id: map._id },
                    { $set: { moduleId: mod._id } }
                );
            } else {
                console.warn(`⚠️ [Migration] "${map.moduleSlug}" slug li modul topilmadi. MiniMap ID: ${map._id}`);
            }
        }
        console.log('✅ [Migration] MiniMap migratsiyasi yakunlandi.');
    }

    // 3. Pinlarda targetModule yo'q bo'lsa — sahnaning o'z moduli slug i bilan to'ldirish
    //    (cross-module pin feature uchun explicit qiymat kerak)
    const scenesWithPins = await Scene.find({
        'pins.0': { $exists: true },
    }).populate({ path: 'moduleId', select: 'slug' });

    let pinFixCount = 0;
    let sceneFixCount = 0;
    for (const scene of scenesWithPins) {
        const ownSlug = scene.moduleId?.slug || scene.moduleSlug;
        if (!ownSlug) continue;

        let changed = false;
        const newPins = scene.pins.map((pin) => {
            // Faqat navigatsiya pinlarida targetModule kerak; info pinlarda ham bo'lsa ham zarari yo'q
            const hasTarget = pin.target && pin.target.trim() !== '';
            const noTargetModule = !pin.targetModule || pin.targetModule.trim() === '';
            if (hasTarget && noTargetModule) {
                changed = true;
                pinFixCount++;
                return { ...pin.toObject(), targetModule: ownSlug };
            }
            return pin;
        });

        if (changed) {
            scene.pins = newPins;
            await scene.save();
            sceneFixCount++;
        }
    }
    if (pinFixCount > 0) {
        console.log(`✅ [Migration] ${pinFixCount} ta pin (${sceneFixCount} ta sahnada) targetModule bilan to'ldirildi.`);
    }
};

module.exports = {
    getAllModules,
    getModuleBySlug,
    createModule,
    updateModule,
    deleteModule,
    ensureAtLeastOneModule,
    migrateModuleReferences,
    resolveModuleId,
};
